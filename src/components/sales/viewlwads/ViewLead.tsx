import { useLocation, useParams } from "react-router-dom";
import { useMemo, useState } from "react";
import LeadCodeBadge from "@/components/common/LeadCodeBadge";
import Badge from "@/components/ui/badge/Badge";

/* ────────────────────────────────────────────────────────────
   Types
   ──────────────────────────────────────────────────────────── */
type LeadRow = {
  id: string | number;
  leadCode: string | null;
  name: string;
  phone?: string;
  assignedAt?: string; // ISO
  leadSource: string;
  product: string;
  profession?: string;
  company?: string;
};

type EventForm = {
  explained: "yes" | "no" | null;
  reasonIfNo: string;
  channel: "whatsapp" | "call" | "zoom" | null;
  status:
    | "PENDING"
    | "SPOKEN_FOLLOWUP"
    | "EXPLAINED_FOLLOWUP"
    | "ATTENDED"
    | "DND_REQUEST"
    | "NOT_INTERESTED";
  nextFollowAt?: string;
  notes: string;
  altPhone?: string;
  investmentRange?: string;
  clientType?: "employee" | "business" | "student" | "retired" | "other";
  professionDetails?: string;
  businessOrCompany?: string;
};

/* ────────────────────────────────────────────────────────────
   Component
   ──────────────────────────────────────────────────────────── */
