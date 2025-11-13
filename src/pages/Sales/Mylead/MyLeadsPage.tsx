import { useMemo, useState } from "react";
import { NetworkStatus, useQuery } from "@apollo/client";

import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";
import AssignedLeads from "@/components/sales/assigned/AssignedLeads";
import type { Lead } from "@/components/sales/myleads/interface/type";
import { LeadStage, LeadStatus } from "@/components/sales/myleads/interface/type";
import { STAGE_SEQUENCE } from "@/components/sales/myleads/stageMeta";
import { MY_ASSIGNED_LEADS, LEADS_PAGED } from "@/core/graphql/lead/lead.gql";
import { useAuth } from "@/context/AuthContex";

const DEFAULT_PAGE_SIZE = 10;

type MyAssignedLeadsData = {
  myAssignedLeads: {
    items: MyAssignedLeadNode[];
    page: number;
    pageSize: number;
    total: number;
  };
};

type MyAssignedLeadsVariables = {
  args: {
    page: number;
    pageSize: number;
    search?: string;
  };
};

type MyAssignedLeadNode = {
  id: string;
  leadCode?: string | null;
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  location?: string | null;
  city?: string | null;
  leadSource?: string | null;
  status?: string | null;
  stageFilter?: string | null;
  clientStage?: string | null;
  createdAt?: string | null;
  approachAt?: string | null;
  firstSeenAt?: string | null;
  assignedAt?: string | null;
  assignedRM?: string | null;
  lastContactedAt?: string | null;
  agingDays?: number | null;
  remark?: string | null;
};

export default function MyLeadsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const variables = useMemo<MyAssignedLeadsVariables>(() => {
    const args: MyAssignedLeadsVariables["args"] = {
      page,
      pageSize: DEFAULT_PAGE_SIZE,
    };
    const trimmed = search.trim();
    if (trimmed) {
      args.search = trimmed;
    }
    return { args };
  }, [page, search]);

  const { data, previousData, loading, networkStatus, error, refetch } = useQuery<any, MyAssignedLeadsVariables>(
    isAdmin ? LEADS_PAGED : MY_ASSIGNED_LEADS,
    {
      variables,
      fetchPolicy: "cache-and-network",
      notifyOnNetworkStatusChange: true,
    }
  );

  const pagePayload = (isAdmin ? (data?.leads ?? previousData?.leads) : (data?.myAssignedLeads ?? previousData?.myAssignedLeads));

  const leads = useMemo<Lead[]>(() => {
    if (!pagePayload?.items) return [];
    return pagePayload.items.map(normalizeLead);
  }, [pagePayload]);

  const total = pagePayload?.total ?? 0;
  const pageFromServer = pagePayload?.page ?? page;
  const pageSizeFromServer = pagePayload?.pageSize ?? DEFAULT_PAGE_SIZE;

  const isRefetching =
    networkStatus === NetworkStatus.refetch || networkStatus === NetworkStatus.setVariables;
  const isFetching = loading || isRefetching;

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleRefresh = () => {
    refetch(variables);
  };

  return (
    <>
      <PageMeta title={isAdmin ? "All Leads" : "Assigned Leads"} description={isAdmin ? "All leads (admin)" : "Leads assigned to you"} />
      <PageBreadcrumb pageTitle={isAdmin ? "All Leads" : "Assigned Leads"} />
      <ComponentCard title={isAdmin ? "IPK-wealth All Leads" : "IPK-wealth Assigned Leads"}>
        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-100">
            <p className="font-semibold">Unable to load leads.</p>
            <p className="mt-1 text-xs opacity-80">{error.message}</p>
          </div>
        ) : (
          <AssignedLeads
            rows={leads}
            pageSize={pageSizeFromServer}
            page={pageFromServer}
            totalCount={total}
            loading={isFetching}
            searchValue={search}
            onSearchChange={handleSearchChange}
            onRefresh={handleRefresh}
            onPageChange={handlePageChange}
          />
        )}
      </ComponentCard>
    </>
  );
}

function normalizeLead(node: MyAssignedLeadNode): Lead {
  const fallbackName = node.name ?? [node.firstName, node.lastName].filter(Boolean).join(" ").trim();
  const name = fallbackName && fallbackName.length > 0 ? fallbackName : "Unnamed lead";
  const mobile = node.mobile ?? node.phone ?? null;
  const location = node.location ?? node.city ?? null;
  const rawAging = node.agingDays ?? computeAgingDays(node.approachAt ?? node.createdAt);
  const agingDays =
    typeof rawAging === "number" && Number.isFinite(rawAging) ? Math.max(0, Math.floor(rawAging)) : undefined;

  const assignedAt = node.assignedAt ?? node.createdAt ?? null;
  const isNew = assignedAt ? isRecentAssignment(assignedAt) : false;

  const statusRaw = typeof node.status === "string" ? node.status : undefined;
  const stageFilterRaw = typeof node.stageFilter === "string" ? node.stageFilter : undefined;
  const clientStageRaw = typeof node.clientStage === "string" ? node.clientStage : undefined;

  const stageFromStatus = statusRaw && isLeadStage(statusRaw) ? (statusRaw as LeadStage) : undefined;
  const stageValue = (clientStageRaw && isLeadStage(clientStageRaw) ? clientStageRaw : undefined) ?? stageFromStatus;
  // Show Stage Filter only in the Status column; if absent, leave undefined (no "Pending")
  const statusValue = stageFilterRaw as any;

  return {
    id: node.id,
    leadCode: node.leadCode ?? null,
    name,
    email: node.email ?? null,
    mobile,
    location,
    agingDays,
    leadSource: node.leadSource ?? "-",
    status: statusValue,
    clientStage: stageValue,
    assignedAt,
    lastContactedAt: node.lastContactedAt ?? null,
    remark: node.remark ?? null,
    assignedRm: node.assignedRM ?? null,
    isNew,
  };
}

function computeAgingDays(fromDate?: string | null) {
  if (!fromDate) return undefined;
  const timestamp = Date.parse(fromDate);
  if (Number.isNaN(timestamp)) return undefined;
  const diffMs = Date.now() - timestamp;
  if (diffMs < 0) return 0;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function isRecentAssignment(assignedAt: string, thresholdHours = 24) {
  const timestamp = Date.parse(assignedAt);
  if (Number.isNaN(timestamp)) return false;
  const hours = (Date.now() - timestamp) / (1000 * 60 * 60);
  return hours >= 0 && hours <= thresholdHours;
}

function isLeadStage(value: string): value is LeadStage {
  return STAGE_SEQUENCE.includes(value as LeadStage);
}




