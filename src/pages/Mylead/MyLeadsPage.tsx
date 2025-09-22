// src/pages/Tables/MyLeadsPage.tsx
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";
import MyLeads, { Lead } from "@/components/sales/myleads/MyLeads";

const demo: Lead[] = [
  { id: 1, leadCode: "IPK-2509-0001", name: "Ramya Priya", leadSource: "Referral", product: "SIP", profession: "Employee" },
  { id: 2, leadCode: "IPK-2509-0002", name: "Naveen", leadSource: "Website", product: "IAP", profession: "Business" },
];

export default function MyLeadsPage() {
  return (
    <>
      <PageMeta title="latest leads" description="RM assigned leads" />
      <PageBreadcrumb pageTitle="Assigned Leads" />
      <ComponentCard title="My Leads....">
        <MyLeads leads={demo} />
      </ComponentCard>
    </>
  );
}
