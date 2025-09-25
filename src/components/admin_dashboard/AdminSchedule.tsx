import { useState } from "react";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";
import { MoreDotIcon } from "@/icons";

type ScheduleItem = {
  id: string;
  title: string;
  subtitle: string;
  time: string;
};

const items: ScheduleItem[] = [
  {
    id: "Wed, 11 Jan",
    title: "Business Analytics Press",
    subtitle: "Exploring the future of data-driven decisions",
    time: "09:20 AM",
  },
  {
    id: "Fri, 15 Feb",
    title: "Business Sprint",
    subtitle: "Techniques from business sprint +2 more",
    time: "10:35 AM",
  },
  {
    id: "Thu, 18 Mar",
    title: "Customer Review Meeting",
    subtitle: "Insights from customer review meeting +8 more",
    time: "01:15 AM",
  },
];

export default function AdminSchedule() {
  const [open, setOpen] = useState(false);
  const toggle = () => setOpen((prev) => !prev);
  const close = () => setOpen(false);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Upcoming Schedule</h3>
          <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">Stay on top of your next engagements</p>
        </div>
        <div className="relative inline-block">
          <button className="dropdown-toggle" onClick={toggle}>
            <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 size-6" />
          </button>
          <Dropdown isOpen={open} onClose={close} className="w-40 p-2">
            <DropdownItem onItemClick={close} className="flex w-full text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300">Add reminder</DropdownItem>
            <DropdownItem onItemClick={close} className="flex w-full text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300">View calendar</DropdownItem>
          </Dropdown>
        </div>
      </div>

      <ul className="mt-5 space-y-4">
        {items.map((item) => (
          <li key={item.id} className="flex flex-col gap-1 p-4 transition rounded-xl bg-gray-50 hover:bg-gray-100 dark:bg-white/5 dark:hover:bg-white/10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">{item.id}</span>
              <span className="text-xs font-semibold text-brand-500 dark:text-brand-400">{item.time}</span>
            </div>
            <p className="text-sm font-semibold text-gray-800 dark:text-white/90">{item.title}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{item.subtitle}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
