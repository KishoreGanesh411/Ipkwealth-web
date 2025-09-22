import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";
import ViewLead from "@/components/sales/viewlwads/ViewLead";

export default function ViewLeadPage() {
  return (
    <>
      <PageMeta title="View Lead" description="Lead details & RM event" />
      <PageBreadcrumb pageTitle="Assigned Leads" />
      <ComponentCard title="Lead">
        <ViewLead />
      </ComponentCard>
    </>
  );
}
