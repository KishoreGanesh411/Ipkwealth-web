import { ArrowDownIcon, ArrowUpIcon, BoxIconLine, DollarLineIcon, GroupIcon, ShootingStarIcon } from "../../icons";
import Badge from "../ui/badge/Badge";

export default function SalesMetrics() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 md:gap-6">
      {/* Active Lead */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Active Lead</span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">874</h4>
          </div>
          <Badge color="error">
            <ArrowDownIcon />
            4.5%
          </Badge>
        </div>
      </div>

      {/* Total Lead */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <BoxIconLine className="text-gray-800 size-6 dark:text-white/90" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Total Lead</span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">3,782</h4>
          </div>
          <Badge color="success">
            <ArrowUpIcon />
            11.0%
          </Badge>
        </div>
      </div>

      {/* Client Closed */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <DollarLineIcon className="text-gray-800 size-6 dark:text-white/90" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Client Closed</span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">234</h4>
          </div>
          <Badge color="success">
            <ArrowUpIcon />
            9.0%
          </Badge>
        </div>
      </div>
    </div>
  );
}
