import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";
import ViewLead from "@/components/sales/view-lead/ViewLead";

export default function ViewLeadPage() {
  return (
    <>
      <PageMeta title="Lead profile" description="Review and update this lead" />
      <PageBreadcrumb
        pageTitle="Lead Profile"
        items={[{ label: 'Assigned Leads', href: '/sales/assigned' }]}
      />
      <ComponentCard title="Lead Profile">
        <ViewLead />
      </ComponentCard>
    </>
  );
}
