import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";
import MyLeads, { Lead } from "@/components/sales/myleads/MyLeads";

const demo: Lead[] = [
  {
    id: 1,
    leadCode: "IPK-2509-0001",
    name: "Ramya Priya",
    leadSource: "Referral",
    mobile: "+91 98765 43210",
    location: "Chennai",
    agingDays: 2,
    status: "FIRST_TALK_DONE",
    email: "ramya.priya@example.com",
  },
  {
    id: 2,
    leadCode: "IPK-2509-0002",
    name: "Naveen",
    leadSource: "Website",
    mobile: "+91 91234 56780",
    location: "Coimbatore",
    agingDays: 7,
    status: "FOLLOWING_UP",
    email: "naveen@example.com",
  },
  {
    id: 3,
    leadCode: "IPK-2509-0003",
    name: "Harini Rao",
    leadSource: "Walk-in",
    mobile: "+91 90001 22334",
    location: "Bengaluru",
    agingDays: 1,
    status: "CLIENT_INTERESTED",
    email: "harini.rao@example.com",
  },
  {
    id: 4,
    leadCode: "IPK-2509-0004",
    name: "Vikas Mehta",
    leadSource: "WhatsApp",
    mobile: "+91 99876 54321",
    location: "Mumbai",
    agingDays: 5,
    status: "ACCOUNT_OPENED",
    email: "vikas.mehta@example.com",
  },
  {
    id: 5,
    leadCode: "IPK-2509-0005",
    name: "Priya Shah",
    leadSource: "Email Campaign",
    mobile: "+91 97777 66655",
    location: "Pune",
    agingDays: 9,
    status: "NO_RESPONSE_DORMANT",
    email: "priya.shah@example.com",
  },
  {
    id: 6,
    leadCode: "IPK-2509-0006",
    name: "Gautham Iyer",
    leadSource: "Telecall",
    mobile: "+91 94444 22110",
    location: "Hyderabad",
    agingDays: 12,
    status: "NOT_INTERESTED_DORMANT",
    email: "gautham.iyer@example.com",
  },
  {
    id: 7,
    leadCode: "IPK-2509-0007",
    name: "Anjali Menon",
    leadSource: "Partner Referral",
    mobile: "+91 95555 88776",
    location: "Kochi",
    agingDays: 15,
    status: "RISKY_CLIENT_DORMANT",
    email: "anjali.menon@example.com",
  },
  {
    id: 8,
    leadCode: "IPK-2509-0008",
    name: "Suresh Kumar",
    leadSource: "Branch Visit",
    mobile: "+91 93333 44556",
    location: "Madurai",
    agingDays: 21,
    status: "HIBERNATED",
    email: "suresh.kumar@example.com",
  },
];

export default function MyLeadsPage() {
  return (
    <>
      <PageMeta title="Latest leads" description="RM assigned leads" />
      <PageBreadcrumb pageTitle="Assigned Leads" />
      <ComponentCard title="My Leads">
        <MyLeads leads={demo} pageSize={10} />
      </ComponentCard>
    </>
  );
}
