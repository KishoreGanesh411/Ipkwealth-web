import SalesMetrics from "../../components/sales_dashboard/SalesMetrics";
import MonthlySalesChart from "../../components/ecommerce/MonthlySalesChart";
import SalesStatistics from "../../components/sales_dashboard/SalesStatistics";
import EstimatedTarget from "../../components/sales_dashboard/EstimatedTarget";
import SalesCategory from "../../components/sales_dashboard/SalesCategory";
import UpcomingSchedule from "../../components/sales_dashboard/UpcomingSchedule";
import RecentClients from "../../components/sales_dashboard/RecentClients";
import PageMeta from "../../components/common/PageMeta";

export default function SalesRMDashboard() {
  return (
    <>
      <PageMeta title="IPK Sales RM Dashboard" description="IPKwealth | Sales RM Dashboard" />

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 xl:col-span-7 space-y-6">
          <SalesMetrics />
          <MonthlySalesChart />
        </div>

        <div className="col-span-12 xl:col-span-5">
          <EstimatedTarget />
        </div>

        <div className="col-span-12">
          <SalesStatistics />
        </div>

        <div className="col-span-12 xl:col-span-5">
          <SalesCategory />
        </div>

        <div className="col-span-12 xl:col-span-7">
          <UpcomingSchedule />
        </div>

        <div className="col-span-12">
          <RecentClients />
        </div>
      </div>
    </>
  );
}
