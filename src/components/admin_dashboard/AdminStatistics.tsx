import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import ChartTab from "@/components/common/ChartTab";
import Badge from "@/components/ui/badge/Badge";
import { ArrowDownIcon, ArrowUpIcon } from "@/icons";

const options: ApexOptions = {
  legend: { show: false },
  colors: ["#465FFF", "#9CB9FF"],
  chart: {
    fontFamily: "Outfit, sans-serif",
    height: 310,
    type: "area",
    toolbar: { show: false },
  },
  stroke: { curve: "smooth", width: [2, 2] },
  fill: {
    type: "gradient",
    gradient: { opacityFrom: 0.55, opacityTo: 0, stops: [0, 80, 100] },
  },
  markers: { size: 0, strokeColors: "#fff", strokeWidth: 2, hover: { size: 6 } },
  grid: { xaxis: { lines: { show: false } }, yaxis: { lines: { show: true } } },
  dataLabels: { enabled: false },
  tooltip: { enabled: true },
  xaxis: {
    type: "category",
    categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    axisBorder: { show: false },
    axisTicks: { show: false },
    tooltip: { enabled: false },
  },
  yaxis: {
    labels: { style: { fontSize: "12px", colors: ["#6B7280"] } },
    title: { text: "", style: { fontSize: "0px" } },
  },
};

const series = [
  {
    name: "Marketing",
    data: [120, 135, 150, 155, 165, 170, 172, 180, 190, 210, 225, 240],
  },
  {
    name: "Sales",
    data: [80, 76, 90, 95, 100, 110, 120, 132, 145, 150, 165, 182],
  },
];

export default function AdminStatistics() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/5 sm:px-6 sm:pt-6">
      <div className="flex flex-col gap-5 mb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="w-full">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Statistics</h3>
          <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">Target you have set for each month</p>

          <div className="flex flex-wrap gap-6 mt-4">
            <div>
              <p className="text-2xl font-semibold text-gray-800 dark:text-white/90">$212,142.12</p>
              <div className="flex items-center gap-2 text-gray-500 text-theme-sm dark:text-gray-400">
                <span>Avg. yearly profit</span>
                <Badge color="success" size="sm">
                  <ArrowUpIcon />
                  23.2%
                </Badge>
              </div>
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-800 dark:text-white/90">$30,321.23</p>
              <div className="flex items-center gap-2 text-gray-500 text-theme-sm dark:text-gray-400">
                <span>Revenue change</span>
                <Badge color="error" size="sm">
                  <ArrowDownIcon />
                  12.3%
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-start w-full gap-3 sm:w-auto sm:justify-end">
          <ChartTab />
        </div>
      </div>

      <div className="max-w-full overflow-x-auto">
        <div className="min-w-[960px] xl:min-w-full">
          <Chart options={options} series={series} type="area" height={310} />
        </div>
      </div>
    </div>
  );
}