export default function ViewLead() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const passed = (location.state as { lead?: LeadRow } | null)?.lead;

  const lead: LeadRow | null = useMemo(() => passed ?? null, [passed]);

  const [form, setForm] = useState<EventForm>({
    explained: null,
    reasonIfNo: "",
    channel: null,
    status: "PENDING",
    nextFollowAt: "",
    notes: "",
    altPhone: "",
    investmentRange: "",
    clientType: "employee",
    professionDetails: "",
    businessOrCompany: "",
  });

  const set = <K extends keyof EventForm>(k: K, v: EventForm[K]) =>
    setForm((s) => ({ ...s, [k]: v }));

  const copyLeadCode = async () => {
    const code = lead?.leadCode ?? "";
    try {
      await navigator.clipboard.writeText(code);
      alert("Lead code copied");
    } catch {
      alert("Copy failed");
    }
  };

  const save = () => {
    console.log("Dummy save for lead", id, form);
    alert("Saved (dummy). Wire to API later.");
  };

  /* Accessible group label ids */
  const explainedId = "rg-explained";
  const channelId = "rg-channel";

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-white">
          View Lead
        </h1>
        {lead?.product && (
          <Badge className="rounded-full px-3 py-1 text-xs">{lead.product}</Badge>
        )}
      </div>

      {/* Center note banner */}
      <div className="relative mx-auto max-w-3xl overflow-hidden rounded-2xl border border-indigo-200/60 bg-gradient-to-r from-indigo-600 to-blue-600 p-5 text-white shadow-md dark:border-white/10">
        <div className="pointer-events-none absolute -top-24 right-0 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
        <div className="flex flex-col items-center gap-3 text-center md:flex-row md:justify-center">
          <InfoIcon className="h-6 w-6 shrink-0 opacity-90" />
          <div className="space-y-1">
            <div className="text-sm font-medium">Note</div>
            <p className="text-sm/6 opacity-90">
              Basic lead facts are locked. Use the lower card to add interaction details,
              schedule follow-ups, and store notes.
            </p>
          </div>
        </div>
      </div>

      {/* GRID 1: Facts + Additional details */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Facts - not changeable */}
        <Card>
          <SectionTitle>Facts (read-only)</SectionTitle>
          <div className="space-y-3 text-sm">
            <Field label="Lead Code">
              <div className="flex items-center gap-3">
                <LeadCodeBadge code={lead?.leadCode ?? "—"} />
                {lead?.leadCode && (
                  <button
                    onClick={copyLeadCode}
                    className="rounded-lg border border-white/20 bg-white/70 px-2.5 py-1 text-xs font-medium text-gray-700 shadow-sm hover:bg-white"
                    title="Copy lead code"
                  >
                    Copy
                  </button>
                )}
              </div>
            </Field>
            <Field label="Lead Name">{lead?.name ?? "—"}</Field>
            <Field label="Mobile No">{lead?.phone ?? "—"}</Field>
            <Field label="Assigned Date">
              {lead?.assignedAt
                ? new Date(lead.assignedAt).toLocaleString()
                : "—"}
            </Field>
            <Field label="Lead Source">{lead?.leadSource ?? "—"}</Field>
          </div>
        </Card>

        {/* Additional details (editable) */}
        <Card>
          <SectionTitle>Additional details</SectionTitle>
          <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
            <LabeledInput
              label="Product"
              value={lead?.product ?? ""}
              disabled
            />
            <LabeledInput
              label="Investment range"
              value={form.investmentRange ?? ""}
              onChange={(v) => set("investmentRange", v)}
              placeholder="e.g., ₹10k–25k"
            />
            <LabeledInput
              label="Business / Company"
              value={form.businessOrCompany ?? lead?.company ?? ""}
              onChange={(v) => set("businessOrCompany", v)}
              placeholder="Company name"
            />
            <LabeledInput
              label="Profession details"
              value={form.professionDetails ?? lead?.profession ?? ""}
              onChange={(v) => set("professionDetails", v)}
              placeholder="Designation / domain"
            />
            <LabeledSelect
              label="Type of client"
              value={form.clientType ?? "employee"}
              onChange={(v) => set("clientType", v as EventForm["clientType"])}
              options={[
                ["employee", "Employee"],
                ["business", "Business"],
                ["student", "Student"],
                ["retired", "Retired"],
                ["other", "Other"],
              ]}
            />
            <LabeledInput
              label="Alternate mobile number"
              value={form.altPhone ?? ""}
              onChange={(v) => set("altPhone", v)}
              placeholder="Optional"
            />
          </div>
        </Card>
      </div>

      {/* GRID 2: Interaction */}
      <Card>
        <SectionTitle>Your interaction & connected channels</SectionTitle>

        <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
          {/* Product explained? (radio group) */}
          <div role="radiogroup" aria-labelledby={explainedId} className="space-y-2">
            <div id={explainedId} className="text-xs font-medium text-gray-600 dark:text-white/70">
              Product explained?
            </div>
            <div className="flex flex-wrap gap-4">
              <Radio
                name="explained"
                checked={form.explained === "yes"}
                onChange={() => set("explained", "yes")}
                label="Yes"
              />
              <Radio
                name="explained"
                checked={form.explained === "no"}
                onChange={() => set("explained", "no")}
                label="No"
              />
            </div>
          </div>

          {/* Channel (only if yes) */}
          {form.explained === "yes" && (
            <div role="radiogroup" aria-labelledby={channelId} className="space-y-2">
              <div id={channelId} className="text-xs font-medium text-gray-600 dark:text-white/70">
                Channel
              </div>
              <div className="flex flex-wrap gap-4">
                {(["whatsapp", "call", "zoom"] as const).map((ch) => (
                  <Radio
                    key={ch}
                    name="channel"
                    checked={form.channel === ch}
                    onChange={() => set("channel", ch)}
                    label={ch === "zoom" ? "Zoom/Meet" : ch}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Reason if No */}
          {form.explained === "no" && (
            <LabeledTextArea
              label="Reason"
              value={form.reasonIfNo}
              onChange={(v) => set("reasonIfNo", v)}
              placeholder="Why not explained?"
              className="md:col-span-2"
            />
          )}

          {/* Status */}
          <LabeledSelect
            label="Event status"
            value={form.status}
            onChange={(v) => set("status", v as EventForm["status"])}
            options={[
              ["PENDING", "Pending"],
              ["SPOKEN_FOLLOWUP", "Spoken – follow up"],
              ["EXPLAINED_FOLLOWUP", "Explained – follow up"],
              ["ATTENDED", "Attended"],
              ["DND_REQUEST", "DND Request"],
              ["NOT_INTERESTED", "Not interested"],
            ]}
          />

          {/* Next follow-up + code */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <LabeledInput
              type="datetime-local"
              label="Next follow-up date"
              value={form.nextFollowAt ?? ""}
              onChange={(v) => set("nextFollowAt", v)}
            />
            <LabeledInput label="Lead code" value={lead?.leadCode ?? "—"} disabled />
          </div>

          {/* Notes */}
          <LabeledTextArea
            className="sm:col-span-2"
            label="Notes"
            value={form.notes}
            onChange={(v) => set("notes", v)}
            placeholder="Any remarks from the conversation"
          />
        </div>

        <div className="mt-5 flex justify-end">
          <button
            onClick={save}
            className="h-11 rounded-xl bg-indigo-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:scale-[.99]"
          >
            Save
          </button>
        </div>
      </Card>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Small atoms / helpers (kept local to this file)
   ──────────────────────────────────────────────────────────── */

function Card({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm ring-1 ring-black/0 transition dark:border-white/10 dark:bg-white/[0.02]">
      {children}
    </section>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-white/80">
      <DotIcon className="h-4 w-4 text-indigo-500" />
      {children}
    </h2>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-32 shrink-0 text-xs font-medium text-gray-500 dark:text-white/60">
        {label}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  disabled,
  className = "",
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="mb-1 text-xs font-medium text-gray-600 dark:text-white/70">
        {label}
      </div>
      <input
        type={type}
        disabled={disabled}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-xl border border-gray-200 bg-transparent px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-300 focus:outline-hidden focus:ring-3 focus:ring-indigo-500/10 disabled:opacity-70 dark:border-white/10 dark:text-white"
      />
    </div>
  );
}

function LabeledTextArea({
  label,
  value,
  onChange,
  placeholder,
  className = "",
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="mb-1 text-xs font-medium text-gray-600 dark:text-white/70">
        {label}
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        rows={4}
        className="w-full rounded-xl border border-gray-200 bg-transparent px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-300 focus:outline-hidden focus:ring-3 focus:ring-indigo-500/10 dark:border-white/10 dark:text-white"
      />
    </div>
  );
}

function LabeledSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <div>
      <div className="mb-1 text-xs font-medium text-gray-600 dark:text-white/70">
        {label}
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-xl border border-gray-200 bg-transparent px-3 text-sm text-gray-900 focus:border-indigo-300 focus:outline-hidden focus:ring-3 focus:ring-indigo-500/10 dark:border-white/10 dark:text-white"
      >
        {options.map(([val, lab]) => (
          <option key={val} value={val}>
            {lab}
          </option>
        ))}
      </select>
    </div>
  );
}

function Radio({
  name,
  checked,
  onChange,
  label,
}: {
  name: string;
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <label className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 text-sm hover:bg-gray-50 dark:border-white/10 dark:hover:bg-white/[0.06]">
      <input
        type="radio"
        name={name}
        className="h-4 w-4 accent-indigo-600"
        checked={checked}
        onChange={onChange}
      />
      <span>{label}</span>
    </label>
  );
}

/* icons */
function InfoIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M12 22a10 10 0 1 0-10-10 10 10 0 0 0 10 10Z" fill="currentColor" opacity=".12" />
      <path d="M12 8h.01m-.01 3v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function DotIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true">
      <circle cx="10" cy="10" r="3" />
    </svg>
  );
}
