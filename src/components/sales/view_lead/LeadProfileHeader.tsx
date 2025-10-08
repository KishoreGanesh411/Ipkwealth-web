import { CheckCircle2 } from "lucide-react";
import LeadStatusBadge from "@/components/sales/myleads/LeadStatusBadge";
import LeadMetaCard from "./LeadMetaCard";
import { initials } from "./utils";
import type { LeadProfile } from "./types";
import type { LeadStage } from "@/components/sales/myleads/interface/type";

type Props = {
  lead: LeadProfile;
  stageMeta: (typeof import("@/components/sales/myleads/stageMeta").STAGE_META)[LeadStage] | null;
  loading: boolean;
  isAdmin: boolean;
  canEditProfile: boolean;
  onEditField?: (field: any) => void;
};

export default function LeadProfileHeader({
  lead,
  stageMeta,
  loading,
  isAdmin,
  canEditProfile,
  onEditField,
}: Props) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.02]">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-emerald-500/10 text-xl font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200">
            {initials(lead.name)}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{lead.name}</h1>
              <LeadStatusBadge status={lead.status} size="md" />
              {stageMeta && (
                <span
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${stageMeta.pillClass}`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {stageMeta.label}
                </span>
              )}
            </div>

            <LeadMetaCard
              lead={lead}
              loading={loading}
              isAdmin={isAdmin}
              canEdit={canEditProfile}
              onEditField={onEditField}
            />
          </div>
        </div>

        {lead.leadCode && (
          <div className="rounded-xl border border-dashed border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 shadow-sm dark:border-emerald-400/40 dark:bg-emerald-500/10 dark:text-emerald-100">
            Lead code: {lead.leadCode}
          </div>
        )}
      </div>

      {lead.remark && (
        <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50/70 p-4 text-sm text-gray-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/70">
          <span className="font-semibold text-gray-900 dark:text-white">Latest remark:</span> {lead.remark}
        </div>
      )}
    </div>
  );
}
