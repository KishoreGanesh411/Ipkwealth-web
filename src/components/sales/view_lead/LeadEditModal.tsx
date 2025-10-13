import { useEffect, useMemo, useRef, useState } from "react";
import { Modal } from "../../ui/modal";
import Button from "../../ui/button/Button";
import Label from "../../form/Label";

import {
  genderOptions,
  professionOptions,
  productOptions,
  leadOptions,
  investmentOptions,
  valueToLabel,
  titleCaseWords,
} from "@/components/lead/types";

import type { LeadShape } from "../../ui/lead/Validators";

/**
 * Define additional fields that may come from the backend but are not part of
 * the core LeadShape. We remove clientTypes and clientType since those are
 * deprecated from the UI. LeadSourceOther and referralName remain for
 * conditional editing when leadSource is 'others' or 'referral'.
 */
type OptionalExtras = Partial<{
  leadSourceOther: string | null;
  referralName: string | null;
  assignedRM: string | null;
  age: number | null;
  referralCode: string | null;
  bioText: string | null;
}>;

export type LeadEditModalValues = Partial<LeadShape & OptionalExtras> & {
  fullName?: string;
  primaryPhone?: string;
  whatsappPhone?: string;
};

type LeadEditModalProps = {
  isOpen: boolean;
  onClose: () => void;
  initial?: LeadEditModalValues;
  onSubmit: (values: LeadEditModalValues) => Promise<void> | void;
  saving?: boolean;
  title?: string;
};

const INPUT =
  "mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.07] dark:text-white dark:placeholder:text-white/40";

/**
 * LeadEditModal provides a scrollable form for editing contact and profile
 * details about a lead. The modal has a sticky header and footer, and the
 * central form scrolls independently. The client type field has been
 * removed. Primary and WhatsApp phones are now edited via their own
 * dedicated inputs. Referral name is only shown if the lead source is
 * referral; likewise, the "other" lead source description is shown only
 * when lead source is 'others'. RM assignment information is no longer
 * displayed or editable here.
 */
