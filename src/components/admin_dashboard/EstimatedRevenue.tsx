import { useState } from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";
import { MoreDotIcon } from "@/icons";

const series = [85];

const options: ApexOptions = {
  chart: {
    type: "radialBar",
    sparkline: { enabled: true },
    fontFamily: "Outfit, sans-serif",
  },
  colors: ["#465FFF"],
  plotOptions: {
    radialBar: {
      startAngle: -120,
      endAngle: 120,
      hollow: { size: "70%" },
      track: { background: "#E4E7EC", margin: 5 },
      dataLabels: {
        name: { show: false },
        value: {
          formatter: () => "$90",
          fontSize: "28px",
          fontWeight: 600,
          color: "#1D2939",
        },
      },
    },
  },
  stroke: { lineCap: "round" },
};

const performance = [
  { id: "marketing", label: "Marketing", value: 85, amount: "$30,569.00", color: "#465FFF" },
  { id: "sales", label: "Sales", value: 55, amount: "$20,486.00", color: "#9CB9FF" },
];

export default function EstimatedRevenue() {
  const [open, setOpen] = useState(false);
  const toggleDropdown = () => setOpen((prev) => !prev);
  const closeDropdown = () => setOpen(false);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/5 sm:p-6">
      <div className="flex justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Estimated Revenue</h3>
          <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">Target you have set for each month</p>
        </div>
        <div className="relative inline-block">
          <button className="dropdown-toggle" onClick={toggleDropdown}>
            <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 size-6" />
          </button>
          <Dropdown isOpen={open} onClose={closeDropdown} className="w-40 p-2">
            <DropdownItem onItemClick={closeDropdown} className="flex w-full text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300">Download</DropdownItem>
            <DropdownItem onItemClick={closeDropdown} className="flex w-full text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300">Share</DropdownItem>
          </Dropdown>
        </div>
      </div>

      <div className="flex flex-col items-center mt-10">
        <div className="flex flex-col items-center justify-center">
          <div className="w-[220px] h-[220px]">
            <Chart options={options} series={series} type="radialBar" height={220} />
          </div>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">June Goals</p>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        {performance.map((item) => (
          <div key={item.id} className="space-y-2">
            <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
              <span>{item.label}</span>
              <span>{item.amount}</span>
            </div>
            <div className="h-2 overflow-hidden bg-gray-100 rounded-full dark:bg-white/10">
              <div
                className="h-full rounded-full"
                style={{ width: `${item.value}%`, backgroundColor: item.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
