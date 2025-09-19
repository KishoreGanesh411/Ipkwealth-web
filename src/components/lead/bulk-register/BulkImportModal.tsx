import { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { useMutation } from "@apollo/client";
import { CREATE_LEAD, ASSIGN_LEAD } from "@/core/graphql/lead/lead.gql";
import Label from "../../form/Label";
import Button from "../../ui/button/Button";
import { Modal } from "../../ui/modal";
// If you have a shared type, extend it; otherwise the minimal local shape below also works.
import type { LeadFormData } from "../types";

/* ────────────────────────────────────────────────────────────
   Local helpers & types
   ──────────────────────────────────────────────────────────── */

type RowRecord = Record<string, unknown>;

type ColumnMap = {
  fullName: string;
  phone: string;
  leadSource: string | "__platform__" | "__other__";
  platformCol?: string;        // which column contains platform if __platform__
  otherSource?: string;        // user-typed source if __other__
  city?: string | "none";
  email?: string | "none";
  remark?: string | "none";
  approachAt?: string | "none"; // created_time column → Date
  qaCols: string[];            // up to 6
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

// GraphQL shapes
type CreateLeadVars = { input: LeadFormData };
type CreateLeadResult = { createIpkLeadd?: { id?: string | null } | null };
type AssignLeadVars = { id: string };
type AssignLeadResult = { assignLead?: { assignedRM?: string | null } | null };

/* ────────────────────────────────────────────────────────────
   Small utils
   ──────────────────────────────────────────────────────────── */

const CONCURRENCY = 4;

const toStr = (v: unknown) => (v == null ? "" : String(v));
const trim = (s: string) => s.trim();

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

// Excel serial date → JS Date
function excelSerialToDate(n: number): Date | null {
  if (!Number.isFinite(n)) return null;
  const o = XLSX.SSF.parse_date_code(n);
  if (!o) return null;
  // Month in Date is 0-based
  return new Date(Date.UTC(o.y, (o.m || 1) - 1, o.d || 1, o.H || 0, o.M || 0, o.S || 0));
}

// parse many shapes to Date
function parseApproachAt(v: unknown): Date | null {
  if (v == null || v === "") return null;

  if (v instanceof Date && !isNaN(v.getTime())) return v;

  if (typeof v === "number") {
    // might be Excel serial
    const d = excelSerialToDate(v);
    if (d) return d;
    // unix?
    if (String(v).length >= 10) {
      const d2 = new Date(v);
      if (!isNaN(d2.getTime())) return d2;
    }
    return null;
  }

  if (typeof v === "string") {
    const s = v.trim();
    // allow "2025-09-18 08:40:43+05:30" by inserting 'T'
    const maybeIso = /T/.test(s) ? s : s.replace(" ", "T");
    const d = new Date(maybeIso);
    if (!isNaN(d.getTime())) return d;
    return null;
  }

  return null;
}

function normalizeLeadSource(raw: string) {
  const s = trim(raw).toLowerCase();
  if (!s) return "";
  if (/(facebook|^fb$|meta|instagram|^ig$)/i.test(s)) return "meta";
  return s; // keep as-is for google, website, etc.
}

/* ────────────────────────────────────────────────────────────
   Component
   ──────────────────────────────────────────────────────────── */

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onImported?: () => void;
  rowsFromForm?: RowRecord[]; // if given, preview-only
};

export default function BulkImportModal({ isOpen, onClose, onImported, rowsFromForm }: Props) {
  const previewOnly = Array.isArray(rowsFromForm) && rowsFromForm.length > 0;

  const [rows, setRows] = useState<RowRecord[]>(rowsFromForm ?? []);
  const [headers, setHeaders] = useState<string[]>([]);
  const [setupHidden, setSetupHidden] = useState<boolean>(!!rowsFromForm?.length);

  const [map, setMap] = useState<ColumnMap>({
    fullName: "name",
    phone: "phone",
    leadSource: "__platform__", // common in ad exports
    platformCol: "platform",
    otherSource: "",
    city: "none",
    email: "none",
    remark: "none",
    approachAt: "none",
    qaCols: [],
  });

  // gql
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

  const failuresRef = useRef<Array<{ rowIndex: number; reason: string; row: RowRecord }>>([]);

  const hasRows = rows.length > 0;

  /* ── file handling ───────────────────────────────────────── */

  async function onFile(file: File) {
    try {
      const buf = await file.arrayBuffer();
      // XLSX auto-detects csv/xls/xlsx just fine
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      if (!ws) throw new Error("No sheet found");
      // Keep raw so we can parse numeric date serials if needed
      const json = XLSX.utils.sheet_to_json<RowRecord>(ws, { defval: "", raw: true });
      if (!json.length) throw new Error("Empty sheet");

      setRows(json);
      const hdrs = Object.keys(json[0] ?? {});
      setHeaders(hdrs);

      // light auto-guess
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
        phone: guess(["phone", "mobile", "phone_number"], m.phone),
        platformCol: guess(["platform", "source"], m.platformCol || "platform"),
        leadSource: "__platform__", // default to platform normalization
        city: guess(["city", "location", "area"], "none"),
        email: hdrs.includes("email") ? "email" : "none",
        remark: hdrs.includes("remark") ? "remark" : "none",
        approachAt: guess(["created_time", "created at", "created"], "none"),
        qaCols: [], // let user pick
      }));

      setSetupHidden(false); // show mapping first
    } catch (e) {
      alert("Could not parse the Excel file. Please upload a valid .xlsx / .xls / .csv file.");
    }
  }

  function resetFile() {
    setRows([]);
    setHeaders([]);
    setSetupHidden(false);
  }

  /* ── validation insight ─────────────────────────────────── */

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

  /* ── run import ─────────────────────────────────────────── */

  async function startImport() {
    if (!hasRows) return;

    setProcessing(true);
    setProgress({
      total: validIndexes.length,
      done: 0,
      success: 0,
      failed: 0,
      skipped: invalidCount,
      halted: false,
    });
    failuresRef.current = [];

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

      const location =
        map.city && map.city !== "none" ? trim(toStr(r[map.city])) : "";

      const email =
        map.email && map.email !== "none"
          ? trim(toStr(r[map.email]))
          : "";

      const remark =
        map.remark && map.remark !== "none"
          ? trim(toStr(r[map.remark]))
          : "";

      // approachAt from created_time (optional)
      const approachAt =
        map.approachAt && map.approachAt !== "none"
          ? parseApproachAt(r[map.approachAt])
          : null;

      // client Q&A (up to 6): [{q, a}, ...]
      const clientQa =
        map.qaCols.length > 0
          ? map.qaCols
              .slice(0, 6)
              .map((col) => ({ q: col, a: toStr(r[col]) }))
              .filter((qa) => trim(qa.a))
          : null;

      // build GraphQL input
      const input: LeadFormData & {
        approachAt?: Date | null;
        clientQa?: Array<{ q: string; a: string }> | null;
        location?: string | null;
      } = {
        firstName,
        lastName,
        phone,
        leadSource,
        email: email || undefined,
        remark: remark || undefined,
        location: location || undefined,
        approachAt: approachAt ?? undefined,
        clientQa: clientQa ?? undefined,
      };

      try {
        const c = await createLeadMut({ variables: { input } });
        const id = c.data?.createIpkLeadd?.id;
        if (!id) throw new Error("Create lead returned no id");

        await assignLeadMut({ variables: { id } });

        setProgress((p) => ({ ...p, done: p.done + 1, success: p.success + 1 }));
      } catch (err: any) {
        const msg =
          err?.graphQLErrors?.[0]?.message ??
          err?.message ??
          "Unknown error";
        failuresRef.current.push({ rowIndex: rowIndex1, reason: msg, row: r as RowRecord });
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
      onImported?.();
    } finally {
      setProcessing(false);
    }
  }

  /* ── UI bits ────────────────────────────────────────────── */

  const qaCountFor = (r: RowRecord) =>
    map.qaCols.filter((c) => trim(toStr(r[c]))).length;

  return (
    <Modal isOpen={isOpen} onClose={processing ? () => {} : onClose} className="w-[92vw] max-w-[1200px] m-4">
      <div className="relative w-full max-h-[82vh] overflow-y-auto rounded-3xl bg-white p-5 no-scrollbar dark:bg-gray-900 lg:p-8">
        {/* instructions */}
        <details
          open
          className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-900/10 dark:text-emerald-200"
        >
          <summary className="cursor-pointer select-none text-sm font-semibold">
            Instructions & validation
          </summary>
          <ul className="mt-2 list-disc pl-5 text-sm leading-6">
            <li><b>Name</b>, <b>Phone</b>, and <b>Lead Source</b> are mandatory.</li>
            <li>Other fields (Email, Remark, City) are optional.</li>
            <li>Phone is normalized to the last 10 digits.</li>
            <li>If you map <b>Created Time → Approach Date</b>, we store that as <code>approachAt</code>.</li>
            <li>Select up to 6 <b>Client Q&A</b> columns to preserve question/answers per lead.</li>
          </ul>
        </details>

        {/* dropzone (hidden once a file is chosen) */}
        {!previewOnly && !hasRows && (
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
                <div className="text-sm font-medium">Drag & Drop or Click to Browse</div>
                <div className="text-xs mt-1">.xlsx · .xls · .csv supported</div>
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
        )}

        {/* mapping */}
        {!previewOnly && hasRows && !setupHidden && (
          <div className="mt-6 rounded-2xl border p-4 dark:border-white/10">
            <div className="mb-3 text-sm font-medium">
              Map Columns · Valid rows detected:{" "}
              <b className="text-emerald-600">{validIndexes.length}</b> / {rows.length} ·
              Skipped (invalid): <b className="text-amber-600">{invalidCount}</b>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div>
                <Label>Full Name</Label>
                <select
                  className="mt-1 w-full rounded-md border px-3 py-2 dark:border-white/10 dark:bg-white/5"
                  value={map.fullName}
                  onChange={(e) => setMap({ ...map, fullName: e.target.value })}
                >
                  {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>

              <div>
                <Label>Phone</Label>
                <select
                  className="mt-1 w-full rounded-md border px-3 py-2 dark:border-white/10 dark:bg-white/5"
                  value={map.phone}
                  onChange={(e) => setMap({ ...map, phone: e.target.value })}
                >
                  {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>

              <div>
                <Label>Lead Source (column)</Label>
                <select
                  className="mt-1 w-full rounded-md border px-3 py-2 dark:border-white/10 dark:bg-white/5"
                  value={map.leadSource}
                  onChange={(e) =>
                    setMap({ ...map, leadSource: e.target.value as ColumnMap["leadSource"] })
                  }
                >
                  <option value="__platform__">Platform (facebook/meta/ig → meta)</option>
                  <option value="__other__">Other (type)</option>
                  {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                </select>
                {map.leadSource === "__platform__" && (
                  <div className="mt-2">
                    <Label className="text-xs">Platform column</Label>
                    <select
                      className="mt-1 w-full rounded-md border px-3 py-2 dark:border-white/10 dark:bg-white/5"
                      value={map.platformCol || ""}
                      onChange={(e) => setMap({ ...map, platformCol: e.target.value })}
                    >
                      {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                    </select>
                    <p className="mt-1 text-[11px] text-gray-500">
                      If you also map <b>Platform</b>, values like “Facebook / Meta / FB / IG” auto-normalize to <b>meta</b>.
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

              <div>
                <Label>Email (optional)</Label>
                <select
                  className="mt-1 w-full rounded-md border px-3 py-2 dark:border-white/10 dark:bg-white/5"
                  value={map.email}
                  onChange={(e) => setMap({ ...map, email: e.target.value as any })}
                >
                  <option value="none">None</option>
                  {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>

              <div>
                <Label>City / Location (optional)</Label>
                <select
                  className="mt-1 w-full rounded-md border px-3 py-2 dark:border-white/10 dark:bg-white/5"
                  value={map.city}
                  onChange={(e) => setMap({ ...map, city: e.target.value as any })}
                >
                  <option value="none">None</option>
                  {headers.map((h) => <option key={h} value={h}>{h}</option>)}
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
                  {headers.map((h) => <option key={h} value={h}>{h}</option>)}
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
                  {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>

              <div className="md:col-span-2 lg:col-span-3">
                <Label>Client Q&A columns (select up to 6)</Label>
                <select
                  multiple
                  className="mt-1 w-full rounded-md border px-3 py-2 dark:border-white/10 dark:bg-white/5 h-32"
                  value={map.qaCols}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions).map((o) => o.value);
                    setMap((m) => ({ ...m, qaCols: selected.slice(0, 6) }));
                  }}
                >
                  {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                </select>
                <p className="mt-1 text-[11px] text-gray-500">
                  Each selected column becomes an item in <code>clientQa</code> (question = header, answer = cell).
                </p>
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={resetFile}>Change file</Button>
              <Button size="sm" onClick={() => setSetupHidden(true)}>Continue to Preview</Button>
            </div>
          </div>
        )}

        {/* preview */}
        {hasRows && setupHidden && (
          <div className="mt-6 rounded-2xl border p-4 dark:border-white/10">
            <div className="mb-3 flex items-center justify-between text-sm">
              <div>
                Valid <b className="text-emerald-600">{validIndexes.length}</b> ·
                Skipped (invalid) <b className="text-amber-600">{invalidCount}</b>
              </div>
              {!previewOnly && (
                <div className="flex gap-3">
                  <button
                    type="button"
                    className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                    onClick={resetFile}
                    disabled={processing}
                  >
                    Change file
                  </button>
                  <button
                    type="button"
                    className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                    onClick={() => setSetupHidden(false)}
                    disabled={processing}
                  >
                    Edit mapping
                  </button>
                </div>
              )}
            </div>

            <div className="relative overflow-auto max-h-[60vh] rounded-xl">
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
                    {map.approachAt !== "none" && (
                      <th className="px-2 py-2 font-semibold">{map.approachAt} (→ approachAt)</th>
                    )}
                    {map.qaCols.length > 0 && <th className="px-2 py-2 font-semibold">Q&A ({map.qaCols.length})</th>}
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

                    const invalid =
                      !trim(name) || !phone || !trim(source);

                    const loc = map.city !== "none" ? toStr(r[map.city]) : "";
                    const at =
                      map.approachAt !== "none"
                        ? parseApproachAt(r[map.approachAt])
                        : null;

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
                        {map.city !== "none" && <td className="px-2 py-1.5">{loc}</td>}
                        {map.approachAt !== "none" && (
                          <td className="px-2 py-1.5">{at ? at.toISOString() : ""}</td>
                        )}
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
              <Button size="sm" variant="outline" onClick={() => setSetupHidden(false)}>
                Edit mapping
              </Button>
              <Button size="sm" onClick={startImport} disabled={!validIndexes.length || processing}>
                {processing ? "Working…" : `Generate & Assign (${validIndexes.length} rows)`}
              </Button>
            </div>
          </div>
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
      </div>
    </Modal>
  );
}
