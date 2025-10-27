import ComponentCard from "@/components/common/ComponentCard";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";
import ViewLead from "@/components/sales/view_lead/ViewLead";
export default function ViewLeadPage() {
  const navigate = useNavigate();
  return (
    <>
      <PageMeta title="Lead profile" description="Review and update this lead" />
      <div className="mb-2 flex items-center gap-3">
        <button
          onClick={() => navigate('/sales/stages')}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/[0.06]"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Lead Management
        </button>
      </div>
      <PageBreadCrumb pageTitle="Lead Profile" items={[{ label: "Lead Profiles", href: "/sales/leads/recent" }]} />
      <ComponentCard title="See the Lead entire profile">
        <ViewLead />
      </ComponentCard>
    </>
  );
}
