import { useLocation, useParams } from "react-router-dom";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Badge from "@/components/ui/badge/Badge";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { LeadStage } from "@/components/sales/myleads/interface/type";

type LeadRow = {
  id: string | number;
  leadCode: string | null;
  name: string;
  phone?: string;
  assignedAt?: string;
  leadSource: string;
  product?: string | null;
  status?: LeadStage | null;
  profession?: string | null;
  company?: string | null;
};

type EventForm = {
  explained: "yes" | "no" | null;
  reasonIfNo: string;
  channel: "whatsapp" | "call" | "zoom" | null;
  status: LeadStage | null;
  product: string;
  nextFollowAt?: string;
  notes: string;
  altPhone?: string;
  investmentRange?: string;
  clientType?: "employee" | "business" | "student" | "retired" | "other";
  professionDetails?: string;
  businessOrCompany?: string;
};

type PromptTone = "success" | "error" | "info";
type PromptState = {
  title: string;
  message?: string;
  tone: PromptTone;
};

const STATUS_OPTIONS: [LeadStage, string][] = [
  [LeadStage.FIRST_TALK_DONE, "First talk done"],
  [LeadStage.FOLLOWING_UP, "Following up"],
  [LeadStage.CLIENT_INTERESTED, "Client interested"],
  [LeadStage.ACCOUNT_OPENED, "Account opened"],
  [LeadStage.NO_RESPONSE_DORMANT, "No response - dormant"],
  [LeadStage.NOT_INTERESTED_DORMANT, "Not interested - dormant"],
  [LeadStage.RISKY_CLIENT_DORMANT, "Risky client - dormant"],
  [LeadStage.HIBERNATED, "Hibernated"],
];

const PRODUCT_OPTIONS: [string, string][] = [
  ["", "Select product"],
  ["IAP", "Investment Advisory Plan (IAP)"],
  ["SIP", "Systematic Investment Plan (SIP)"],
];

