import { useLocation, useParams } from "react-router-dom";
import { useMemo, useState } from "react";
import LeadCodeBadge from "@/components/common/LeadCodeBadge";
import Badge from "@/components/ui/badge/Badge";

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

  const save = () => {
    console.log("Dummy save for lead", id, form);
    alert("Saved (dummy). Wire to API later.");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">View Lead</h1>
        {lead?.product && <Badge className="rounded-full px-3 py-1 text-xs">{lead.product}</Badge>}
      </div>

      {/* GRID 1 */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Facts - not changeable */}
        <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.02]">
          <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-white/80">(Not changeable)</h2>
          <div className="space-y-3 text-sm">
            <Field label="Lead Code"><LeadCodeBadge code={lead?.leadCode ?? "—"} /></Field>
            <Field label="Lead Name">{lead?.name ?? "—"}</Field>
            <Field label="Mobile No">{lead?.phone ?? "—"}</Field>
            <Field label="Assigned Date">{lead?.assignedAt ? new Date(lead.assignedAt).toLocaleString() : "—"}</Field>
            <Field label="Lead Source">{lead?.leadSource ?? "—"}</Field>
          </div>
        </section>

        {/* Additional details (editable) */}
        <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.02]">
          <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-white/80">Additional details</h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-sm">
            <LabeledInput label="Product" value={lead?.product ?? ""} disabled />
            <LabeledInput label="Investment range" value={form.investmentRange ?? ""} onChange={(v) => set("investmentRange", v)} placeholder="e.g., ₹10k–25k" />
            <LabeledInput label="Business / Company" value={form.businessOrCompany ?? lead?.company ?? ""} onChange={(v) => set("businessOrCompany", v)} placeholder="Company name" />
            <LabeledInput label="Profession details" value={form.professionDetails ?? lead?.profession ?? ""} onChange={(v) => set("professionDetails", v)} placeholder="Designation / domain" />
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
            <LabeledInput label="Alternate mobile number" value={form.altPhone ?? ""} onChange={(v) => set("altPhone", v)} placeholder="Optional" />
          </div>
        </section>
      </div>

      {/* GRID 2 */}
      <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.02]">
        <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-white/80">RM Interaction / Event</h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 text-sm">
          {/* Product explained? (radio group) */}
          <div className="space-y-2" role="radiogroup" aria-label="Product explained">
            <div className="text-xs font-medium text-gray-600 dark:text-white/70">Product explained?</div>
            <div className="flex flex-wrap gap-4">
              <label className="inline-flex items-center gap-2">
                <input type="radio" name="explained" className="h-4 w-4" checked={form.explained === "yes"} onChange={() => set("explained", "yes")} />
                <span>Yes</span>
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="radio" name="explained" className="h-4 w-4" checked={form.explained === "no"} onChange={() => set("explained", "no")} />
                <span>No</span>
              </label>
            </div>
          </div>

          {/* Channel (if yes) */}
          {form.explained === "yes" && (
            <div className="space-y-2" role="radiogroup" aria-label="Channel">
              <div className="text-xs font-medium text-gray-600 dark:text-white/70">Channel</div>
              <div className="flex flex-wrap gap-4">
                {(["whatsapp", "call", "zoom"] as const).map((ch) => (
                  <label key={ch} className="inline-flex items-center gap-2">
                    <input type="radio" name="channel" className="h-4 w-4" checked={form.channel === ch} onChange={() => set("channel", ch)} />
                    <span className="capitalize">{ch === "zoom" ? "Zoom/Meet" : ch}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Reason if No */}
          {form.explained === "no" && (
            <LabeledTextArea label="Reason" value={form.reasonIfNo} onChange={(v) => set("reasonIfNo", v)} placeholder="Why not explained?" />
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
            <LabeledInput type="datetime-local" label="Next follow-up date" value={form.nextFollowAt ?? ""} onChange={(v) => set("nextFollowAt", v)} />
            <LabeledInput label="Lead code" value={lead?.leadCode ?? "—"} disabled />
          </div>

          {/* Notes */}
          <LabeledTextArea className="sm:col-span-2" label="Notes" value={form.notes} onChange={(v) => set("notes", v)} placeholder="Any remarks from the conversation" />
        </div>

        <div className="mt-4 flex justify-end">
          <button onClick={save} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            Save
          </button>
        </div>
      </section>
    </div>
  );
}

/* field helpers */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-32 shrink-0 text-xs font-medium text-gray-500 dark:text-white/60">{label}</div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function LabeledInput({
  label, value, onChange, placeholder, type = "text", disabled, className = "",
}: { label: string; value: string; onChange?: (v: string) => void; placeholder?: string; type?: string; disabled?: boolean; className?: string; }) {
  return (
    <div className={className}>
      <div className="mb-1 text-xs font-medium text-gray-600 dark:text-white/70">{label}</div>
      <input
        type={type}
        disabled={disabled}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-lg border border-gray-200 bg-transparent px-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-indigo-300 focus:ring-3 focus:ring-indigo-500/10 disabled:opacity-70 dark:border-white/10 dark:text-white/90 dark:placeholder:text-white/30"
      />
    </div>
  );
}

function LabeledTextArea({
  label, value, onChange, placeholder, className = "",
}: { label: string; value: string; onChange?: (v: string) => void; placeholder?: string; className?: string; }) {
  return (
    <div className={className}>
      <div className="mb-1 text-xs font-medium text-gray-600 dark:text-white/70">{label}</div>
      <textarea
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        rows={4}
        className="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:border-indigo-300 focus:ring-3 focus:ring-indigo-500/10 dark:border-white/10 dark:text-white/90 dark:placeholder:text-white/30"
      />
    </div>
  );
}

function LabeledSelect({
  label, value, onChange, options,
}: { label: string; value: string; onChange: (v: string) => void; options: [string, string][]; }) {
  return (
    <div>
      <div className="mb-1 text-xs font-medium text-gray-600 dark:text-white/70">{label}</div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-lg border border-gray-200 bg-transparent px-3 text-sm text-gray-800 focus:border-indigo-300 focus:ring-3 focus:ring-indigo-500/10 dark:border-white/10 dark:text-white/90"
      >
        {options.map(([val, lab]) => (
          <option key={val} value={val}>{lab}</option>
        ))}
      </select>
    </div>
  );
}
