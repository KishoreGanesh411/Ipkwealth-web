import { useEffect, useState } from "react";
import PageMeta from "@/components/common/PageMeta";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import RmLeadsDrawer from "@/components/sales/view_lead/RmLeadsDrawer";
import { useNavigate } from "react-router-dom";

export default function LeadProfileLanding() {
  const [drawerOpen, setDrawerOpen] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Auto-open on visit so RMs can pick a lead immediately
    setDrawerOpen(true);
  }, []);

  return (
    <>
      <PageMeta title="Lead profile" description="Pick a lead to view profile" />
      <PageBreadCrumb pageTitle="Lead Profile" items={[{ label: "Lead Profiles", href: "/sales/leads" }]} />
      <ComponentCard title="Pick a lead to view profile">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-white/70">
            Open the My Leads drawer and choose a lead to view their profile.
          </p>
          <button
            type="button"
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            onClick={() => setDrawerOpen(true)}
          >
            Open My Leads
          </button>
        </div>
      </ComponentCard>

      <RmLeadsDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onPick={(l) => {
          setDrawerOpen(false);
          if (l.id) navigate(`/sales/leads/${l.id}`, { state: { lead: l } });
        }}
      />
    </>
  );
}