export default function ViewLead() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const passed = (location.state as { lead?: LeadRow } | null)?.lead;

  const lead: LeadRow | null = useMemo(() => passed ?? null, [passed]);

  const [prompt, setPrompt] = useState<PromptState | null>(null);
  const promptTimeoutRef = useRef<number | null>(null);

  const [form, setForm] = useState<EventForm>(() => ({
    explained: null,
    reasonIfNo: "",
    channel: null,
    status: lead?.status ?? null,
    product: lead?.product ?? "",
    nextFollowAt: "",
    notes: "",
    altPhone: "",
    investmentRange: "",
    clientType: "employee",
    professionDetails: lead?.profession ?? "",
    businessOrCompany: lead?.company ?? "",
  }));

  useEffect(() => {
    if (!lead) return;
    setForm((state) => ({
      ...state,
      product: state.product || lead.product || "",
      professionDetails: state.professionDetails || lead.profession || "",
      businessOrCompany: state.businessOrCompany || lead.company || "",
      status: state.status ?? lead.status ?? null,
    }));
  }, [lead]);

  useEffect(() => {
    return () => {
      if (promptTimeoutRef.current) {
        window.clearTimeout(promptTimeoutRef.current);
      }
    };
  }, []);

  const showPrompt = (payload: PromptState) => {
    if (promptTimeoutRef.current) {
      window.clearTimeout(promptTimeoutRef.current);
    }
    setPrompt(payload);
    promptTimeoutRef.current = window.setTimeout(() => setPrompt(null), 2800);
  };

  const set = <K extends keyof EventForm>(key: K, value: EventForm[K]) =>
    setForm((state) => ({ ...state, [key]: value }));

  const copyLeadCode = async () => {
    const code = lead?.leadCode?.trim();
    if (!code) {
      showPrompt({
        tone: "info",
        title: "No lead code yet",
        message: "Add a lead code before copying.",
      });
      return;
    }
    try {
      await navigator.clipboard.writeText(code);
      showPrompt({
        tone: "success",
        title: "Lead code copied",
        message: `${code} is ready to share.`,
      });
    } catch (error) {
      console.error("Clipboard copy failed", error);
      showPrompt({
        tone: "error",
        title: "Copy failed",
        message: "Please copy the code manually.",
      });
    }
  };

  const save = () => {
    console.log("Dummy save for lead", id, form);
    showPrompt({
      tone: "success",
      title: "Changes staged",
      message: "Preview only. Connect the API to persist updates.",
    });
  };

  const explainedId = "rg-explained";
  const channelId = "rg-channel";
  const fallbackValue = "--";

  const statusSelectOptions = useMemo<[string, string][]>(() => {
    return [["", "Select stage"], ...STATUS_OPTIONS.map(([value, label]) => [value, label])];
  }, []);

  const productSelectOptions = useMemo<[string, string][]>(() => {
    const base = [...PRODUCT_OPTIONS];
    const leadProduct = (lead?.product ?? "").trim();
    if (leadProduct && !base.some(([value]) => value === leadProduct)) {
      base.push([leadProduct, leadProduct]);
    }
    return base;
  }, [lead?.product]);

  const selectedStatusLabel = form.status
    ? STATUS_OPTIONS.find(([value]) => value === form.status)?.[1] ?? "Status"
    : "Stage not selected";
  const statusBadgeColor = form.status ? "success" : "warning";
  const heroProduct = form.product || lead?.product || null;
  const summaryProduct = heroProduct ?? fallbackValue;
  const summaryCompany = form.businessOrCompany?.trim() || lead?.company || null;
  const snapshotAssignedAt = lead?.assignedAt ? new Date(lead.assignedAt).toLocaleString() : null;

  return (
    <div className="relative space-y-6">
      {prompt && <PromptOverlay prompt={prompt} onDismiss={() => setPrompt(null)} />}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-white">View Lead</h1>

        <div className="flex flex-wrap items-center gap-2">
          {heroProduct && (
            <Badge size="sm" color="info">{heroProduct}</Badge>
          )}
          <Badge size="sm" color={statusBadgeColor}>
            {selectedStatusLabel}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card className="border-emerald-100/70 bg-gradient-to-br from-white/95 via-white/95 to-emerald-50/70 shadow-lg shadow-emerald-100/60 backdrop-blur dark:border-emerald-400/20 dark:from-white/[0.08] dark:via-white/[0.05] dark:to-emerald-500/10">
            <SectionTitle>Lead snapshot</SectionTitle>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <DetailBlock label="Lead code">
                {lead?.leadCode ? (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-xl bg-emerald-100/80 px-3 py-1 text-sm font-semibold text-emerald-700">
                      {lead.leadCode}
                    </span>
                    <button
                      type="button"
                      onClick={copyLeadCode}
                      className="rounded-xl border border-emerald-200/70 bg-white/80 px-3 py-1 text-xs font-medium text-emerald-700 shadow-sm transition hover:bg-emerald-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-200 dark:border-emerald-400/40 dark:bg-white/10 dark:text-emerald-100 dark:hover:bg-emerald-500/20"
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
              <DetailBlock label="Current stage">{selectedStatusLabel}</DetailBlock>
              <DetailBlock label="Product">{summaryProduct}</DetailBlock>
              <DetailBlock label="Mobile number">{lead?.phone ?? fallbackValue}</DetailBlock>
              <DetailBlock label="Lead source">{lead?.leadSource ?? fallbackValue}</DetailBlock>
              <DetailBlock label="Assigned date">{snapshotAssignedAt ?? fallbackValue}</DetailBlock>
              <DetailBlock label="Company">{summaryCompany ?? fallbackValue}</DetailBlock>
            </div>
          </Card>

          <Card className="border-sky-100/60 bg-white/95 shadow-md dark:border-sky-400/20 dark:bg-white/[0.08]">
            <SectionTitle>Your interaction & connected channels</SectionTitle>

            <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
              <div role="radiogroup" aria-labelledby={explainedId} className="space-y-2 md:col-span-2">
                <div id={explainedId} className="text-xs font-medium text-gray-600 dark:text-white/70">
                  Product explained?
                </div>
                <div className="flex flex-wrap gap-3">
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
                  <div className="flex flex-wrap gap-3">
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
                value={form.status ?? ""}
                onChange={(v) => set("status", v ? (v as LeadStage) : null)}
                options={statusSelectOptions}
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
          <Card className="border-emerald-100/60 bg-white/95 shadow-md dark:border-emerald-400/20 dark:bg-white/[0.08]">
            <SectionTitle>Additional details</SectionTitle>
            <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              <LabeledSelect
                label="Product"
                value={form.product || ""}
                onChange={(v) => set("product", v)}
                options={productSelectOptions}
              />
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

function PromptOverlay({ prompt, onDismiss }: { prompt: PromptState; onDismiss: () => void }) {
  const toneMap: Record<PromptTone, { classes: string; Icon: typeof CheckCircle2 }> = {
    success: {
      classes:
        "border-emerald-200 bg-white/90 text-emerald-700 shadow-emerald-200/40 dark:border-emerald-400/40 dark:bg-emerald-500/10 dark:text-emerald-100",
      Icon: CheckCircle2,
    },
    info: {
      classes:
        "border-sky-200 bg-white/90 text-sky-700 shadow-sky-200/40 dark:border-sky-400/40 dark:bg-sky-500/10 dark:text-sky-100",
      Icon: Info,
    },
    error: {
      classes:
        "border-rose-200 bg-white/90 text-rose-700 shadow-rose-200/40 dark:border-rose-400/40 dark:bg-rose-500/10 dark:text-rose-100",
      Icon: AlertCircle,
    },
  };

  const { classes, Icon } = toneMap[prompt.tone];

  return (
    <div className="pointer-events-none fixed left-1/2 top-24 z-[60] flex w-full max-w-md -translate-x-1/2 px-4">
      <div
        className={`pointer-events-auto flex w-full items-start gap-3 rounded-2xl border px-4 py-3 shadow-lg backdrop-blur ${classes}`}
        role="status"
        aria-live="assertive"
      >
        <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <div className="flex-1">
          <p className="text-sm font-semibold leading-snug">{prompt.title}</p>
          {prompt.message && <p className="mt-0.5 text-xs leading-relaxed opacity-80">{prompt.message}</p>}
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/60 bg-white/40 text-xs text-gray-500 transition hover:bg-white/70 hover:text-gray-700 focus:outline-hidden focus:ring-2 focus:ring-white dark:border-white/20 dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/20"
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={`rounded-2xl border border-gray-100/80 bg-white/95 p-5 shadow-sm ring-1 ring-black/0 transition backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.04] ${className}`}
    >
      {children}
    </section>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-white/80">
      <DotIcon className="h-2.5 w-2.5 text-emerald-500" />
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
      <div className="mb-1 text-xs font-medium text-gray-600 dark:text-white/70">{label}</div>
      <input
        type={type}
        disabled={disabled}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className={`h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-300 focus:outline-hidden focus:ring-3 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-70 dark:border-white/10 dark:bg-white/[0.06] dark:text-white ${inputClassName}`}
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
      <div className="mb-1 text-xs font-medium text-gray-600 dark:text-white/70">{label}</div>
      <textarea
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        rows={4}
        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-300 focus:outline-hidden focus:ring-3 focus:ring-emerald-200 dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
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
  const isPlaceholder = value === "";
  return (
    <div className={className}>
      <div className="mb-1 text-xs font-medium text-gray-600 dark:text-white/70">{label}</div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm focus:border-emerald-300 focus:outline-hidden focus:ring-3 focus:ring-emerald-200 dark:border-white/10 dark:bg-white/[0.06] ${
          isPlaceholder ? "text-gray-400 dark:text-white/50" : "text-gray-900 dark:text-white"
        }`}
      >
        {options.map(([val, lab]) => (
          <option key={val || lab} value={val} hidden={val === "" && !isPlaceholder}>
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
    <label className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm shadow-sm transition focus-within:ring-2 focus-within:ring-emerald-200 dark:border-white/10 ${
      checked ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-400/40 dark:bg-emerald-500/10 dark:text-emerald-100" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:bg-white/[0.06] dark:text-white"
    }`}>
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
    <div className="rounded-2xl border border-gray-100/70 bg-white/85 px-4 py-3 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.05]">
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
