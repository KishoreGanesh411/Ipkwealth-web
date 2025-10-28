import { useEffect, useMemo, useRef, useState } from "react";
import { Modal } from "../../ui/modal";
import Button from "../../ui/button/Button";
import { useMutation } from "@apollo/client";
import Label from "../../form/Label";
import { toast } from "react-toastify";
import { UPDATE_LEAD_DETAILS } from "../editLead/update_gql/update_lead.gql";
import { UPDATE_LEAD_BIO } from "@/components/sales/view_lead/gql/view_lead.gql";
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

export default function LeadEditModal({
  isOpen,
  onClose,
  initial = {},
  onSubmit,
  saving = false,
  title = "Edit lead details",
}: LeadEditModalProps) {
  const [form, setForm] = useState<LeadEditModalValues>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const firstRef = useRef<HTMLInputElement | null>(null);
  const [mutUpdate, { loading: mutating }] = useMutation(UPDATE_LEAD_DETAILS);
  const [mutBio] = useMutation(UPDATE_LEAD_BIO);

  const leadIdFromUrl = useMemo(() => {
    try {
      const m = typeof window !== "undefined" ? window.location.pathname.match(/leads\/(\w+)/i) : null;
      return m?.[1];
    } catch {
      return undefined;
    }
  }, []);

  const leadSourceLabel = useMemo(() => {
    const raw = String(form.leadSource ?? "");
    if (!raw) return "Not captured";
    if (raw.toLowerCase() === "others") {
      const other = String(form.leadSourceOther ?? initial.leadSourceOther ?? "Others");
      return titleCaseWords(other);
    }
    if (raw.toLowerCase() === "referral" || raw.toLowerCase() === "referred") {
      const refName = String(form.referralName ?? initial.referralName ?? "");
      return refName ? `Referral - ${titleCaseWords(refName)}` : "Referral";
    }
    return valueToLabel(raw, leadOptions) || raw;
  }, [form.leadSource, form.leadSourceOther, form.referralName, initial.leadSourceOther, initial.referralName]);

  useEffect(() => {
    if (!isOpen) return;
    const next: LeadEditModalValues = { ...(initial || {}) };
    setForm(next);
    setErrors({});
    setTimeout(() => firstRef.current?.focus(), 0);
  }, [isOpen, initial]);

  const handle = (k: keyof LeadEditModalValues, v: any) => {
    setForm((prev) => ({ ...(prev ?? {}), [k]: v }));
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    const nameOrFirst = String(form.name ?? form.firstName ?? "").trim();
    if (!nameOrFirst) nextErrors.name = "Name is required";
    if (form.email && !/\S+@\S+\.\S+/.test(String(form.email))) nextErrors.email = "Enter a valid email";
    const primaryDigits = String(form.primaryPhone ?? "").replace(/[^\d]/g, "");
    if (primaryDigits && primaryDigits.length < 6) nextErrors.primaryPhone = "Phone looks incomplete";
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
      age:
        form.age !== null && form.age !== undefined && form.age !== ""
          ? Number(form.age)
          : null,
      bioText: normalize(form.bioText),
    };

    try {
      const input: any = {
        leadId: (initial as any).id ?? (initial as any).leadId ?? leadIdFromUrl,
        name: payload.name,
        firstName: payload.firstName,
        lastName: payload.lastName,
        email: payload.email,
        phone: payload.phone,
        location: payload.location,
        gender: payload.gender,
        age: payload.age ?? undefined,
        profession: payload.profession,
        companyName: payload.companyName,
        designation: payload.designation,
        product: payload.product,
        investmentRange: payload.investmentRange,
        sipAmount: typeof payload.sipAmount === "number" ? payload.sipAmount : undefined,
        bioText: payload.bioText,
      };
      Object.keys(input).forEach((k) => input[k] === undefined && delete input[k]);
      if (!input.leadId) throw new Error("Missing leadId for update");

      await mutUpdate({ variables: { input } });

      const leadId = input.leadId;
      const nextBio = String(payload.bioText ?? "").trim();
      const prevBio = String((initial as any)?.bioText ?? "").trim();
      if (nextBio !== prevBio) {
        await mutBio({ variables: { input: { leadId, bioText: nextBio } } });
      }

      toast.success("Lead updated");
      await onSubmit?.(payload);
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update lead");
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-screen-lg w-full p-4">
      <form onSubmit={submit} className="relative flex flex-col overflow-hidden rounded-3xl bg-white dark:bg-gray-900">
        <div className="sticky top-0 z-10 flex flex-col gap-1 border-b border-gray-100 bg-white/90 px-6 py-4 backdrop-blur dark:border-white/10 dark:bg-gray-900/80">
          <h4 className="text-xl font-semibold text-gray-800 dark:text-white/90">{title}</h4>
          <p className="text-sm text-gray-500 dark:text-white/50">Update contact, profiling and opportunity details.</p>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 max-h-[70vh] space-y-6">
          <div className="grid gap-3 rounded-2xl border border-gray-100 bg-white/70 p-3 dark:border-white/10 dark:bg-white/[0.04] sm:grid-cols-2">
            <InfoTile label="Lead code" value={String(form.leadCode ?? "Not generated")} />
            <InfoTile label="Lead source" value={leadSourceLabel} />
          </div>

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
                <input className={INPUT} value={String(form.firstName ?? "")} onChange={(e) => handle("firstName", e.target.value)} placeholder="Optional" />
              </Field>
              <Field label="Last name">
                <input className={INPUT} value={String(form.lastName ?? "")} onChange={(e) => handle("lastName", e.target.value)} placeholder="Optional" />
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
              <div />
            </div>

            <Field label="Location">
              <input className={INPUT} value={String(form.location ?? "")} onChange={(e) => handle("location", e.target.value)} placeholder="City / Area" />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Gender">
                <select className={INPUT} value={String(form.gender ?? "")} onChange={(e) => handle("gender", e.target.value)}>
                  <option value="">Select gender</option>
                  {genderOptions.map((o: any) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Age">
                <input
                  className={INPUT}
                  value={String(form.age ?? "")}
                  onChange={(e) => handle("age", e.target.value)}
                  placeholder="Optional"
                  inputMode="numeric"
                />
              </Field>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Field label="Profession">
                <select className={INPUT} value={String(form.profession ?? "")} onChange={(e) => handle("profession", e.target.value)}>
                  <option value="">Select profession</option>
                  {professionOptions.map((o: any) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Designation">
                <input className={INPUT} value={String(form.designation ?? "")} onChange={(e) => handle("designation", e.target.value)} placeholder="Optional" />
              </Field>
              <Field label="Company / Organisation">
                <input className={INPUT} value={String(form.companyName ?? "")} onChange={(e) => handle("companyName", e.target.value)} placeholder="Optional" />
              </Field>
            </div>

            <Field label="Product">
              <select className={INPUT} value={String(form.product ?? "")} onChange={(e) => handle("product", e.target.value)}>
                <option value="">Select a product</option>
                {productOptions.map((o: any) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>

            {String(form.product ?? "").toUpperCase() === "IAP" && (
              <Field label="Investment range">
                <select className={INPUT} value={String(form.investmentRange ?? "")} onChange={(e) => handle("investmentRange", e.target.value)}>
                  <option value="">Select range</option>
                  {investmentOptions.map((o: any) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </Field>
            )}

            {String(form.product ?? "").toUpperCase() === "SIP" && (
              <Field label="SIP amount (?)" error={errors.sipAmount}>
                <input
                  className={INPUT + (errors.sipAmount ? " border-rose-400 focus:ring-rose-200" : "")}
                  value={String(form.sipAmount ?? "")}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const raw = e.target.value.replace(/[^0-9.]/g, "");
                    const normalized = raw.split(".").length > 2 ? raw.replace(/\.(?=.*\.)/g, "") : raw;
                    handle("sipAmount", normalized);
                  }}
                  placeholder="Monthly commitment"
                  inputMode="decimal"
                />
              </Field>
            )}

            <Field label="Lead source">
              <select className={INPUT} value={String(form.leadSource ?? "")} onChange={(e) => handle("leadSource", e.target.value)}>
                <option value="">Select source</option>
                {leadOptions.map((o: any) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Biography (optional)">
              <textarea
                rows={3}
                className={INPUT + " resize-none"}
                value={String(form.bioText ?? "")}
                onChange={(e) => handle("bioText", e.target.value)}
                placeholder="Short biography or notes about the lead..."
              />
            </Field>
          </div>

          <div className="flex flex-col gap-2 rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/60 p-4 text-xs text-emerald-700 dark:border-emerald-400/40 dark:bg-emerald-500/10 dark:text-emerald-100">
            <p className="font-semibold">Heads up before saving</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Updating name or contact info reflects everywhere the lead appears.</li>
              <li>Keep SIP amount numeric; leave blank if not yet captured.</li>
            </ul>
          </div>
        </div>

        <div className="sticky bottom-0 z-10 flex items-center justify-end gap-3 border-t border-gray-100 bg-white/80 px-6 py-3 backdrop-blur dark:border-white/10 dark:bg-gray-900/70">
          <Button size="sm" variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button size="sm" type="submit" disabled={saving || mutating}>
            {saving || mutating ? (
              <span className="inline-flex items-center gap-2">please wait updating</span>
            ) : (
              "Confirm & Save"
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function Field({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
  return (
    <div className="flex flex-col">
      <Label className="text-xs">{label}</Label>
      {children}
      {error && <span className="mt-1 text-xs text-rose-500">{error}</span>}
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-3 py-3 text-xs text-gray-500 shadow-sm dark:border-white/10 dark:bg-white/[0.03] dark:text-white/60">
      <p className="font-semibold uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}

