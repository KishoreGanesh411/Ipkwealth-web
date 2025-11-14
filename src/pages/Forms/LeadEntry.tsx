// src/pages/leadEntry.tsx
import { useMemo, useState, useRef, useEffect } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";
import Button from "@/components/ui/button/Button";
import BulkRegistrationButton from "@/components/lead/bulk-register/BulkRegistrationButton";
import BulkImportModal from "@/components/lead/bulk-register/BulkImportModal"; // ⬅ add
import { createLead } from "@/core/graphql/lead/lead";
import { useLazyQuery, useMutation } from "@apollo/client";
import { ASSIGN_LEAD, REASSIGN_LEAD, LEADS_OPEN } from "@/core/graphql/lead/lead.gql";
import { toast } from "react-toastify";
import CreateLeadForm from "@/components/lead/Leadform/Leadform";
import AdditionalInsightsForm from "@/components/lead/Leadform/additional";
import { useModal } from "@/hooks/useModal";
import ConfirmLeadModal from "@/components/ui/lead/ConfirmLeadModal";
import { validateLead } from "@/components/ui/lead/Validators";
import Alert from "@/components/ui/alert/Alert";
import { RemarkIcon } from "@/icons";
import { useAuth } from "@/context/AuthContex";
import { useRms } from "@/core/graphql/user/useRms";

