// src/pages/leadEntry.tsx
import { useMemo, useState, useRef, useEffect } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";
import Button from "@/components/ui/button/Button";
import BulkRegistrationButton from "@/components/lead/bulk-register/BulkRegistrationButton";
import BulkImportModal from "@/components/lead/bulk-register/BulkImportModal"; // ⬅ add
import { createLead } from "@/core/graphql/lead/lead";
import { toast } from "react-toastify";
import CreateLeadForm from "@/components/lead/Leadform/Leadform";
import AdditionalInsightsForm from "@/components/lead/Leadform/additional";
import { useModal } from "@/hooks/useModal";
import ConfirmLeadModal from "@/components/ui/lead/ConfirmLeadModal";
import { validateLead } from "@/components/ui/lead/Validators";
import Alert from "@/components/ui/alert/Alert";
import { RemarkIcon } from "@/icons";

export default function LeadEntry() {
  const [lead, setLead] = useState({
    firstName: "", lastName: "", email: "", phone: "", leadSource: "",
    referralName: "", gender: "", age: "" as number | "", profession: "",
    companyName: "", designation: "", location: "", product: "",
    investmentRange: "", sipAmount: "" as number | "", clientType: "", remark: "",
  });

  const [formError, setFormError] = useState<string | null>(null);
  const alertRef = useRef<HTMLDivElement | null>(null);

  const isCompanyRequired = lead.profession === "BUSINESS" || lead.profession === "EMPLOYEE";
  const isReferral = lead.leadSource === "referral";
  const phoneOk = useMemo(() => /^[0-9+\-\s()]{8,}$/.test(lead.phone.trim()), [lead.phone]);

  const { isOpen, openModal, closeModal } = useModal();
  const [submitting, setSubmitting] = useState(false);

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
      const payload = {
        firstName: lead.firstName || undefined,
        lastName: lead.lastName || undefined,
        email: lead.email || undefined,
        phone: lead.phone,
        leadSource: lead.leadSource,
        referralCode: lead.referralName || undefined,
        gender: lead.gender || undefined,
        age: lead.age ? Number(lead.age) : undefined,
        location: lead.location || undefined,
        profession: lead.profession || undefined,
        companyName: lead.companyName || undefined,
        designation: lead.designation || undefined,
        product: lead.product || undefined,
        investmentRange: lead.investmentRange || undefined,
        sipAmount: lead.sipAmount ? Number(lead.sipAmount) : undefined,
        clientTypes: lead.clientType || undefined,
        remark: lead.remark || undefined,
      };
      const created = await createLead(payload);
      toast.success(created?.leadCode ? `Lead created: ${created.leadCode}` : "Lead created");
      setLead({
        firstName: "", lastName: "", email: "", phone: "", leadSource: "",
        referralName: "", gender: "", age: "" as number | "", profession: "",
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
          <CreateLeadForm lead={lead} setLead={setLead} phoneOk={phoneOk} isReferral={isReferral} />
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
