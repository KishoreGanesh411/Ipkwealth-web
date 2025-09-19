import { useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { useMutation } from "@apollo/client";
import { CREATE_LEAD, ASSIGN_LEAD } from "@/core/graphql/lead/lead.gql";
import Label from "../../form/Label";
import Button from "../../ui/button/Button";
import { Modal } from "../../ui/modal";
import type { LeadFormData } from "../types";
import { splitName } from "../Leadform/utils";

/* --------------------- Local types --------------------- */

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onImported?: () => void;
  /** If provided, we render PREVIEW-ONLY (no upload/map at all) */
  rowsFromForm?: Array<Record<string, unknown>>;
};

type ColumnMap = {
  // required mapping
  name: string;
  phone: string;
  // lead source comes from either a "platform" column or a typed leadsource column
  leadSource: "none" | string;
  platform: "none" | string;

  // optional mapping
  email: "none" | string;
  remark: "none" | string;
  location: "none" | string;   // e.g. city
  approachAt: "none" | string; // e.g. created_time

  // Q&A (select up to 6 columns)
  qaCols: string[];
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

type RowRecord = Record<string, unknown>;

type Failure = {
  rowIndex: number;
  reason: string;
  row: RowRecord;
};

type CreateLeadVars = { input: LeadFormData & {
  // these are optional—API can ignore if not supported yet
  approachAt?: string | null;
  clientQa?: Array<{ q: string; a: string }> | null;
  location?: string | null;
}};
type CreateLeadResult = { createIpkLeadd?: { id?: string | null } | null };
type AssignLeadVars = { id: string };
type AssignLeadResult = { assignLead?: { assignedRM?: string | null } | null };

/* --------------------- Constants --------------------- */
const CONCURRENCY = 4;
const MAX_QA_COLS = 6;

/* --------------------- Helpers --------------------- */

// normalize platform → canonical source
function normalizeSource(raw: string): string {
  const s = String(raw || "").trim().toLowerCase();
  if (!s) return "";
  if (["facebook", "meta", "fb"].some(k => s.includes(k))) return "meta";
  if (["google", "adwords", "gads"].some(k => s.includes(k))) return "google";
  return s; // fallback to whatever the sheet has
}

// prettify a header name for the "q" label
function prettyHeader(h: string) {
  return String(h || "")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s*\?*$/g, "") // trim trailing question marks/spaces
    .trim();
}

// ISO string from a cell that may be an ISO string *or* an Excel serial
function toIsoFromCell(v: unknown): string | undefined {
  if (v == null || v === "") return undefined;
  // numeric excel date → use SSF parser
  if (typeof v === "number") {
    // SheetJS parser returns Y/M/D and time
    const d = XLSX.SSF.parse_date_code(v);
    if (d) {
      // build UTC date (Excel is usually local-less; using UTC avoids TZ surprises)
      const ms = Math.floor(((d.s || 0) % 1) * 1000);
      const dt = new Date(Date.UTC(d.y, (d.m || 1) - 1, d.d || 1, d.H || 0, d.M || 0, Math.floor(d.s || 0), ms));
      return dt.toISOString();
    }
  }
  // strings like "2025-09-18T08:40:43+05:30" are valid ISO-8601; Date() can parse
  const iso = new Date(String(v));
  return isNaN(iso.getTime()) ? undefined : iso.toISOString();
}

// phone last 10 digits
function last10(phone: string) {
  return String(phone || "").replace(/\D+/g, "").slice(-10);
}

function ciFind(headers: string[], candidates: string[]): string | null {
  const lower = headers.map((h) => h.toLowerCase());
  for (const cand of candidates) {
    const i = lower.indexOf(cand.toLowerCase());
    if (i !== -1) return headers[i];
  }
  return null;
}

/* ===================================================== */

