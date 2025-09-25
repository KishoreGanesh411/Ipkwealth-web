import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { useMemo } from "react";

const series = [48, 33, 19];

const options: ApexOptions = {
  chart: { type: "donut", fontFamily: "Outfit, sans-serif" },
  labels: ["Affiliate Program", "Direct Buy", "Adsense"],
  colors: ["#465FFF", "#9CB9FF", "#E0EAFF"],
  dataLabels: { enabled: false },
  legend: { show: false },
  plotOptions: {
    pie: {
      donut: {
        size: "72%",
        labels: {
          show: true,
          total: {
            show: true,
            label: "Total",
            formatter: () => "3.5K",
          },
        },
      },
    },
  },
};

const breakdown = [
  { id: "affiliate", label: "Affiliate Program", percent: 48, value: "2,040 Products", color: "#465FFF" },
  { id: "direct", label: "Direct Buy", percent: 33, value: "1,402 Products", color: "#9CB9FF" },
  { id: "adsense", label: "Adsense", percent: 19, value: "510 Products", color: "#E0EAFF" },
];

export default function AdminSalesCategory() {
  const total = useMemo(() => series.reduce((acc, curr) => acc + curr, 0), []);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/5 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Sales Category</h3>
          <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">Breakdown by campaign type</p>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">Total share {total}%</p>
      </div>

      <div className="flex flex-col items-center gap-8 mt-6 xl:flex-row xl:items-start xl:justify-between">
        <div className="w-full max-w-[320px]">
          <Chart options={options} series={series} type="donut" height={300} />
        </div>

        <ul className="w-full space-y-4">
          {breakdown.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span
                  className="inline-flex w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">{item.label}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{item.value}</p>
                </div>
              </div>
              <span className="text-sm font-semibold text-gray-800 dark:text-white/90">{item.percent}%</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
