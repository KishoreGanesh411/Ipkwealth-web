import { useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { useMutation } from "@apollo/client";
import { CREATE_LEAD, ASSIGN_LEAD } from "@/core/graphql/lead/lead.gql";
import Label from "../../form/Label";
import Button from "../../ui/button/Button";
import { Modal } from "../../ui/modal";
import type { LeadFormData } from "../types";
import { splitName } from "../Leadform/utils";

/* ---------- Local types (no any) ---------- */

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onImported?: () => void;
  /** If provided, we render PREVIEW-ONLY (no upload/map at all) */
  rowsFromForm?: Array<Record<string, unknown>>;
};

type ColumnMap = {
  name: string;
  phone: string;
  leadSource: string;
  email: "none" | string;
  remark: "none" | string;
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

type CreateLeadVars = { input: LeadFormData };
type CreateLeadResult = { createIpkLeadd?: { id?: string | null } | null };
type AssignLeadVars = { id: string };
type AssignLeadResult = { assignLead?: { assignedRM?: string | null } | null };

/* ---------- Constants ---------- */
const CONCURRENCY = 4;

/* ===================================================================== */

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
    leadSource: "leadsource",
    email: "email",
    remark: "remark",
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

  /* ---------- helpers ---------- */
  function ciFind(headers: string[], candidates: string[]): string | null {
    const lower = headers.map((h) => h.toLowerCase());
    for (const cand of candidates) {
      const i = lower.indexOf(cand.toLowerCase());
      if (i !== -1) return headers[i];
    }
    return null;
  }

  function autoMap(headers: string[]): ColumnMap {
    const name = ciFind(headers, ["name", "full name", "fullname"]) ?? "name";
    const phone =
      ciFind(headers, ["phone", "mobile", "contact", "phone number"]) ?? "phone";
    const leadSource =
      ciFind(headers, ["leadsource", "lead source", "source"]) ?? "leadsource";
    const email = (ciFind(headers, ["email", "e-mail"]) ?? "email") as string;
    const remark = (ciFind(headers, ["remark", "notes", "note"]) ?? "remark") as string;
    return { name, phone, leadSource, email, remark };
  }

  /* ---- Upload handler ---- */
  const onFile = async (file: File) => {
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<RowRecord>(ws, { defval: "" });
      setRows(json);
      const headers = Object.keys(json[0] ?? {});
      setHeaderKeys(headers);

      // Auto-map columns then HIDE setup
      const guessed = autoMap(headers);
      setMap({
        name: guessed.name,
        phone: guessed.phone,
        leadSource: guessed.leadSource,
        email: headers.includes(guessed.email) ? guessed.email : "none",
        remark: headers.includes(guessed.remark) ? guessed.remark : "none",
      });
      setSetupHidden(true); // hide dropzone + mapping immediately
    } catch {
      alert("Could not parse the Excel file. Please upload a valid .xlsx or .xls file.");
    }
  };

  /* ---- Validity (Name, Phone, Lead Source are mandatory) ---- */
  const { validIndexes, invalidCount } = useMemo(() => {
    const valids: number[] = [];
    let invalid = 0;
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i] ?? {};
      const name = String((r[map.name] ?? (r as RowRecord).name ?? (r as RowRecord).Name ?? "")).trim();
      const phone = String((r[map.phone] ?? (r as RowRecord).phone ?? (r as RowRecord).Phone ?? ""))
        .replace(/\D+/g, "")
        .slice(-10);
      const leadSource = String(
        r[map.leadSource] ??
          (r as RowRecord).leadSource ??
          (r as RowRecord).leadsource ??
          (r as RowRecord).LeadSource ??
          ""
      ).trim();

      if (name && phone && leadSource) valids.push(i);
      else invalid++;
    }
    return { validIndexes: valids, invalidCount: invalid };
  }, [rows, map]);

  /* ---- CSV of failures ---- */
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
      phone: String(
        f.row?.[map.phone] ??
          (f.row as RowRecord)?.phone ??
          (f.row as RowRecord)?.Phone ??
          ""
      )
        .replace(/\D+/g, "")
        .slice(-10),
      leadSource: String(
        f.row?.[map.leadSource] ??
          (f.row as RowRecord)?.leadSource ??
          (f.row as RowRecord)?.leadsource ??
          (f.row as RowRecord)?.LeadSource ??
          ""
      ),
      email:
        map.email === "none"
          ? ""
          : String(
              f.row?.[map.email] ??
                (f.row as RowRecord)?.email ??
                (f.row as RowRecord)?.Email ??
                ""
            ),
      remark:
        map.remark === "none"
          ? ""
          : String(
              f.row?.[map.remark] ??
                (f.row as RowRecord)?.remark ??
                (f.row as RowRecord)?.Remark ??
                ""
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

  /* ---- Runner ---- */
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

        const fullName = String(r[map.name] ?? r.name ?? (r as RowRecord).Name ?? "").trim();
        const phone = String(r[map.phone] ?? r.phone ?? (r as RowRecord).Phone ?? "")
          .replace(/\D+/g, "")
          .slice(-10);
        const leadSource = String(
          r[map.leadSource] ?? r.leadSource ?? (r as RowRecord).leadsource ?? (r as RowRecord).LeadSource ?? ""
        ).trim();
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

        const { firstName, lastName } = splitName(fullName);
        const payload: LeadFormData = {
          firstName,
          lastName,
          phone,
          leadSource,
          email,
          remark,
          referralCode: "",
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

      // simple pool (DSA-style work queue; O(n) time, O(1) extra space aside from results)
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

  /* ---- RENDER ---- */
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
            <li>
              <b>Name</b>, <b>Phone</b>, and <b>Lead Source</b> are mandatory.
            </li>
            <li>Other fields (Email, Remark, etc.) are optional.</li>
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
                    <Label>Name</Label>
                    <select
                      className="mt-1 w-full rounded-md border px-3 py-2 dark:border-white/10 dark:bg-white/5"
                      value={map.name}
                      onChange={(e) => setMap({ ...map, name: e.target.value })}
                    >
                      {headerKeys.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <select
                      className="mt-1 w-full rounded-md border px-3 py-2 dark:border-white/10 dark:bg-white/5"
                      value={map.phone}
                      onChange={(e) => setMap({ ...map, phone: e.target.value })}
                    >
                      {headerKeys.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Lead Source</Label>
                    <select
                      className="mt-1 w-full rounded-md border px-3 py-2 dark:border-white/10 dark:bg-white/5"
                      value={map.leadSource}
                      onChange={(e) => setMap({ ...map, leadSource: e.target.value })}
                    >
                      {headerKeys.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Email (optional)</Label>
                    <select
                      className="mt-1 w-full rounded-md border px-3 py-2 dark:border-white/10 dark:bg-white/5"
                      value={map.email}
                      onChange={(e) =>
                        setMap({ ...map, email: e.target.value as "none" | string })
                      }
                    >
                      <option value="none">None</option>
                      {headerKeys.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Remark (optional)</Label>
                    <select
                      className="mt-1 w-full rounded-md border px-3 py-2 dark:border-white/10 dark:bg-white/5"
                      value={map.remark}
                      onChange={(e) =>
                        setMap({ ...map, remark: e.target.value as "none" | string })
                      }
                    >
                      <option value="none">None</option>
                      {headerKeys.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
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
                  Change file
                </button>
              )}
            </div>

            {/* Scroll both axes + sticky header + dense cells */}
            <div className="relative overflow-x-auto overflow-y-auto max-h-[60vh] rounded-xl">
              <table className="w-full min-w-[800px] table-auto text-left text-[13px]">
                <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-white/10">
                  <tr className="border-b dark:border-white/10">
                    <th className="px-2 py-2 font-semibold">{map.name}</th>
                    <th className="px-2 py-2 font-semibold">{map.phone}</th>
                    <th className="px-2 py-2 font-semibold">{map.leadSource}</th>
                    {map.email !== "none" && (
                      <th className="px-2 py-2 font-semibold">{map.email}</th>
                    )}
                    {map.remark !== "none" && (
                      <th className="px-2 py-2 font-semibold">{map.remark}</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => {
                    const name = (r[map.name] ?? (r as RowRecord).name ?? (r as RowRecord).Name) as
                      | string
                      | undefined;
                    const phone = String(
                      r[map.phone] ?? (r as RowRecord).phone ?? (r as RowRecord).Phone ?? ""
                    )
                      .replace(/\D+/g, "")
                      .slice(-10);
                    const leadSource =
                      (r[map.leadSource] ??
                        (r as RowRecord).leadSource ??
                        (r as RowRecord).leadsource ??
                        (r as RowRecord).LeadSource) as string | undefined;
                    const email =
                      map.email !== "none"
                        ? ((r[map.email] ??
                            (r as RowRecord).email ??
                            (r as RowRecord).Email ??
                            "") as string)
                        : "";
                    const remark =
                      map.remark !== "none"
                        ? ((r[map.remark] ??
                            (r as RowRecord).remark ??
                            (r as RowRecord).Remark ??
                            "") as string)
                        : "";
                    const invalid =
                      !String(name || "").trim() ||
                      !String(phone || "").trim() ||
                      !String(leadSource || "").trim();

                    return (
                      <tr
                        key={i}
                        className={`border-b last:border-0 dark:border-white/10 ${
                          invalid ? "bg-rose-50/60 dark:bg-rose-900/20" : ""
                        }`}
                      >
                        <td className="px-2 py-1.5">{String(name ?? "")}</td>
                        <td className="px-2 py-1.5">{phone}</td>
                        <td className="px-2 py-1.5">{String(leadSource ?? "")}</td>
                        {map.email !== "none" && (
                          <td className="px-2 py-1.5">{String(email ?? "")}</td>
                        )}
                        {map.remark !== "none" && (
                          <td className="px-2 py-1.5">{String(remark ?? "")}</td>
                        )}
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
                    width: `${Math.min(
                      100,
                      (progress.done / Math.max(1, progress.total)) * 100
                    )}%`,
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
                Total rows: <b>{rows.length}</b>
                <br />
                Valid (processed): <b>{progress.total}</b>
                <br />
                Assigned successfully: <b className="text-emerald-600">{progress.success}</b>
                <br />
                Skipped (invalid): <b className="text-amber-600">{progress.skipped}</b>
                <br />
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
