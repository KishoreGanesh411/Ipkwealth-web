import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";
import LeadDataTable from "@/components/lead/LeadData/LeadDataTable";

export default function LeadTable() {
  return (
    <>
      <PageMeta title="IPK Marketing Dashboard" description="IPK | Marketing Dashboard" />
      <PageBreadcrumb pageTitle="Lead Data" />
      <div className="space-y-6">
        <ComponentCard title="Recent Leads">
          <LeadDataTable />
        </ComponentCard>
      </div>
    </>
  );
}