export default function BulkImportModal({
  isOpen,
  onClose,
  onImported,
  rowsFromForm,
}: Props) {
  const previewOnly = Array.isArray(rowsFromForm) && rowsFromForm.length > 0;

  // DATA
  const [rows, setRows] = useState<RowRecord[]>(rowsFromForm ?? []);
  const [headerKeys, setHeaderKeys] = useState<string[]>([]);
  const [map, setMap] = useState<ColumnMap>({
    name: "name",
    phone: "phone",
    leadSource: "none",
    platform: "none",
    email: "none",
    remark: "none",
    location: "none",
    approachAt: "none",
    qaCols: [],
  });

  // NEW: hide setup (upload + mapping) after file chosen
  const [setupHidden, setSetupHidden] = useState<boolean>(!!rowsFromForm?.length);

  const [createLeadMut] = useMutation<CreateLeadResult, CreateLeadVars>(CREATE_LEAD);
  const [assignLeadMut] = useMutation<AssignLeadResult, AssignLeadVars>(ASSIGN_LEAD);

  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState<Progress>({
    total: 0,
    done: 0,
    success: 0,
    failed: 0,
    skipped: 0,
  });
  const [perRm, setPerRm] = useState<Record<string, number>>({});
  const [showSummary, setShowSummary] = useState(false);

  const failuresRef = useRef<Failure[]>([]);
  const failureCsvUrlRef = useRef<string | null>(null);

  const hasRows = rows.length > 0;

  /* ---------- Upload handler ---------- */
  const onFile = async (file: File) => {
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<RowRecord>(ws, { defval: "" });
      setRows(json);

      const headers = Object.keys(json[0] ?? {});
      setHeaderKeys(headers);

      // Auto-map best-effort
      const name = ciFind(headers, ["full_name", "name", "fullname"]) ?? "name";
      const phone = ciFind(headers, ["phone", "mobile", "contact", "phone number"]) ?? "phone";
      const leadSource = (ciFind(headers, ["leadsource", "lead source", "source"]) ?? "none") as "none" | string;
      const platform = (ciFind(headers, ["platform", "channel"]) ?? "none") as "none" | string;
      const email = (ciFind(headers, ["email", "e-mail"]) ?? "none") as "none" | string;
      const remark = (ciFind(headers, ["remark", "notes", "note"]) ?? "none") as "none" | string;
      const location = (ciFind(headers, ["city", "location", "area"]) ?? "none") as "none" | string;
      const approachAt = (ciFind(headers, ["created_time", "created at", "approach", "submitted_at"]) ?? "none") as "none" | string;

      // Pick up to 3-6 obvious Q columns (anything that looks question-ish)
      const guessQa = headers
        .filter(h => /(\?|^q\d+_|do_you_|need_|want_|like_)/i.test(h))
        .slice(0, MAX_QA_COLS);

      setMap({ name, phone, leadSource, platform, email, remark, location, approachAt, qaCols: guessQa });
      setSetupHidden(true); // hide dropzone + mapping immediately
    } catch {
      alert("Could not parse the Excel file. Please upload a valid .xlsx or .xls file.");
    }
  };

  /* ---------- Validity (Name, Phone, Lead Source from either field) ---------- */
  const { validIndexes, invalidCount } = useMemo(() => {
    const valids: number[] = [];
    let invalid = 0;
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i] ?? {};
      const fullName = String(
        r[map.name] ?? (r as RowRecord).name ?? (r as RowRecord).Name ?? ""
      ).trim();

      const phone = last10(
        String(r[map.phone] ?? (r as RowRecord).phone ?? (r as RowRecord).Phone ?? "")
      );

      const platformVal = map.platform !== "none" ? String(r[map.platform] ?? "") : "";
      const leadSourceVal = map.leadSource !== "none" ? String(r[map.leadSource] ?? "") : "";
      const source = normalizeSource(platformVal) || String(leadSourceVal || "").trim();

      if (fullName && phone && source) valids.push(i);
      else invalid++;
    }
    return { validIndexes: valids, invalidCount: invalid };
  }, [rows, map]);

  /* ---------- CSV of failures ---------- */
  function toCsv(rowsCsv: Array<Record<string, unknown>>) {
    if (!rowsCsv.length) return "";
    const headers = Object.keys(rowsCsv[0]);
    const esc = (v: unknown) => {
      const s = String(v ?? "");
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [
      headers.join(","),
      ...rowsCsv.map((obj) =>
        headers.map((h) => esc((obj as Record<string, unknown>)[h])).join(",")
      ),
    ];
    return lines.join("\n");
  }

  function triggerCsvDownload() {
    if (!failuresRef.current.length) return;
    if (failureCsvUrlRef.current) {
      URL.revokeObjectURL(failureCsvUrlRef.current);
      failureCsvUrlRef.current = null;
    }
    const csvRows = failuresRef.current.map((f) => ({
      row: f.rowIndex,
      reason: f.reason,
      name: String(
        f.row?.[map.name] ?? (f.row as RowRecord)?.name ?? (f.row as RowRecord)?.Name ?? ""
      ),
      phone: last10(
        String(
          f.row?.[map.phone] ??
            (f.row as RowRecord)?.phone ??
            (f.row as RowRecord)?.Phone ??
            ""
        )
      ),
      leadSource:
        normalizeSource(
          map.platform !== "none" ? String(f.row?.[map.platform] ?? "") : ""
        ) ||
        String(
          map.leadSource !== "none" ? f.row?.[map.leadSource] ?? "" : ""
        ),
    }));
    const csv = toCsv(csvRows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    failureCsvUrlRef.current = url;
    const a = document.createElement("a");
    a.href = url;
    a.download = `bulk-failures-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  /* ---------- Runner ---------- */
  async function startImportAndAssign() {
    if (!hasRows) return;
    setProcessing(true);
    setShowSummary(false);
    failuresRef.current = [];
    setPerRm({});
    setProgress({
      total: validIndexes.length,
      done: 0,
      success: 0,
      failed: 0,
      skipped: invalidCount,
    });

    try {
      const worker = async (idx: number) => {
        const r = (rows[idx] ?? {}) as RowRecord;
        const rowIndex1 = idx + 2; // assume 1 header line

        // required
        const fullName = String(r[map.name] ?? r.name ?? (r as RowRecord).Name ?? "").trim();
        const { firstName, lastName } = splitName(fullName);

        const phone = last10(
          String(r[map.phone] ?? r.phone ?? (r as RowRecord).Phone ?? "")
        );

        const platformVal = map.platform !== "none" ? String(r[map.platform] ?? "") : "";
        const leadSourceVal = map.leadSource !== "none" ? String(r[map.leadSource] ?? "") : "";
        const leadSource = normalizeSource(platformVal) || String(leadSourceVal || "").trim();

        // optional
        const email =
          map.email === "none"
            ? ""
            : String(r[map.email] ?? r.email ?? (r as RowRecord).Email ?? "")
                .trim()
                .toLowerCase();

        const remark =
          map.remark === "none"
            ? ""
            : String(r[map.remark] ?? r.remark ?? (r as RowRecord).Remark ?? "").trim();

        const location =
          map.location === "none"
            ? ""
            : String(r[map.location] ?? r.city ?? (r as RowRecord).City ?? "").trim();

        const approachAtIso =
          map.approachAt === "none" ? undefined : toIsoFromCell(r[map.approachAt]);

        const clientQa = map.qaCols
          .slice(0, MAX_QA_COLS)
          .map((key) => {
            const a = String(r[key] ?? "").trim();
            if (!a) return null;
            return { q: prettyHeader(key), a };
          })
          .filter(Boolean) as Array<{ q: string; a: string }>;

        // build payload (keeps your existing input fields and adds optional approachAt/clientQa)
        const payload: CreateLeadVars["input"] = {
          firstName,
          lastName,
          phone,
          leadSource,
          email,
          remark,
          referralCode: "",
          location: location || undefined,
          approachAt: approachAtIso ?? undefined,
          clientQa: clientQa.length ? clientQa : undefined,
        };

        try {
          const c = await createLeadMut({ variables: { input: payload } });
          const createdId = c.data?.createIpkLeadd?.id ?? undefined;
          if (!createdId) throw new Error("Create lead returned no id");

          const a = await assignLeadMut({ variables: { id: createdId } });
          const assignedRm = a.data?.assignLead?.assignedRM ?? "Unknown";

          setPerRm((m) => ({ ...m, [assignedRm]: (m[assignedRm] ?? 0) + 1 }));
          setProgress((p) => ({ ...p, done: p.done + 1, success: p.success + 1 }));
        } catch (err) {
          const msg =
            (err as Error)?.message ??
            (typeof err === "object" && err !== null && "message" in (err as { message?: unknown })
              ? String((err as { message?: unknown }).message)
              : "Unknown error");

          if (/No active Relationship Managers found/i.test(msg)) {
            setProgress((p) => ({
              ...p,
              halted: true,
              haltReason: "No active Relationship Managers found. Import stopped.",
            }));
            throw new Error("__HALT__");
          }
          failuresRef.current.push({ rowIndex: rowIndex1, reason: msg, row: r });
          setProgress((p) => ({ ...p, done: p.done + 1, failed: p.failed + 1 }));
        }
      };

      // simple pool
      let i = 0;
      const spawn = async () => {
        while (i < validIndexes.length) {
          const idx = validIndexes[i++];
          try {
            await worker(idx);
          } catch (e) {
            if ((e as Error).message === "__HALT__") throw e;
          }
        }
      };
      await Promise.allSettled(
        Array.from({ length: Math.min(CONCURRENCY, validIndexes.length) }, spawn)
      );

      if (failuresRef.current.length) triggerCsvDownload();
      setShowSummary(true);
      window.dispatchEvent(new CustomEvent("ipk:leads-imported"));
      onImported?.();
    } finally {
      setProcessing(false);
    }
  }

  /* --------------------- UI --------------------- */

  const hasRowsAfterSetup = hasRows && !previewOnly;

  const qaSelectable = headerKeys.filter(
    (h) => ![map.name, map.phone, map.leadSource, map.platform, map.email, map.remark, map.location, map.approachAt].includes(h)
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={processing ? () => {} : onClose}
      className="w-[92vw] max-w-[1200px] m-4"
    >
      <div className="relative w-full max-h-[82vh] overflow-y-auto rounded-3xl bg-white p-5 no-scrollbar dark:bg-gray-900 lg:p-8">
        {/* Instructions */}
        <details
          open
          className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-900/10 dark:text-emerald-200"
        >
          <summary className="cursor-pointer select-none text-sm font-semibold">
            Instructions & validation
          </summary>
          <ul className="mt-2 list-disc pl-5 text-sm leading-6">
            <li><b>Name</b>, <b>Phone</b>, and <b>Lead Source</b> are mandatory (Lead Source can come from the <i>Platform</i> column).</li>
            <li>Other fields (Email, Remark, City, Q&A, Created Time) are optional.</li>
            <li>Phone is normalized to the last 10 digits.</li>
          </ul>
        </details>

        {/* Upload + Map (hidden once a file is chosen) */}
        {!previewOnly && !setupHidden && (
          <>
            {/* Dropzone */}
            <div className="rounded-2xl border border-dashed p-4 dark:border-white/10">
              <Label>Upload Excel (.xlsx or .xls)</Label>
              <label className="mt-2 flex h-40 cursor-pointer items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
                  disabled={processing}
                />
                <div className="text-center">
                  <div className="text-sm font-medium">Drag & Drop or Click to Browse</div>
                  <div className="text-xs mt-1">Only .xlsx / .xls supported</div>
                </div>
              </label>
              <a
                href="/samples/bulk_sample.xlsx"
                download
                className="mt-3 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400"
              >
                Download sample
              </a>
            </div>

            {/* Column Map */}
            {hasRows && (
              <div className="mt-6 rounded-2xl border p-4 dark:border-white/10">
                <div className="mb-3 text-sm font-medium">
                  Map Columns · Valid rows detected:{" "}
                  <b className="text-emerald-600">{validIndexes.length}</b> / {rows.length} ·
                  Skipped (invalid): <b className="text-amber-600">{invalidCount}</b>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <Label>Full Name</Label>
                    <select
                      className="mt-1 w-full rounded-md border px-3 py-2 dark:border-white/10 dark:bg-white/5"
                      value={map.name}
                      onChange={(e) => setMap({ ...map, name: e.target.value })}
                    >
                      {headerKeys.map((h) => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <select
                      className="mt-1 w-full rounded-md border px-3 py-2 dark:border-white/10 dark:bg-white/5"
                      value={map.phone}
                      onChange={(e) => setMap({ ...map, phone: e.target.value })}
                    >
                      {headerKeys.map((h) => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label>Lead Source (column)</Label>
                    <select
                      className="mt-1 w-full rounded-md border px-3 py-2 dark:border-white/10 dark:bg-white/5"
                      value={map.leadSource}
                      onChange={(e) => setMap({ ...map, leadSource: e.target.value as any })}
                    >
                      <option value="none">None</option>
                      {headerKeys.map((h) => <option key={h} value={h}>{h}</option>)}
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      If you also map <b>Platform</b>, values like “Facebook / Meta / FB” auto-normalize to <code>meta</code>.
                    </p>
                  </div>

                  <div>
                    <Label>Platform (optional)</Label>
                    <select
                      className="mt-1 w-full rounded-md border px-3 py-2 dark:border-white/10 dark:bg-white/5"
                      value={map.platform}
                      onChange={(e) => setMap({ ...map, platform: e.target.value as any })}
                    >
                      <option value="none">None</option>
                      {headerKeys.map((h) => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>

                  <div>
                    <Label>Email (optional)</Label>
                    <select
                      className="mt-1 w-full rounded-md border px-3 py-2 dark:border-white/10 dark:bg-white/5"
                      value={map.email}
                      onChange={(e) => setMap({ ...map, email: e.target.value as any })}
                    >
                      <option value="none">None</option>
                      {headerKeys.map((h) => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>

                  <div>
                    <Label>Remark (optional)</Label>
                    <select
                      className="mt-1 w-full rounded-md border px-3 py-2 dark:border-white/10 dark:bg-white/5"
                      value={map.remark}
                      onChange={(e) => setMap({ ...map, remark: e.target.value as any })}
                    >
                      <option value="none">None</option>
                      {headerKeys.map((h) => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>

                  <div>
                    <Label>City / Location (optional)</Label>
                    <select
                      className="mt-1 w-full rounded-md border px-3 py-2 dark:border-white/10 dark:bg-white/5"
                      value={map.location}
                      onChange={(e) => setMap({ ...map, location: e.target.value as any })}
                    >
                      <option value="none">None</option>
                      {headerKeys.map((h) => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>

                  <div>
                    <Label>Created Time → Approach Date (optional)</Label>
                    <select
                      className="mt-1 w-full rounded-md border px-3 py-2 dark:border-white/10 dark:bg-white/5"
                      value={map.approachAt}
                      onChange={(e) => setMap({ ...map, approachAt: e.target.value as any })}
                    >
                      <option value="none">None</option>
                      {headerKeys.map((h) => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>

                  <div className="md:col-span-3">
                    <Label>Client Q&A columns (select up to {MAX_QA_COLS})</Label>
                    <select
                      multiple
                      size={Math.min(8, qaSelectable.length)}
                      className="mt-1 w-full rounded-md border px-3 py-2 dark:border-white/10 dark:bg-white/5"
                      value={map.qaCols}
                      onChange={(e) => {
                        const opts = Array.from(e.target.selectedOptions).map(o => o.value);
                        setMap({ ...map, qaCols: opts.slice(0, MAX_QA_COLS) });
                      }}
                    >
                      {qaSelectable.map((h) => <option key={h} value={h}>{h}</option>)}
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      Each selected column becomes an item in <code>clientQa</code> (question = column header, answer = cell).
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <Button size="sm" onClick={() => setSetupHidden(true)}>
                    Continue to Preview
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Preview */}
        {hasRows ? (
          <div className="mt-6 rounded-2xl border p-4 dark:border-white/10">
            <div className="mb-3 flex items-center justify-between text-sm">
              <div>
                Valid <b className="text-emerald-600">{validIndexes.length}</b> · Skipped
                (invalid) <b className="text-amber-600">{invalidCount}</b>
              </div>
              {!previewOnly && (
                <button
                  type="button"
                  className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                  onClick={() => setSetupHidden(false)}
                  disabled={processing}
                >
                  Change file / mapping
                </button>
              )}
            </div>

            {/* Scroll both axes + sticky header + dense cells */}
            <div className="relative overflow-x-auto overflow-y-auto max-h-[60vh] rounded-xl">
              <table className="w-full min-w-[900px] table-auto text-left text-[13px]">
                <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-white/10">
                  <tr className="border-b dark:border-white/10">
                    <th className="px-2 py-2 font-semibold">{map.name}</th>
                    <th className="px-2 py-2 font-semibold">{map.phone}</th>
                    <th className="px-2 py-2 font-semibold">{map.platform !== "none" ? `${map.platform} → source` : (map.leadSource !== "none" ? map.leadSource : "leadSource")}</th>
                    {map.location !== "none" && <th className="px-2 py-2 font-semibold">{map.location}</th>}
                    {map.approachAt !== "none" && <th className="px-2 py-2 font-semibold">{map.approachAt} (→ approachAt)</th>}
                    {map.email !== "none" && <th className="px-2 py-2 font-semibold">{map.email}</th>}
                    {map.remark !== "none" && <th className="px-2 py-2 font-semibold">{map.remark}</th>}
                    {map.qaCols.length > 0 && <th className="px-2 py-2 font-semibold">Q&A ({map.qaCols.length})</th>}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => {
                    const name = String(r[map.name] ?? (r as RowRecord).name ?? (r as RowRecord).Name ?? "");
                    const phone = last10(String(r[map.phone] ?? (r as RowRecord).phone ?? (r as RowRecord).Phone ?? ""));
                    const source = normalizeSource(map.platform !== "none" ? String(r[map.platform] ?? "") : "") ||
                                   String(map.leadSource !== "none" ? r[map.leadSource] ?? "" : "");
                    const email = map.email !== "none" ? String(r[map.email] ?? (r as RowRecord).Email ?? "") : "";
                    const remark = map.remark !== "none" ? String(r[map.remark] ?? (r as RowRecord).Remark ?? "") : "";
                    const location = map.location !== "none" ? String(r[map.location] ?? (r as RowRecord).City ?? "") : "";
                    const approachAtPreview = map.approachAt !== "none" ? (toIsoFromCell(r[map.approachAt]) || "") : "";
                    const qaCount = map.qaCols.filter(k => String(r[k] ?? "").trim()).length;

                    const invalid = !name.trim() || !phone.trim() || !String(source || "").trim();

                    return (
                      <tr
                        key={i}
                        className={`border-b last:border-0 dark:border-white/10 ${invalid ? "bg-rose-50/60 dark:bg-rose-900/20" : ""}`}
                      >
                        <td className="px-2 py-1.5">{name}</td>
                        <td className="px-2 py-1.5">{phone}</td>
                        <td className="px-2 py-1.5">{source}</td>
                        {map.location !== "none" && <td className="px-2 py-1.5">{location}</td>}
                        {map.approachAt !== "none" && <td className="px-2 py-1.5">{approachAtPreview}</td>}
                        {map.email !== "none" && <td className="px-2 py-1.5">{email}</td>}
                        {map.remark !== "none" && <td className="px-2 py-1.5">{remark}</td>}
                        {map.qaCols.length > 0 && <td className="px-2 py-1.5">{qaCount} answered</td>}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-lg border border-dashed p-4 text-sm text-gray-500 dark:border-white/10 dark:text-gray-400">
            {!previewOnly ? "Choose a file above to see the preview." : "No rows to preview."}
          </div>
        )}

        {/* Actions */}
        <div className="mt-5 flex items-center justify-end gap-2">
          <Button size="sm" variant="outline" onClick={onClose} disabled={processing}>
            Cancel
          </Button>
          <Button size="sm" onClick={startImportAndAssign} disabled={!hasRows || processing}>
            {processing ? "Working…" : `Generate & Assign (${validIndexes.length} rows)`}
          </Button>
        </div>

        {/* Processing overlay */}
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
                {progress.halted && (
                  <>
                    <br />
                    <span className="font-medium text-rose-700 dark:text-rose-400">
                      {progress.haltReason}
                    </span>
                  </>
                )}
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded bg-gray-200 dark:bg-white/10">
                <div
                  className="h-2 rounded bg-gray-800 transition-all dark:bg-white/80"
                  style={{
                    width: `${Math.min(100, (progress.done / Math.max(1, progress.total)) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Summary */}
        {showSummary && !processing && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-3xl bg-black/10">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900">
              <h5 className="text-base font-semibold">Bulk assignment completed</h5>
              <div className="mt-3 text-sm">
                Total rows: <b>{rows.length}</b><br />
                Valid (processed): <b>{progress.total}</b><br />
                Assigned successfully: <b className="text-emerald-600">{progress.success}</b><br />
                Skipped (invalid): <b className="text-amber-600">{progress.skipped}</b><br />
                Failed: <b className="text-rose-600">{progress.failed}</b>
                {progress.halted && (
                  <>
                    <br />
                    <span className="font-medium text-rose-700 dark:text-rose-400">
                      {progress.haltReason}
                    </span>
                  </>
                )}
              </div>

              {Object.keys(perRm).length > 0 && (
                <div className="mt-4">
                  <div className="text-sm font-medium">Assignment split by RM</div>
                  <ul className="mt-2 space-y-1 text-sm">
                    {Object.entries(perRm).map(([rm, count]) => (
                      <li key={rm} className="flex justify-between border-b py-1 dark:border-white/10">
                        <span>{rm}</span> <span className="font-medium">{count}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-5 flex justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => setShowSummary(false)}>
                  Run Again
                </Button>
                <Button size="sm" onClick={onClose}>
                  Done
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