export default function LeadEntry() {
  const [lead, setLead] = useState<any>({
    firstName: "", lastName: "", email: "", phone: "", leadSource: "",
    // assignment
    assignMode: "AUTO" as "AUTO" | "MANUAL",
    assignedRmId: "", assignedRmName: "",
    leadSourceOther: "",
    referralName: "", referralCode: "", referralMode: "NAME" as "NAME" | "LEAD_CODE",
    gender: "", age: "" as number | "", profession: "",
    companyName: "", designation: "", location: "", product: "",
    investmentRange: "", sipAmount: "" as number | "", clientType: "", remark: "",
  });

  const [formError, setFormError] = useState<string | null>(null);
  const alertRef = useRef<HTMLDivElement | null>(null);

  const isCompanyRequired = lead.profession === "BUSINESS" || lead.profession === "EMPLOYEE";
  const isReferral = lead.leadSource === "referral";
  const phoneOk = useMemo(() => /^[0-9+\-\s()]{8,}$/.test(lead.phone.trim()), [lead.phone]);

  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  // Only admins should query active RMs to avoid 400 for marketing users
  const { rms, loading: rmsLoading } = useRms(isAdmin);
  const rmOptions = useMemo(
    () => rms.map((rm) => ({ value: rm.id, label: rm.name })),
    [rms],
  );

  const { isOpen, openModal, closeModal } = useModal();
  const [submitting, setSubmitting] = useState(false);
  const [assignLead] = useMutation(ASSIGN_LEAD);
  const [reassignLead] = useMutation(REASSIGN_LEAD);
  // Optional: auto-resolve referral name when a lead code is provided
  const [findLeadByCode] = useLazyQuery(LEADS_OPEN, { fetchPolicy: "network-only" });

  // NEW: bulk modal state (upload flow)
  const [bulkOpen, setBulkOpen] = useState(false);

  const handleSave = () => {
    const missing: string[] = [];
    if (!lead.firstName.trim()) missing.push("First Name");
    if (!lead.lastName.trim())  missing.push("Last Name");
    if (!lead.phone.trim())     missing.push("Phone");
    if (!lead.leadSource.trim()) missing.push("Lead Source");
    if (!phoneOk)               missing.push("Phone (invalid format)");
    if (missing.length) {
      setFormError(`Please fill the following required fields correctly: ${missing.join(", ")}.`);
      return;
    }
    const vr = validateLead(lead);
    if (!vr.ok) {
      const msg: string[] = [];
      if (vr.missing.length) msg.push(`Missing: ${vr.missing.join(", ")}`);
      if (vr.invalid.length) msg.push(`Invalid: ${vr.invalid.join(", ")}`);
      setFormError(`Please fix these before continuing. ${msg.join(" | ")}`);
      return;
    }
    setFormError(null);
    openModal();
  };

  useEffect(() => {
    if (formError && alertRef.current) {
      alertRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [formError]);

  const handleConfirmSave = async () => {
    setSubmitting(true);
    try {
      const normalizedLeadSource =
        lead.leadSource === "others"
          ? lead.leadSourceOther?.trim()
          : lead.leadSource?.trim();

      // Build occupations[] for new embedded occupation schema
      const occItem: Record<string, any> = {};
      if (lead.profession && String(lead.profession).trim()) occItem.profession = String(lead.profession).trim();
      if (lead.companyName && String(lead.companyName).trim()) occItem.companyName = String(lead.companyName).trim();
      if (lead.designation && String(lead.designation).trim()) occItem.designation = String(lead.designation).trim();
      const occupations = Object.keys(occItem).length ? [occItem] : undefined;

      // Resolve referral by mode when source is referral
      const referralByName = lead.leadSource === "referral"
        ? (lead.referralName?.trim() || undefined)
        : undefined;
      const referralByCode = lead.leadSource === "referral"
        ? (lead.referralCode?.trim() || undefined)
        : undefined;

      const payload = {
        firstName: lead.firstName || undefined,
        lastName: lead.lastName || undefined,
        email: lead.email || undefined,
        phone: lead.phone,
        leadSource: normalizedLeadSource || undefined,
        referralName: referralByName,
        referralCode: referralByCode,
        // assignment is applied post-create via reassignLead (manual) or assignLead (auto)
        gender: lead.gender || undefined,
        age: lead.age ? Number(lead.age) : undefined,
        location: lead.location || undefined,
        // occupations embedded array as per schema (no top-level profession/company/designation)
        occupations,
        product: lead.product || undefined,
        investmentRange: lead.investmentRange || undefined,
        sipAmount: lead.sipAmount ? Number(lead.sipAmount) : undefined,
        clientTypes: lead.clientType || undefined,
        remark: lead.remark || undefined,
      };
      const created = await createLead(payload);

      // After creation, apply RM assignment based on admin's selection.
      // - AUTO: call backend round-robin assignLead
      // - MANUAL: explicitly reassign to selected RM
      if (isAdmin && created?.id) {
        const mode = (lead.assignMode ?? "AUTO");
        if (mode === "AUTO") {
          try {
            await assignLead({ variables: { id: created.id } });
          } catch {
            // ignore assignment failure; lead is still created
          }
        } else if (mode === "MANUAL" && lead.assignedRmId) {
          try {
            await reassignLead({
              variables: {
                input: { leadId: created.id, newRmId: lead.assignedRmId },
              },
            });
          } catch {
            // ignore assignment failure; lead is still created
          }
        }
      }
      toast.success(created?.leadCode ? `Lead created: ${created.leadCode}` : "Lead created");
      setLead({
        firstName: "", lastName: "", email: "", phone: "", leadSource: "",
        assignMode: "AUTO",
        assignedRmId: "", assignedRmName: "",
        leadSourceOther: "",
        referralName: "", referralCode: "", referralMode: "NAME",
        gender: "", age: "" as number | "", profession: "",
        companyName: "", designation: "", location: "", product: "",
        investmentRange: "", sipAmount: "" as number | "", clientType: "", remark: "",
      });
    } catch (err: any) {
      const msg = err?.graphQLErrors?.[0]?.message ?? err?.message ?? "Something went wrong while saving.";
      setFormError(msg);
    } finally {
      setSubmitting(false);
      closeModal();
    }
  };

  // When referral is by code, try to look up the referrer's name and prefill referralName
  useEffect(() => {
    const wantLookup = lead.leadSource === "referral" && (lead.referralMode ?? "NAME") === "LEAD_CODE";
    const code = String(lead.referralCode ?? "").trim();
    if (!wantLookup || code.length < 5) return; // skip short/empty input
    // Debounce network calls a bit
    const t = window.setTimeout(async () => {
      try {
        const { data } = await findLeadByCode({ variables: { args: { page: 1, pageSize: 1, archived: false, status: null, search: code } } });
        const hit = data?.leads?.items?.find?.((x: any) => String(x?.leadCode ?? "").trim().toUpperCase() === code.toUpperCase());
        if (hit && (hit.name || hit.firstName)) {
          setLead((s: any) => (s.referralName?.trim() ? s : { ...s, referralName: (hit.name ?? `${hit.firstName ?? ""} ${hit.lastName ?? ""}`).trim() }));
        }
      } catch {
        // ignore lookup failures
      }
    }, 400);
    return () => window.clearTimeout(t);
  }, [lead.leadSource, lead.referralMode, lead.referralCode, findLeadByCode, setLead]);

  return (
    <div>
      <PageMeta title="Lead Entry | IPKwealth" description="Create a new lead" />
      <PageBreadcrumb pageTitle="Lead Entry" />

      <div className="mb-6 flex items-center justify-end">
        <BulkRegistrationButton onClick={() => setBulkOpen(true)} />
      </div>

      {formError && (
        <div ref={alertRef} className="mb-4">
          <Alert variant="error" title="Validation Error" message={formError} showLink={false} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-[#0B1220]">
          <CreateLeadForm
            lead={lead}
            setLead={setLead}
            phoneOk={phoneOk}
            isReferral={isReferral}
            canAssignRm={isAdmin}
            rmOptions={rmOptions}
            rmLoading={rmsLoading}
          />
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-[#0B1220]">
          <AdditionalInsightsForm lead={lead} setLead={setLead} isCompanyRequired={isCompanyRequired} />
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm dark:bg-[#0B1220]">
        <RemarkIcon className="h-4 w-4" />
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Remark</label>
        <textarea
          rows={4}
          value={lead.remark}
          onChange={(e) => setLead({ ...lead, remark: e.target.value })}
          placeholder="Add any relevant notes or context…"
          className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-gray-700 outline-none placeholder:text-gray-400 focus:border-blue-500 focus:ring-0 dark:border-white/10 dark:bg-white/5 dark:text-gray-200"
        />
      </div>

      <div className="mt-6 flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:justify-end">
        <Button onClick={handleSave} className="rounded-md bg-blue-600 px-6 py-2.5 text-white hover:bg-blue-700" disabled={submitting}>
          {submitting ? "Saving..." : "Save"}
        </Button>
      </div>

      <ConfirmLeadModal isOpen={isOpen} onClose={closeModal} lead={lead} onConfirm={handleConfirmSave} />

      {/* Upload flow modal (shows choose/drag-drop) */}
      <BulkImportModal
        isOpen={bulkOpen}
        onClose={() => setBulkOpen(false)}
        onImported={() => {}}
        /* IMPORTANT: do NOT pass rowsFromForm here, so the drop box & mapping show */
      />
    </div>
  );
}