export default function LeadEditModal({
  isOpen,
  onClose,
  initial = {},
  onSubmit,
  saving = false,
  title = "Edit lead details",
}: LeadEditModalProps) {
  // Local form state; always starts as an object
  const [form, setForm] = useState<LeadEditModalValues>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const firstRef = useRef<HTMLInputElement | null>(null);

  // Derived label for lead source to display in InfoTiles
  const leadSourceLabel = useMemo(() => {
    const raw = String(form.leadSource ?? "");
    if (!raw) return "Not captured";
    if (raw.toLowerCase() === "others") {
      const other = String(form.leadSourceOther ?? initial.leadSourceOther ?? "Others");
      return titleCaseWords(other);
    }
    if (raw.toLowerCase() === "referral" || raw.toLowerCase() === "referred") {
      const refName = String(form.referralName ?? initial.referralName ?? "");
      return refName ? `Referral – ${titleCaseWords(refName)}` : "Referral";
    }
    return valueToLabel(raw, leadOptions) || raw;
  }, [form.leadSource, form.leadSourceOther, form.referralName, initial.leadSourceOther, initial.referralName]);

  // Synchronize local state when modal opens or initial values change
  useEffect(() => {
    if (!isOpen) return;
    const next: LeadEditModalValues = { ...initial };
    // Normalize fields to strings for inputs
    const cleaned: LeadEditModalValues = {
      leadCode: String(next.leadCode ?? ""),
      leadSource: String(next.leadSource ?? ""),
      firstName: String(next.firstName ?? ""),
      lastName: String(next.lastName ?? ""),
      name: String(next.name ?? next.fullName ?? ""),
      email: String(next.email ?? ""),
      primaryPhone: String((next.primaryPhone ?? (next as any).phone ?? "") ?? ""),
      whatsappPhone: String((next.whatsappPhone ?? (next as any).mobile ?? "") ?? ""),
      location: String(next.location ?? ""),
      companyName: String(next.companyName ?? ""),
      designation: String(next.designation ?? ""),
      profession: String(next.profession ?? ""),
      product: String(next.product ?? ""),
      investmentRange: String(next.investmentRange ?? ""),
      sipAmount: ((): any => {
        const raw = (next as any).sipAmount;
        if (raw === null || raw === undefined || raw === "") return "";
        return String(raw);
      })(),
      gender: String(next.gender ?? ""),
      remark: String(next.remark ?? ""),
      referralName: String(next.referralName ?? ""),
      leadSourceOther: String(next.leadSourceOther ?? ""),
      age: next.age ?? null,
      referralCode: String((next as any).referralCode ?? ""),
      bioText: String((next as any).bioText ?? ""),
    };
    setForm(cleaned);
    setErrors({});
    setTimeout(() => firstRef.current?.focus(), 0);
  }, [isOpen, initial]);

  // Input setter helper
  const handle = (k: keyof LeadEditModalValues, v: any) => {
    setForm((prev) => ({ ...(prev ?? {}), [k]: v }));
  };

  /** Validate the form; ensure name and phone numbers are sensible. */
  const validate = () => {
    const nextErrors: Record<string, string> = {};
    const nameOrFirst = String(form.name ?? form.firstName ?? "").trim();
    if (!nameOrFirst) nextErrors.name = "Name is required";
    if (form.email && !/\S+@\S+\.\S+/.test(String(form.email))) nextErrors.email = "Enter a valid email";
    // Validate phone lengths
    const primaryDigits = String(form.primaryPhone ?? "").replace(/[^\d]/g, "");
    if (primaryDigits && primaryDigits.length < 6) nextErrors.primaryPhone = "Phone looks incomplete";
    const whatsappDigits = String(form.whatsappPhone ?? "").replace(/[^\d]/g, "");
    if (whatsappDigits && whatsappDigits.length < 6) nextErrors.whatsappPhone = "Phone looks incomplete";
    // Validate SIP amount
    if (
      form.sipAmount !== "" &&
      form.sipAmount !== null &&
      form.sipAmount !== undefined &&
      Number.isNaN(Number(String(form.sipAmount).replace(/[^0-9.]/g, "")))
    ) {
      nextErrors.sipAmount = "SIP must be a number";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const normalize = (s: unknown) => {
      const t = String(s ?? "").trim();
      return t.length ? t : null;
    };
    const payload: LeadEditModalValues = {
      ...form,
      name: normalize(form.name ?? `${form.firstName ?? ""} ${form.lastName ?? ""}`) ?? undefined,
      firstName: normalize(form.firstName),
      lastName: normalize(form.lastName),
      email: normalize(form.email),
      phone: normalize(String(form.primaryPhone ?? "").replace(/[^\d+]/g, "")),
      mobile: normalize(String(form.whatsappPhone ?? "").replace(/[^\d+]/g, "")),
      location: normalize(form.location),
      companyName: normalize(form.companyName),
      designation: normalize(form.designation),
      profession: normalize(form.profession),
      product: normalize(form.product),
      investmentRange: normalize(form.investmentRange),
      sipAmount:
        form.sipAmount !== "" && form.sipAmount !== null && form.sipAmount !== undefined
          ? Number(String(form.sipAmount).replace(/[^0-9.]/g, ""))
          : null,
      gender: normalize(form.gender),
      remark: normalize(form.remark),
      referralName: normalize(form.referralName),
      leadSourceOther: normalize(form.leadSourceOther),
      // additional fields
      age:
        form.age !== null && form.age !== undefined && form.age !== ""
          ? Number(form.age)
          : null,
      referralCode: normalize(form.referralCode),
      bioText: normalize(form.bioText),
    };
    await onSubmit(payload);
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-screen-lg w-full p-4">
      <form
        onSubmit={submit}
        className="relative flex flex-col overflow-hidden rounded-3xl bg-white dark:bg-gray-900"
      >
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 flex flex-col gap-1 border-b border-gray-100 bg-white/90 px-6 py-4 backdrop-blur dark:border-white/10 dark:bg-gray-900/80">
          <h4 className="text-xl font-semibold text-gray-800 dark:text-white/90">{title}</h4>
          <p className="text-sm text-gray-500 dark:text-white/50">
            Update contact, profiling and opportunity details.
          </p>
        </div>
        {/* Scrollable form content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 max-h-[70vh] space-y-6">
          {/* Info tiles */}
          <div className="grid gap-3 rounded-2xl border border-gray-100 bg-white/70 p-3 dark:border-white/10 dark:bg-white/[0.04] sm:grid-cols-2">
            <InfoTile label="Lead code" value={String(form.leadCode ?? "Not generated")} />
            <InfoTile label="Lead source" value={leadSourceLabel} />
          </div>
          {/* Name and contact section */}
          <div className="grid gap-4 rounded-2xl border border-gray-100 p-4 dark:border-white/10 sm:grid-cols-2">
            <Field label="Full name" error={errors.name}>
              <input
                ref={firstRef}
                className={INPUT}
                value={String(form.name ?? "")}
                onChange={(e) => handle("name", e.target.value)}
                placeholder="Enter full name"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="First name">
                <input
                  className={INPUT}
                  value={String(form.firstName ?? "")}
                  onChange={(e) => handle("firstName", e.target.value)}
                  placeholder="Optional"
                />
              </Field>
              <Field label="Last name">
                <input
                  className={INPUT}
                  value={String(form.lastName ?? "")}
                  onChange={(e) => handle("lastName", e.target.value)}
                  placeholder="Optional"
                />
              </Field>
            </div>
            <Field label="Primary email" error={errors.email}>
              <input
                className={INPUT + (errors.email ? " border-rose-400 focus:ring-rose-200" : "")}
                value={String(form.email ?? "")}
                onChange={(e) => handle("email", e.target.value)}
                placeholder="name@email.com"
                type="email"
                autoComplete="email"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Primary phone" error={errors.primaryPhone}>
                <input
                  className={INPUT + (errors.primaryPhone ? " border-rose-400 focus:ring-rose-200" : "")}
                  value={String(form.primaryPhone ?? "")}
                  onChange={(e) => handle("primaryPhone", e.target.value)}
                  placeholder="Primary number"
                  inputMode="tel"
                  autoComplete="tel"
                />
              </Field>
              <Field label="WhatsApp number" error={errors.whatsappPhone}>
                <input
                  className={INPUT + (errors.whatsappPhone ? " border-rose-400 focus:ring-rose-200" : "")}
                  value={String(form.whatsappPhone ?? "")}
                  onChange={(e) => handle("whatsappPhone", e.target.value)}
                  placeholder="WhatsApp number"
                  inputMode="tel"
                  autoComplete="tel"
                />
              </Field>
            </div>
            <Field label="Location">
              <input
                className={INPUT}
                value={String(form.location ?? "")}
                onChange={(e) => handle("location", e.target.value)}
                placeholder="City / Area"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Gender">
                <select
                  className={INPUT}
                  value={String(form.gender ?? "")}
                  onChange={(e) => handle("gender", e.target.value)}
                >
                  <option value="">Select gender</option>
                  {genderOptions.map((o: any) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Age (years)">
                <input
                  type="number"
                  min="0"
                  className={INPUT}
                  value={String(form.age ?? "")}
                  onChange={(e) => handle("age", e.target.value)}
                  placeholder="Age"
                />
              </Field>
            </div>
          </div>
          {/* Professional details */}
          <div className="grid gap-4 rounded-2xl border border-gray-100 p-4 dark:border-white/10 sm:grid-cols-2">
            <Field label="Profession">
              <input
                className={INPUT}
                list="profession-options"
                value={String(form.profession ?? "")}
                onChange={(e) => handle("profession", e.target.value)}
                placeholder="Select or type profession"
              />
              <datalist id="profession-options">
                {professionOptions.map((o: any) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </datalist>
            </Field>
            <Field label="Designation">
              <input
                className={INPUT}
                value={String(form.designation ?? "")}
                onChange={(e) => handle("designation", e.target.value)}
                placeholder="Job title"
              />
            </Field>
            <Field label="Company / Organisation">
              <input
                className={INPUT}
                value={String(form.companyName ?? "")}
                onChange={(e) => handle("companyName", e.target.value)}
                placeholder="Company name"
              />
            </Field>
            <Field label="Product">
              <input
                className={INPUT}
                list="product-options"
                value={String(form.product ?? "")}
                onChange={(e) => handle("product", e.target.value)}
                placeholder="IAP / SIP / MF / Insurance"
              />
              <datalist id="product-options">
                {productOptions.map((o: any) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </datalist>
            </Field>
            <Field label="Investment range">
              <input
                className={INPUT}
                list="investment-options"
                value={String(form.investmentRange ?? "")}
                onChange={(e) => handle("investmentRange", e.target.value)}
                placeholder="e.g. 10-25L"
              />
              <datalist id="investment-options">
                {investmentOptions.map((o: any) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </datalist>
            </Field>
            <Field label="SIP amount (₹)" error={errors.sipAmount}>
              <input
                className={INPUT + (errors.sipAmount ? " border-rose-400 focus:ring-rose-200" : "")}
                value={String(form.sipAmount ?? "")}
                onChange={(e) => handle("sipAmount", e.target.value)}
                placeholder="Monthly commitment"
                inputMode="decimal"
              />
            </Field>
            {/* Referral code field */}
            <Field label="Referral code">
              <input
                className={INPUT}
                value={String(form.referralCode ?? "")}
                onChange={(e) => handle("referralCode", e.target.value)}
                placeholder="Referral code"
              />
            </Field>
            {/* Referral name field; show when lead source is referral */}
            {(String(form.leadSource ?? "").toLowerCase() === "referral" || String(form.leadSource ?? "").toLowerCase() === "referred") && (
              <Field label="Referral name (if any)">
                <input
                  className={INPUT}
                  value={String(form.referralName ?? "")}
                  onChange={(e) => handle("referralName", e.target.value)}
                  placeholder="Who referred this lead?"
                />
              </Field>
            )}
            {/* Other lead source description */}
            {String(form.leadSource ?? "").toLowerCase() === "others" && (
              <Field label="If lead source = Others, specify">
                <input
                  className={INPUT}
                  value={String(form.leadSourceOther ?? "")}
                  onChange={(e) => handle("leadSourceOther", e.target.value)}
                  placeholder="Describe the source"
                />
              </Field>
            )}
            {/* Notes / remark */}
            <div className="col-span-2">
              <Field label="Notes / remark">
                <textarea
                  rows={3}
                  className={INPUT + " resize-none"}
                  value={String(form.remark ?? "")}
                  onChange={(e) => handle("remark", e.target.value)}
                  placeholder="Add context that helps the RM engage better…"
                />
              </Field>
            </div>
            {/* Biography */}
            <div className="col-span-2">
              <Field label="Biography (optional)">
                <textarea
                  rows={3}
                  className={INPUT + " resize-none"}
                  value={String(form.bioText ?? "")}
                  onChange={(e) => handle("bioText", e.target.value)}
                  placeholder="Short biography or notes about the lead…"
                />
              </Field>
            </div>
          </div>
          {/* Save tips */}
          <div className="flex flex-col gap-2 rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/60 p-4 text-xs text-emerald-700 dark:border-emerald-400/40 dark:bg-emerald-500/10 dark:text-emerald-100">
            <p className="font-semibold">Heads up before saving</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Updating name or contact info reflects everywhere the lead appears.</li>
              <li>Keep SIP amount numeric; leave blank if not yet captured.</li>
              <li>Use referral fields only when lead source is referral.</li>
            </ul>
          </div>
        </div>
        {/* Sticky Footer */}
        <div className="sticky bottom-0 z-10 flex items-center justify-end gap-3 border-t border-gray-100 bg-white/80 px-6 py-3 backdrop-blur dark:border-white/10 dark:bg-gray-900/70">
          <Button size="sm" variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button size="sm" type="submit" disabled={saving}>
            {saving ? "Saving…" : "Confirm & Save"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/**
 * Reusable field wrapper. Displays a label and children plus an optional error.
 */
function Field({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
  return (
    <div className="flex flex-col">
      <Label className="text-xs">{label}</Label>
      {children}
      {error && <span className="mt-1 text-xs text-rose-500">{error}</span>}
    </div>
  );
}

/** Info tile used to display key information in the modal header */
function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-3 py-3 text-xs text-gray-500 shadow-sm dark:border-white/10 dark:bg-white/[0.03] dark:text-white/60">
      <p className="font-semibold uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}