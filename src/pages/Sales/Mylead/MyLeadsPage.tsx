import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";
import AssignedLeads from "@/components/sales/assigned/AssignedLeads";
import { SAMPLE_LEADS } from "@/components/sales/myleads/mockData";

export default function MyLeadsPage() {
  return (
    <>
      <PageMeta title="Assigned Leads" description="Leads assigned to you" />
      <PageBreadcrumb pageTitle="Assigned Leads" />
      <ComponentCard title="Assigned Leads">
        <AssignedLeads rows={SAMPLE_LEADS} pageSize={10} />
      </ComponentCard>
    </>
  );
}
