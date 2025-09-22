import { useState } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { MoreDotIcon } from "../../icons";

type Item = {
  id: string;
  title: string;
  person: string;
  time: string;
  note?: string;
};

const items: Item[] = [
  {
    id: "IPK25092006",
    title: "Follow-up call",
    person: "Kishoreganesh K",
    time: "Today 10:30 AM",
    note: "Call for query",
  },
  {
    id: "IPK25092007",
    title: "Docs collection",
    person: "Anita Sharma",
    time: "Today 02:00 PM",
  },
  {
    id: "IPK25092008",
    title: "KYC verification",
    person: "Rahul Chopra",
    time: "Tomorrow 11:15 AM",
  },
];

export default function UpcomingSchedule() {
  const [isOpen, setIsOpen] = useState(false);
  const toggleDropdown = () => setIsOpen(!isOpen);
  const closeDropdown = () => setIsOpen(false);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
      <div className="flex justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Upcoming Schedule</h3>
          <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">Next activities and follow-ups</p>
        </div>
        <div className="relative inline-block">
          <button className="dropdown-toggle" onClick={toggleDropdown}>
            <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 size-6" />
          </button>
          <Dropdown isOpen={isOpen} onClose={closeDropdown} className="w-40 p-2">
            <DropdownItem onItemClick={closeDropdown} className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300">View More</DropdownItem>
            <DropdownItem onItemClick={closeDropdown} className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300">Delete</DropdownItem>
          </Dropdown>
        </div>
      </div>

      <ul className="mt-4 divide-y divide-gray-100 dark:divide-gray-800">
        {items.map((it) => (
          <li key={it.id} className="flex items-start justify-between py-4">
            <div>
              <p className="font-medium text-gray-800 dark:text-white/90">{it.id} · {it.title}</p>
              <p className="text-gray-500 text-theme-sm dark:text-gray-400">
                {it.person} • {it.time}
                {it.note ? ` • ${it.note}` : ""}
              </p>
            </div>
            <span className="inline-flex px-2 py-1 text-xs font-medium rounded-md bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">New</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

