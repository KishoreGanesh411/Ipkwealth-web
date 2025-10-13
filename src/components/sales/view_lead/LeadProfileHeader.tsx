import {
  Briefcase,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Mail,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  RefreshCcw,
  PencilLine,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";

import LeadStatusBadge from "@/components/sales/myleads/LeadStatusBadge";
import {
  initials,
  resolveStageDisplay,
  formatDateDisplay,
  formatAgingDays,
} from "./interface/utils";
import type { LeadProfile } from "./interface/types";

type Props = {
  lead: LeadProfile;
  loading: boolean;
  isAdmin: boolean;
  canEditProfile: boolean;
};

export default function LeadProfileHeader({ lead, loading }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: lead?.name || "",
    profession: lead?.profession || "",
    product: lead?.product || "",
    gender: lead?.gender || "",
  });

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-gray-400 dark:text-white/40">
        Loading lead profile...
      </div>
    );
  }

  const displayStatus = lead.status === "ASSIGNED" ? "PENDING" : lead.status;
  const stageDisplay = resolveStageDisplay({
    rawStage: lead.clientStageRaw,
    normalizedStage: (lead.clientStage as any) ?? undefined,
    status: displayStatus as string,
  });

  const stageHintClass =
    stageDisplay.state === "pending"
      ? "text-amber-600 dark:text-amber-200"
      : stageDisplay.state === "revisit"
      ? "text-rose-600 dark:text-rose-200"
      : "text-gray-500 dark:text-white/60";

  const StageIcon =
    stageDisplay.state === "pending"
      ? Clock3
      : stageDisplay.state === "revisit"
      ? RefreshCcw
      : CheckCircle2;

  const quickChips = (
    [
      lead.email && {
        key: "email",
        icon: Mail,
        label: lead.email,
        href: `mailto:${lead.email}`,
      },
      (lead.mobile ?? lead.phone) && {
        key: "phone",
        icon: Phone,
        label: lead.mobile ?? lead.phone!,
        href: `tel:${(lead.mobile ?? lead.phone)!.replace(/\s+/g, "")}`,
      },
      lead.phones?.find((p) => p.isWhatsapp) && {
        key: "whatsapp",
        icon: MessageCircle,
        label: lead.phones.find((p) => p.isWhatsapp)?.number ?? "",
        href: `https://wa.me/${lead.phones
          .find((p) => p.isWhatsapp)
          ?.number?.replace(/\D/g, "")}`,
      },
    ].filter(Boolean) as Array<{ key: string; icon: LucideIcon; label: string; href?: string }>
  );

  const leadSummary = [
    { label: "Lead source", value: lead.leadSource?.trim() || "Not captured" },
    { label: "Entered on", value: formatDateDisplay(lead.enteredAt) },
    { label: "Aging", value: formatAgingDays(lead.agingDays) },
  ];

  const handleEditClick = () => {
    setEditForm({
      name: lead.name ?? "",
      profession: lead.profession ?? "",
      product: lead.product ?? "",
      gender: lead.gender ?? "",
    });
    setIsEditing(true);
  };

  const handleEditChange = (field: string, value: string) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditSave = () => {
    // Here you would call a mutation to update the lead details.
    // For example: updateLeadDetails mutation with variables {id: lead.id, ...editForm}
    // After success:
    setIsEditing(false);
  };

  return (
    <>
      {/* Main card */}
      <div className="relative rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.02]">
        {/* Edit icon */}
        <button
          className="absolute right-4 top-4 rounded-full p-2 hover:bg-gray-100 dark:hover:bg-white/[0.08]"
          onClick={handleEditClick}
          title="Edit lead details"
        >
          <PencilLine className="h-4 w-4 text-gray-500 dark:text-gray-300" />
        </button>

        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-emerald-500/10 text-lg font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200">
              {initials(lead.name)}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-xl font-semibold capitalize text-gray-900 dark:text-white">
                  {lead.name ?? "Unnamed lead"}
                </h1>
                <LeadStatusBadge status={displayStatus} size="md" />
                <span
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${stageDisplay.pillClass}`}
                >
                  <StageIcon className="h-3.5 w-3.5" />
                  {stageDisplay.label}
                </span>
              </div>

              {stageDisplay.hint && (
                <p className={`mt-1 text-xs font-medium ${stageHintClass}`}>
                  {stageDisplay.hint}
                </p>
              )}

              {quickChips.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {quickChips.map(({ key, icon: Icon, label, href }) =>
                    href ? (
                      <a
                        key={key}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-sm font-semibold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100 dark:border-emerald-400/40 dark:bg-emerald-500/10 dark:text-emerald-100"
                      >
                        <Icon className="h-4 w-4" />
                        <span>{label}</span>
                      </a>
                    ) : (
                      <span
                        key={key}
                        className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-4 py-1.5 text-sm font-semibold text-gray-600 dark:border-white/10 dark:bg-white/[0.06] dark:text-white/70"
                      >
                        <Icon className="h-4 w-4" />
                        <span>{label}</span>
                      </span>
                    )
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="w-full max-w-sm rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 text-sm text-emerald-800 dark:border-emerald-400/40 dark:bg-emerald-500/10 dark:text-emerald-100 md:text-right">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] uppercase tracking-wide text-emerald-600/80 dark:text-emerald-200/80">
                Lead code
              </span>
              <span
                className={`text-base font-semibold ${
                  lead.leadCode
                    ? "text-emerald-700 dark:text-emerald-50"
                    : "text-emerald-400 dark:text-emerald-200/70"
                }`}
              >
                {lead.leadCode ?? "Not generated"}
              </span>
            </div>

            <div className="mt-3 grid gap-3 text-left sm:grid-cols-3 md:text-right">
              {leadSummary.map(({ label, value }) => (
                <div key={label} className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase tracking-wide text-emerald-500/70 dark:text-emerald-200/70">
                    {label}
                  </span>
                  <span className="text-sm font-semibold text-emerald-900 dark:text-emerald-50">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
          <MetaField
            icon={Briefcase}
            label="Occupation"
            value={lead.profession ?? lead.designation ?? "Not captured"}
          />
          <MetaField
            icon={CircleDollarSign}
            label="Investment range"
            value={lead.investmentRange ?? "Not captured"}
          />
          <MetaField
            icon={MapPin}
            label="Location"
            value={lead.location ?? "Unknown"}
          />
          <MetaField
            icon={Package}
            label="Product"
            value={lead.product ?? "Not specified"}
          />
        </div>

        {lead.remark && (
          <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50/60 p-4 text-sm text-gray-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/70">
            <span className="font-semibold text-gray-900 dark:text-white">
              Latest remark:
            </span>{" "}
            {lead.remark}
          </div>
        )}
      </div>

      {/* Edit modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-lg dark:border-white/10 dark:bg-gray-900">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Edit Lead Details
              </h2>
              <button
                className="p-1 rounded-full text-gray-600 hover:bg-gray-200 dark:text-white dark:hover:bg-white/[0.1]"
                onClick={() => setIsEditing(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              {/* Lead code (read-only) */}
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                  Lead code
                </label>
                <div className="mt-1 rounded-md border border-gray-200 bg-gray-50 p-2 dark:border-white/10 dark:bg-gray-800">
                  {lead.leadCode ?? "Not generated"}
                </div>
              </div>
              {/* Lead source (read-only) */}
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                  Lead source
                </label>
                <div className="mt-1 rounded-md border border-gray-200 bg-gray-50 p-2 dark:border-white/10 dark:bg-gray-800">
                  {lead.leadSource ?? "Not captured"}
                </div>
              </div>

              {/* Name */}
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                  Name
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) =>
                    handleEditChange("name", e.target.value)
                  }
                  className="mt-1 w-full rounded-md border border-gray-200 bg-white p-2 text-gray-900 dark:border-white/10 dark:bg-gray-800 dark:text-white"
                />
              </div>

              {/* Occupation */}
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                  Occupation
                </label>
                <input
                  type="text"
                  value={editForm.profession}
                  onChange={(e) =>
                    handleEditChange("profession", e.target.value)
                  }
                  className="mt-1 w-full rounded-md border border-gray-200 bg-white p-2 text-gray-900 dark:border-white/10 dark:bg-gray-800 dark:text-white"
                />
              </div>

              {/* Product */}
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                  Product
                </label>
                <input
                  type="text"
                  value={editForm.product}
                  onChange={(e) =>
                    handleEditChange("product", e.target.value)
                  }
                  className="mt-1 w-full rounded-md border border-gray-200 bg-white p-2 text-gray-900 dark:border-white/10 dark:bg-gray-800 dark:text-white"
                />
              </div>

              {/* Gender */}
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                  Gender
                </label>
                <select
                  value={editForm.gender}
                  onChange={(e) =>
                    handleEditChange("gender", e.target.value)
                  }
                  className="mt-1 w-full rounded-md border border-gray-200 bg-white p-2 text-gray-900 dark:border-white/10 dark:bg-gray-800 dark:text-white"
                >
                  <option value="">Select gender</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                className="inline-flex items-center rounded-md bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </button>
              <button
                className="inline-flex items-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                onClick={handleEditSave}
              >
                Confirm & Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function MetaField({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-gray-100 bg-gray-50/60 p-3 text-sm dark:border-white/10 dark:bg-white/[0.03]">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-gray-500 dark:text-white/50">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <div className="mt-1 truncate font-semibold text-gray-900 dark:text-white">
        {value}
      </div>
    </div>
  );
}
