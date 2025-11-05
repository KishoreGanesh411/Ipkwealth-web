import { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { useMutation } from "@apollo/client";
import { CREATE_LEAD, ASSIGN_LEAD, REASSIGN_LEAD } from "@/core/graphql/lead/lead.gql";
import Label from "../../form/Label";
import Button from "../../ui/button/Button";
import { Modal } from "../../ui/modal";
import type { LeadFormData } from "../types";
import AssignmentSummaryModal, { AssignSummary } from "../AssignmentSummaryModal/AssignmentSummaryModal";

/* ────────────────────────────────────────────────────────────
   Local helpers & types
   ──────────────────────────────────────────────────────────── */

type RowRecord = Record<string, unknown>;

type ColumnMap = {
  fullName: string;
  phone: string;
  /** "__platform__" uses a platform column (fb/ig/meta) and normalizes to "meta" */
  leadSource: string | "__platform__" | "__other__";
  platformCol?: string;
  otherSource?: string;
  city?: string | "none";
  email?: string | "none";
  remark?: string | "none";
  approachAt?: string | "none"; // created_time column → Date
  qaCols: string[]; // up to 6
};

type Progress = {
  total: number;
  done: number;
  success: number;
  failed: number;
  skipped: number;
  halted?: boolean;
  haltReason?: string;
};

type CreateLeadVars = { input: any }; // use GraphQL shape when sending
type CreateLeadResult = { createIpkLeadd?: { id?: string | null } | null };
type AssignLeadVars = { id: string };
type AssignLeadResult = { assignLead?: { assignedRM?: string | null } | null };
type ReassignLeadVars = { input: { leadId: string; newRmId: string } };
type ReassignLeadResult = { reassignLead?: { assignedRM?: string | null } | null };

const CONCURRENCY = 4;
const toStr = (v: unknown) => (v == null ? "" : String(v));
const trim = (s: string) => s.trim();

// keep last 10 digits; supports "p:+91..." etc
function onlyDigitsLast10(s: string) {
  const d = s.replace(/\D+/g, "");
  return d.slice(-10);
}

function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = trim(fullName).split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts.slice(0, -1).join(" "), lastName: parts.slice(-1)[0] };
}

// Excel serial date → JS Date (works when a cell is a number)
function excelSerialToDate(n: number): Date | null {
  if (!Number.isFinite(n)) return null;
  const o = XLSX.SSF.parse_date_code(n);
  if (!o) return null;
  return new Date(Date.UTC(o.y, (o.m || 1) - 1, o.d || 1, o.H || 0, o.M || 0, o.S || 0));
}

