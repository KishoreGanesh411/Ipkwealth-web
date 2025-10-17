import ComponentCard from "@/components/common/ComponentCard";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";
import ViewLead from "@/components/sales/view_lead/ViewLead";
export default function ViewLeadPage() {
  return (
    <>
      <PageMeta title="Lead profile" description="Review and update this lead" />
      <PageBreadCrumb pageTitle="Lead Profile" items={[{ label: "Lead Profiles", href: "/sales/leads/recent" }]} />
      <ComponentCard title="See the Lead entire profile">
        <ViewLead />
      </ComponentCard>
    </>
  );
}
