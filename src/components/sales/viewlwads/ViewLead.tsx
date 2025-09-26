import { useLocation, useParams } from "react-router-dom";
import { useMemo, useState, type ReactNode } from "react";
import Badge from "@/components/ui/badge/Badge";

type LeadRow = {
  id: string | number;
  leadCode: string | null;
  name: string;
  phone?: string;
  assignedAt?: string;
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
    | "FIRST_TALK_DONE"
    | "FOLLOWING_UP"
    | "CLIENT_INTERESTED"
    | "ACCOUNT_OPENED"
    | "NO_RESPONSE_DORMANT"
    | "NOT_INTERESTED_DORMANT"
    | "RISKY_CLIENT_DORMANT"
    | "HIBERNATED";
  nextFollowAt?: string;
  notes: string;
  altPhone?: string;
  investmentRange?: string;
  clientType?: "employee" | "business" | "student" | "retired" | "other";
  professionDetails?: string;
  businessOrCompany?: string;
};

const STATUS_OPTIONS: [EventForm["status"], string][] = [
  ["FIRST_TALK_DONE", "First talk done"],
  ["FOLLOWING_UP", "Following up"],
  ["CLIENT_INTERESTED", "Client interested"],
  ["ACCOUNT_OPENED", "Account opened"],
  ["NO_RESPONSE_DORMANT", "No response - dormant"],
  ["NOT_INTERESTED_DORMANT", "Not interested - dormant"],
  ["RISKY_CLIENT_DORMANT", "Risky client - dormant"],
  ["HIBERNATED", "Hibernated"],
];

