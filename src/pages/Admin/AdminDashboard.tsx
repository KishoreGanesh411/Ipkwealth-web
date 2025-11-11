import PageMeta from "@/components/common/PageMeta";
import AdminMetrics from "@/components/admin_dashboard/AdminMetrics";
import AdminStatistics from "@/components/admin_dashboard/AdminStatistics";
import EstimatedRevenue from "@/components/admin_dashboard/EstimatedRevenue";
import AdminSalesCategory from "@/components/admin_dashboard/AdminSalesCategory";
import AdminSchedule from "@/components/admin_dashboard/AdminSchedule";
import RecentDeals from "@/components/admin_dashboard/RecentDeals";

export default function AdminDashboard() {
  return (
    <>
      <PageMeta title="IPK Admin Dashboard" description="Executive overview for IPK Admins" />
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12">
          <AdminMetrics />
        </div>

        <div className="col-span-12 xl:col-span-7">
          <AdminStatistics />
        </div>

        <div className="col-span-12 xl:col-span-5">
          <EstimatedRevenue />
        </div>

        <div className="col-span-12 xl:col-span-5">
          <AdminSalesCategory />
        </div>

        <div className="col-span-12 xl:col-span-7">
          <AdminSchedule />
        </div>

        <div className="col-span-12">
          <RecentDeals />
        </div>
      </div>
    </>
  );
}