// parse created_time values from ads export or numbers
function parseApproachAt(v: unknown): Date | null {
  if (v == null || v === "") return null;
  if (v instanceof Date && !isNaN(v.getTime())) return v;

  if (typeof v === "number") {
    const d = excelSerialToDate(v);
    if (d) return d;
    const d2 = new Date(v);
    return isNaN(d2.getTime()) ? null : d2;
  }

  if (typeof v === "string") {
    const s = v.trim();
    const maybeIso = /T/.test(s) ? s : s.replace(" ", "T");
    const d = new Date(maybeIso);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function normalizeLeadSource(raw: string) {
  const s = trim(raw).toLowerCase();
  if (!s) return "";
  if (/(facebook|^fb$|meta|instagram|^ig$)/i.test(s)) return "meta";
  return s;
}

/* ────────────────────────────────────────────────────────────
   Component
   ──────────────────────────────────────────────────────────── */

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onImported?: () => void;
  rowsFromForm?: RowRecord[]; // optional pre-provided rows (preview-only)
};

export default function BulkImportModal({ isOpen, onClose, onImported, rowsFromForm }: Props) {
  const previewOnly = Array.isArray(rowsFromForm) && rowsFromForm.length > 0;

  const [rows, setRows] = useState<RowRecord[]>(rowsFromForm ?? []);
  const [headers, setHeaders] = useState<string[]>([]);
  const [setupHidden, setSetupHidden] = useState<boolean>(!!rowsFromForm?.length);

  const [map, setMap] = useState<ColumnMap>({
    fullName: "name",
    phone: "phone",
    leadSource: "__platform__", // typical for ad exports
    platformCol: "platform",
    otherSource: "",
    city: "none",
    email: "none",
    remark: "none",
    approachAt: "none",
    qaCols: [],
  });

  const [createLeadMut] = useMutation<CreateLeadResult, CreateLeadVars>(CREATE_LEAD);
  const [assignLeadMut] = useMutation<AssignLeadResult, AssignLeadVars>(ASSIGN_LEAD);
  const [reassignLeadMut] = useMutation<ReassignLeadResult, ReassignLeadVars>(REASSIGN_LEAD);

  const [processing, setProcessing] = useState(false);
  // After a successful run, freeze the primary action as completed
  const [completed, setCompleted] = useState(false);

  // If input changes (file, mapping), allow running again
  useEffect(() => {
    setCompleted(false);
  }, [rows, map]);
  const [progress, setProgress] = useState<Progress>({
    total: 0,
    done: 0,
    success: 0,
    failed: 0,
    skipped: 0,
  });

  // NEW: assignment summary modal
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summary, setSummary] = useState<AssignSummary | null>(null);

  const failuresRef = useRef<Array<{ rowIndex: number; reason: string; row: RowRecord }>>([]);
  const hasRows = rows.length > 0;

  async function onFile(file: File) {
    try {
      const buf = await file.arrayBuffer();
      // cellDates helps when date cells are stored as serials; defval keeps empty cells
      const wb = XLSX.read(buf, { type: "array", cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      if (!ws) throw new Error("No sheet found");

      const json = XLSX.utils.sheet_to_json<RowRecord>(ws, { defval: "", raw: true });
      if (!json.length) throw new Error("Empty sheet");

      setRows(json);
      const hdrs = Object.keys(json[0] ?? {});
      setHeaders(hdrs);

      // auto-guess some common header names
      const guess = (names: string[], fallback: string) => {
        const low = hdrs.map((h) => h.toLowerCase());
        for (const n of names) {
          const i = low.indexOf(n.toLowerCase());
          if (i !== -1) return hdrs[i];
        }
        return fallback;
      };

      setMap((m) => ({
        ...m,
        fullName: guess(["full_name", "name", "fullname"], m.fullName),
        phone: guess(["phone", "mobile", "phone_number", "p", "p:"], m.phone),
        platformCol: guess(["platform", "source"], m.platformCol || "platform"),
        leadSource: "__platform__", // normalize fb/ig/meta
        city: guess(["city", "location", "area"], "none"),
        email: hdrs.includes("email") ? "email" : "none",
        remark: hdrs.includes("remark") ? "remark" : "none",
        approachAt: guess(["created_time", "created at", "created"], "none"),
        qaCols: [], // user picks Q&A columns
      }));

      setSetupHidden(false);
    } catch {
      alert("Could not parse the Excel file. Please upload a valid .xlsx / .xls / .csv file.");
    }
  }

  function resetFile() {
    setRows([]);
    setHeaders([]);
    setSetupHidden(false);
  }

  // validate which rows can be imported
  const { validIndexes, invalidCount } = useMemo(() => {
    const valids: number[] = [];
    let invalid = 0;

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const fullName = toStr(r[map.fullName] ?? r["name"] ?? r["full_name"]);
      const phone = onlyDigitsLast10(toStr(r[map.phone] ?? r["phone"]));
      let leadSource = "";

      if (map.leadSource === "__platform__") {
        leadSource = normalizeLeadSource(toStr(r[map.platformCol || "platform"]));
      } else if (map.leadSource === "__other__") {
        leadSource = trim(map.otherSource || "");
      } else {
        leadSource = trim(toStr(r[map.leadSource]));
      }

      if (trim(fullName) && phone && leadSource) valids.push(i);
      else invalid++;
    }
    return { validIndexes: valids, invalidCount: invalid };
  }, [rows, map]);

  async function startImport() {
    if (!hasRows) return;

    // reset summary
    setSummary(null);
    setSummaryOpen(false);

    setProcessing(true);
    setCompleted(false);
    setProgress({
      total: validIndexes.length,
      done: 0,
      success: 0,
      failed: 0,
      skipped: invalidCount,
      halted: false,
    });
    failuresRef.current = [];

    const rmCounts: Record<string, number> = {};
    let successCount = 0;
    let failedCount = 0;

    const worker = async (idx: number) => {
      const r = rows[idx] ?? {};
      const rowIndex1 = idx + 2; // + header row

      // resolve fields
      const fullName = toStr(r[map.fullName] ?? r["name"] ?? r["full_name"]);
      const { firstName, lastName } = splitName(fullName);
      const phone = onlyDigitsLast10(toStr(r[map.phone] ?? r["phone"]));

      let leadSource = "";
      if (map.leadSource === "__platform__") {
        leadSource = normalizeLeadSource(toStr(r[map.platformCol || "platform"]));
      } else if (map.leadSource === "__other__") {
        leadSource = trim(map.otherSource || "");
      } else {
        leadSource = trim(toStr(r[map.leadSource]));
      }

      const location = map.city && map.city !== "none" ? trim(toStr(r[map.city])) : "";
      const email = map.email && map.email !== "none" ? trim(toStr(r[map.email])) : "";
      const remark = map.remark && map.remark !== "none" ? trim(toStr(r[map.remark])) : "";

      // optional created_time → approachAt
      const approachAt =
        map.approachAt && map.approachAt !== "none" ? parseApproachAt(r[map.approachAt]) : null;

      // Q&A → GraphQL ClientQaInput[]
      const clientQa =
        map.qaCols.length > 0
          ? map.qaCols
              .slice(0, 6)
              .map((col) => ({ question: col, answer: toStr(r[col]) }))
              .filter((qa) => trim(qa.answer))
          : undefined;

      // Build GraphQL input payload
      const gqlInput: any = {
        firstName,
        lastName,
        phone,
        leadSource,
        email: email || undefined,
        remark: remark || undefined,
        approachAt: approachAt ?? undefined,
        clientQa, // { question, answer }
        location: location || undefined,
      };

      try {
        const c = await createLeadMut({ variables: { input: gqlInput } });
        const id = c.data?.createIpkLeadd?.id;
        if (!id) throw new Error("Create lead returned no id");

        const a = await assignLeadMut({ variables: { id } });
        const assignedRM = a.data?.assignLead?.assignedRM || "Unassigned";
        rmCounts[assignedRM] = (rmCounts[assignedRM] ?? 0) + 1;

        successCount++;
        setProgress((p) => ({ ...p, done: p.done + 1, success: p.success + 1 }));
      } catch (err: any) {
        const msg = err?.graphQLErrors?.[0]?.message ?? err?.message ?? "Unknown error";
        failuresRef.current.push({ rowIndex: rowIndex1, reason: msg, row: r as RowRecord });
        failedCount++;
        setProgress((p) => ({ ...p, done: p.done + 1, failed: p.failed + 1 }));
      }
    };

    let cursor = 0;
    const spawn = async () => {
      while (cursor < validIndexes.length) {
        const idx = validIndexes[cursor++];
        await worker(idx);
      }
    };

    try {
      await Promise.all(Array.from({ length: Math.min(CONCURRENCY, validIndexes.length) }, spawn));

      // Build summary
      const sum: AssignSummary = {
        total: validIndexes.length,
        success: successCount,
        failed: failedCount,
        skipped: invalidCount,
        byRm: rmCounts,
      };
      setSummary(sum);
      setSummaryOpen(true);

      onImported?.();
    } finally {
      setProcessing(false);
      setCompleted(true);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={processing ? () => {} : onClose} className="w-[92vw] max-w-[1200px] m-4">
      <div className="relative w-full max-h-[82vh] overflow-y-auto rounded-3xl bg-white p-5 no-scrollbar dark:bg-gray-900 lg:p-8">
        {/* instructions */}
        <details
          open
          className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-900/10 dark:text-emerald-200"
        >
          <summary className="cursor-pointer select-none text-sm font-semibold">Instructions &amp; validation</summary>
          <ul className="mt-2 list-disc pl-5 text-sm leading-6">
            <li><b>Name</b>, <b>Phone</b>, and <b>Lead Source</b> are mandatory.</li>
            <li>Other fields (Email, Remark, City) are optional.</li>
            <li>Phone is normalized to the last 10 digits.</li>
            <li>If you map <b>Created Time → Approach Date</b>, we store that as <code>approachAt</code>.</li>
            <li><b>Excel recommendation:</b> Prefer true Date/Time cells. If using text, format as ISO
              <code className="mx-1">yyyy-mm-dd</code> or
              <code className="mx-1">yyyy-mm-dd hh:mm</code>.
            </li>
            <li>Select up to 6 <b>Client Q&amp;A</b> columns (header =&gt; <i>question</i>, cell =&gt; <i>answer</i>).</li>
          </ul>
        </details>

        {/* dropzone */}
        {!previewOnly && rows.length === 0 && (
          <div className="rounded-2xl border border-dashed p-4 dark:border-white/10">
            <Label>Upload Excel (.xlsx / .xls / .csv)</Label>
            <label className="mt-2 flex h-40 cursor-pointer items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300">
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
                disabled={processing}
              />
              <div className="text-center">
                <div className="text-sm font-medium">Drag &amp; Drop or Click to Browse</div>
                <div className="text-xs mt-1">.xlsx · .xls · .csv supported</div>
              </div>
            </label>
            <a href="/samples/bulk_sample.xlsx" download className="mt-3 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400">
              Download sample
            </a>
          </div>
        )}

        {/* mapping */}
        {!previewOnly && rows.length > 0 && !setupHidden && (
          <MappingUI
            headers={headers}
            rows={rows}
            map={map}
            setMap={setMap}
            resetFile={resetFile}
            onContinue={() => setSetupHidden(true)}
          />
        )}

        {/* preview */}
        {rows.length > 0 && setupHidden && (
          <PreviewUI
            rows={rows}
            map={map}
            headers={headers}
            validIndexes={validIndexes}
            invalidCount={invalidCount}
            processing={processing}
            completed={completed}
            onEditMapping={() => { setSetupHidden(false); setCompleted(false); }}
            onStart={startImport}
          />
        )}

        {/* progress overlay */}
        {processing && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-3xl bg-white/70 dark:bg-black/40">
            <div className="min-w-[320px] rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900">
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-transparent" />
                <div className="font-medium">Assigning leads…</div>
              </div>
              <div className="mt-4 text-sm">
                {progress.done} / {progress.total} processed ·
                <span className="text-emerald-600"> {progress.success} success</span> ·
                <span className="text-amber-600"> {progress.skipped} skipped</span> ·
                <span className="text-rose-600"> {progress.failed} failed</span>
              </div>
              <div
                className="mt-3 h-2 w-full overflow-hidden rounded bg-gray-200 dark:bg-white/10"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={progress.total}
                aria-valuenow={progress.done}
              >
                <div
                  className="h-2 rounded bg-gray-800 transition-all dark:bg-white/80"
                  style={{ width: `${Math.min(100, (progress.done / Math.max(1, progress.total)) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Completion summary modal */}
      <AssignmentSummaryModal open={summaryOpen} onClose={() => setSummaryOpen(false)} summary={summary} />
    </Modal>
  );
}

/* ------------------- Extracted small UIs to keep file tidy ------------------- */

function MappingUI({
  headers,
  rows,
  map,
  setMap,
  resetFile,
  onContinue,
}: {
  headers: string[];
  rows: RowRecord[];
  map: ColumnMap;
  setMap: (m: ColumnMap) => void;
  resetFile: () => void;
  onContinue: () => void;
}) {
  // Count valids for live feedback
  const { valid, invalid } = useMemo(() => {
    let v = 0, inv = 0;
    for (const r of rows) {
      const name = toStr(r[map.fullName] ?? r["name"] ?? r["full_name"]);
      const phone = onlyDigitsLast10(toStr(r[map.phone] ?? r["phone"]));
      const src =
        map.leadSource === "__platform__"
          ? normalizeLeadSource(toStr(r[map.platformCol || "platform"]))
          : map.leadSource === "__other__"
          ? trim(map.otherSource || "")
          : trim(toStr(r[map.leadSource]));
      if (trim(name) && phone && src) v++;
      else inv++;
    }
    return { valid: v, invalid: inv };
  }, [rows, map]);

  return (
    <div className="mt-6 rounded-2xl border p-4 dark:border-white/10">
      <div className="mb-3 text-sm font-medium">
        Map Columns · Valid rows detected:{" "}
        <b className="text-emerald-600">{valid}</b> / {rows.length} ·
        Skipped (invalid): <b className="text-amber-600">{invalid}</b>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <SelectField label="Full Name" value={map.fullName} onChange={(v) => setMap({ ...map, fullName: v })} headers={headers} />
        <SelectField label="Phone" value={map.phone} onChange={(v) => setMap({ ...map, phone: v })} headers={headers} />

        <div>
          <Label>Lead Source (column)</Label>
          <select
            className="mt-1 w-full rounded-md border px-3 py-2 dark:border-white/10 dark:bg-white/5"
            value={map.leadSource}
            onChange={(e) => setMap({ ...map, leadSource: e.target.value as ColumnMap["leadSource"] })}
          >
            <option value="__platform__">Platform (facebook/meta/ig → meta)</option>
            <option value="__other__">Other (type)</option>
            {headers.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>

          {map.leadSource === "__platform__" && (
            <div className="mt-2">
              <Label className="text-xs">Platform column</Label>
              <select
                className="mt-1 w-full rounded-md border px-3 py-2 dark:border-white/10 dark:bg-white/5"
                value={map.platformCol || ""}
                onChange={(e) => setMap({ ...map, platformCol: e.target.value })}
              >
                {headers.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-gray-500">
                Values like FB/IG/Meta normalize to <b>meta</b>.
              </p>
            </div>
          )}

          {map.leadSource === "__other__" && (
            <div className="mt-2">
              <Label className="text-xs">Type custom source</Label>
              <input
                className="mt-1 w-full rounded-md border px-3 py-2 dark:border-white/10 dark:bg-white/5"
                placeholder="e.g. webinar, walk-in, partner…"
                value={map.otherSource || ""}
                onChange={(e) => setMap({ ...map, otherSource: e.target.value })}
              />
            </div>
          )}
        </div>

        <SelectField
          label="Email (optional)"
          value={map.email ?? "none"}
          onChange={(v) => setMap({ ...map, email: v as any })}
          headers={headers}
          allowNone
        />
        <SelectField
          label="City / Location (optional)"
          value={map.city ?? "none"}
          onChange={(v) => setMap({ ...map, city: v as any })}
          headers={headers}
          allowNone
        />
        <SelectField
          label="Remark (optional)"
          value={map.remark ?? "none"}
          onChange={(v) => setMap({ ...map, remark: v as any })}
          headers={headers}
          allowNone
        />
        <SelectField
          label="Created Time → Approach Date (optional)"
          value={map.approachAt ?? "none"}
          onChange={(v) => setMap({ ...map, approachAt: v as any })}
          headers={headers}
          allowNone
        />

        {/* Q&A */}
        <div className="md:col-span-2 lg:col-span-3">
          <Label>Client Q&amp;A columns (select up to 6)</Label>
          <select
            multiple
            className="mt-1 h-32 w-full rounded-md border px-3 py-2 dark:border-white/10 dark:bg-white/5"
            value={map.qaCols}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions).map((o) => o.value);
              setMap({ ...map, qaCols: selected.slice(0, 6) });
            }}
          >
            {headers.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
          <p className="mt-1 text-[11px] text-gray-500">
            Each selected column becomes an item in <code>clientQa</code> (<i>question</i> = header, <i>answer</i> = cell).
          </p>
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <Button size="sm" variant="outline" type="button" onClick={resetFile}>
          Change file
        </Button>
        {/* IMPORTANT: type='button' + setSetupHidden(true) */}
        <Button size="sm" type="button" onClick={onContinue}>
          Continue to Preview
        </Button>
      </div>
    </div>
  );
}

function PreviewUI({
  rows,
  map,
  headers,
  validIndexes,
  invalidCount,
  processing,
  completed,
  onEditMapping,
  onStart,
}: {
  rows: RowRecord[];
  map: ColumnMap;
  headers: string[];
  validIndexes: number[];
  invalidCount: number;
  processing: boolean;
  completed: boolean;
  onEditMapping: () => void;
  onStart: () => void;
}) {
  const qaCountFor = (r: RowRecord) => map.qaCols.filter((c) => trim(toStr(r[c]))).length;

  return (
    <div className="mt-6 rounded-2xl border p-4 dark:border-white/10">
      <div className="mb-3 flex items-center justify-between text-sm">
        <div>
          Valid <b className="text-emerald-600">{validIndexes.length}</b> · Skipped (invalid){" "}
          <b className="text-amber-600">{invalidCount}</b>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            className="text-xs text-blue-600 hover:underline dark:text-blue-400"
            onClick={onEditMapping}
            disabled={processing}
          >
            Edit mapping
          </button>
        </div>
      </div>

      <div className="relative max-h-[60vh] overflow-auto rounded-xl">
        <table className="w-full min-w-[900px] table-auto text-left text-[13px]">
          <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-white/10">
            <tr className="border-b dark:border-white/10">
              <th className="px-2 py-2 font-semibold">{map.fullName}</th>
              <th className="px-2 py-2 font-semibold">{map.phone}</th>
              <th className="px-2 py-2 font-semibold">
                {map.leadSource === "__platform__"
                  ? `${map.platformCol || "platform"} → source`
                  : map.leadSource === "__other__"
                  ? `source (other)`
                  : map.leadSource}
              </th>
              {map.city !== "none" && <th className="px-2 py-2 font-semibold">{map.city}</th>}
              {map.remark !== "none" && <th className="px-2 py-2 font-semibold">{map.remark} (remark)</th>}
              {map.approachAt !== "none" && (
                <th className="px-2 py-2 font-semibold">{map.approachAt} (→ approachAt)</th>
              )}
              {map.qaCols.length > 0 && <th className="px-2 py-2 font-semibold">Q&amp;A ({map.qaCols.length})</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const name = toStr(r[map.fullName] ?? r["name"] ?? r["full_name"]);
              const phone = onlyDigitsLast10(toStr(r[map.phone] ?? r["phone"]));

              let source = "";
              if (map.leadSource === "__platform__") {
                source = normalizeLeadSource(toStr(r[map.platformCol || "platform"]));
              } else if (map.leadSource === "__other__") {
                source = trim(map.otherSource || "");
              } else {
                source = trim(toStr(r[map.leadSource]));
              }

              const invalid = !trim(name) || !phone || !trim(source);
              const remarkVal = map.remark !== "none" ? toStr(r[(map.remark as string)]) : "";
              const loc = map.city !== "none" ? toStr(r[(map.city as string)]) : "";
              const at = map.approachAt !== "none" ? parseApproachAt(r[(map.approachAt as string)]) : null;

              const qaCount = qaCountFor(r as RowRecord);
              const qaTitle =
                map.qaCols
                  .map((c) => `${c}: ${toStr(r[c])}`)
                  .filter((line) => !/:\s*$/.test(line))
                  .join("\n") || "";

              return (
                <tr
                  key={i}
                  className={`border-b last:border-0 dark:border-white/10 ${
                    invalid ? "bg-rose-50/60 dark:bg-rose-900/20" : ""
                  }`}
                >
                  <td className="px-2 py-1.5">{name}</td>
                  <td className="px-2 py-1.5">{phone}</td>
                  <td className="px-2 py-1.5">{source}</td>
                  {map.remark !== "none" && (
                    <td className="px-2 py-1.5" title={remarkVal}>
                      {remarkVal || "�"}
                    </td>
                  )}
                  {map.city !== "none" && <td className="px-2 py-1.5">{loc}</td>}
                  {map.approachAt !== "none" && <td className="px-2 py-1.5">{at ? at.toISOString() : ""}</td>}
                  {map.qaCols.length > 0 && (
                    <td className="px-2 py-1.5" title={qaTitle}>
                      {qaCount ? `${qaCount} answered` : "—"}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <Button
          size="sm"
          type="button"
          onClick={onStart}
          disabled={!validIndexes.length || processing || completed}
          variant={completed ? "outline" : "primary"}
        >
          {completed ? "Completed" : processing ? "Working…" : `Generate & Assign (${validIndexes.length} rows)`}
        </Button>
      </div>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  headers,
  allowNone,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  headers: string[];
  allowNone?: boolean;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <select
        className="mt-1 w-full rounded-md border px-3 py-2 dark:border-white/10 dark:bg-white/5"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {allowNone && <option value="none">None</option>}
        {headers.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>
    </div>
  );
}