export default function ViewLead() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const passed = (location.state as { lead?: LeadRow } | null)?.lead;

  const lead: LeadRow | null = useMemo(() => passed ?? null, [passed]);

  const [form, setForm] = useState<EventForm>({
    explained: null,
    reasonIfNo: "",
    channel: null,
    status: STATUS_OPTIONS[0][0],
    nextFollowAt: "",
    notes: "",
    altPhone: "",
    investmentRange: "",
    clientType: "employee",
    professionDetails: "",
    businessOrCompany: "",
  });

  const set = <K extends keyof EventForm>(key: K, value: EventForm[K]) =>
    setForm((state) => ({ ...state, [key]: value }));

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

  const explainedId = "rg-explained";
  const channelId = "rg-channel";
  const fallbackValue = "--";
  const selectedStatusLabel =
    STATUS_OPTIONS.find(([value]) => value === form.status)?.[1] ?? "Status";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-white">
          View Lead
        </h1>

        <div className="flex flex-wrap items-center gap-2">
          {lead?.product && (
            <Badge size="sm" color="info">
              {lead.product}
            </Badge>
          )}
          <Badge size="sm" color="success">
            {selectedStatusLabel}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card>
            <SectionTitle>Lead snapshot</SectionTitle>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <DetailBlock label="Lead code">
                {lead?.leadCode ? (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-lg bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                      {lead.leadCode}
                    </span>
                    <button
                      type="button"
                      onClick={copyLeadCode}
                      className="rounded-lg border border-emerald-200 px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-200"
                      title="Copy lead code"
                    >
                      Copy
                    </button>
                  </div>
                ) : (
                  fallbackValue
                )}
              </DetailBlock>
              <DetailBlock label="Lead name">{lead?.name ?? fallbackValue}</DetailBlock>
              <DetailBlock label="Product">{lead?.product ?? fallbackValue}</DetailBlock>
              <DetailBlock label="Mobile number">{lead?.phone ?? fallbackValue}</DetailBlock>
              <DetailBlock label="Lead source">{lead?.leadSource ?? fallbackValue}</DetailBlock>
              <DetailBlock label="Assigned date">
                {lead?.assignedAt ? new Date(lead.assignedAt).toLocaleString() : fallbackValue}
              </DetailBlock>
              <DetailBlock label="Company">{lead?.company ?? fallbackValue}</DetailBlock>
              <DetailBlock label="Profession">{lead?.profession ?? fallbackValue}</DetailBlock>
            </div>
          </Card>

          <Card>
            <SectionTitle>Your interaction & connected channels</SectionTitle>

            <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
              <div role="radiogroup" aria-labelledby={explainedId} className="space-y-2 md:col-span-2">
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

              {form.explained === "yes" && (
                <div role="radiogroup" aria-labelledby={channelId} className="space-y-2 md:col-span-2">
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

              {form.explained === "no" && (
                <LabeledTextArea
                  label="Reason"
                  value={form.reasonIfNo}
                  onChange={(v) => set("reasonIfNo", v)}
                  placeholder="Why was the product not explained?"
                  className="md:col-span-2"
                />
              )}

              <LabeledSelect
                label="Event status"
                value={form.status}
                onChange={(v) => set("status", v as EventForm["status"])}
                options={STATUS_OPTIONS}
                className="md:col-span-2"
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:col-span-2">
                <LabeledInput
                  type="datetime-local"
                  label="Next follow-up date"
                  value={form.nextFollowAt ?? ""}
                  onChange={(v) => set("nextFollowAt", v)}
                />
                <LabeledInput
                  label="Lead code"
                  value={lead?.leadCode ?? ""}
                  disabled
                  placeholder="Not available"
                  inputClassName="border-emerald-300 bg-emerald-50 text-emerald-700 font-semibold disabled:opacity-100"
                />
              </div>

              <LabeledTextArea
                className="md:col-span-2"
                label="Notes"
                value={form.notes}
                onChange={(v) => set("notes", v)}
                placeholder="Any remarks from the conversation"
              />
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={save}
                className="h-11 rounded-xl bg-emerald-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[.99]"
              >
                Save
              </button>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <SectionTitle>Additional details</SectionTitle>
            <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              <LabeledInput label="Product" value={lead?.product ?? ""} disabled />
              <LabeledInput
                label="Investment range"
                value={form.investmentRange ?? ""}
                onChange={(v) => set("investmentRange", v)}
                placeholder="e.g., 10k-25k"
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
              <LabeledInput
                label="Business / Company"
                value={form.businessOrCompany || lead?.company || ""}
                onChange={(v) => set("businessOrCompany", v)}
                placeholder="Company name"
                className="sm:col-span-2"
              />
              <LabeledInput
                label="Profession details"
                value={form.professionDetails || lead?.profession || ""}
                onChange={(v) => set("professionDetails", v)}
                placeholder="Designation or domain"
                className="sm:col-span-2"
              />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-gray-100 bg-white p-5 shadow-sm ring-1 ring-black/0 transition dark:border-white/10 dark:bg-white/[0.02] ${className}`}>
      {children}
    </section>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-white/80">
      <DotIcon className="h-4 w-4 text-emerald-500" />
      {children}
    </h2>
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
  inputClassName = "",
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
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
        className={`h-10 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-300 focus:outline-hidden focus:ring-3 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-70 dark:border-white/10 dark:bg-white/[0.06] dark:text-white ${inputClassName}`}
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
        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-300 focus:outline-hidden focus:ring-3 focus:ring-emerald-200 dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
      />
    </div>
  );
}

function LabeledSelect({
  label,
  value,
  onChange,
  options,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="mb-1 text-xs font-medium text-gray-600 dark:text-white/70">
        {label}
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-gray-900 focus:border-emerald-300 focus:outline-hidden focus:ring-3 focus:ring-emerald-200 dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
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
        className="h-4 w-4 accent-emerald-600"
        checked={checked}
        onChange={onChange}
      />
      <span>{label}</span>
    </label>
  );
}

function DetailBlock({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 dark:border-white/10 dark:bg-white/[0.04]">
      <div className="text-xs font-medium text-gray-500 dark:text-white/60">{label}</div>
      <div className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{children}</div>
    </div>
  );
}

function DotIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true">
      <circle cx="10" cy="10" r="3" />
    </svg>
  );
}
