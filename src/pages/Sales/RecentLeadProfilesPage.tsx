import { useNavigate } from "react-router-dom";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";
import { getRecentLeads } from "@/features/leads/profile/recentLeads";
import { useMemo } from "react";
import { ArrowLeft } from "lucide-react";

export default function RecentLeadProfilesPage() {
  const navigate = useNavigate();
  const list = useMemo(() => getRecentLeads(), []);

  return (
    <>
      <PageMeta title="Lead Profiles" description="Recently viewed lead profiles" />
      <div className="mb-2 flex items-center gap-3">
        <button
          onClick={() => navigate('/sales/stages')}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/[0.06]"
        >
          <ArrowLeft className="h-4 w-4" /> Back to stages
        </button>
      </div>
      <PageBreadcrumb pageTitle="Lead Profiles" />
      <div className="mb-4 flex items-center justify-between">
        <div className="relative w-full max-w-lg">
          <input
            placeholder="Search leads by name, phone, code…"
            className="h-10 w-full rounded-xl border border-gray-200 bg-transparent px-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-emerald-300 focus:outline-hidden focus:ring-3 focus:ring-emerald-200"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const v = (e.target as HTMLInputElement).value.trim();
                if (v) navigate(`/sales/assigned?q=${encodeURIComponent(v)}&page=1`);
              }
            }}
          />
        </div>
      </div>
      <ComponentCard title="Recently Viewed">
        <div className="custom-scrollbar overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Lead Code</th>
                <th className="px-6 py-3">Phone</th>
                <th className="px-6 py-3">Viewed</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {list.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                    No recent profiles yet. Open a lead to see it here.
                  </td>
                </tr>
              )}
              {list.map((l) => (
                <tr key={`${l.id}-${l.viewedAt}`} className="bg-white">
                  <td className="px-6 py-3 text-gray-800">{l.name || "—"}</td>
                  <td className="px-6 py-3 font-medium">{l.leadCode || "—"}</td>
                  <td className="px-6 py-3 text-gray-600">{l.phone || "—"}</td>
                  <td className="px-6 py-3 text-gray-500">{new Date(l.viewedAt).toLocaleString()}</td>
                  <td className="px-6 py-3 text-right">
                    <button
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50"
                      onClick={() => navigate(`/sales/leads/${l.id}`)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ComponentCard>
    </>
  );
}
