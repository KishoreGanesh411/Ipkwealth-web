import type { ComponentType, SVGProps } from "react";
import { ArrowDownIcon, ArrowUpIcon, DollarLineIcon, GroupIcon, ShootingStarIcon } from "@/icons";
import Badge from "@/components/ui/badge/Badge";

type Trend = "up" | "down";

type CardItem = {
  id: string;
  label: string;
  value: string;
  delta: string;
  helper: string;
  trend: Trend;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
};

const cards: CardItem[] = [
  {
    id: "active-deal",
    label: "Active Deal",
    value: "$120,369",
    delta: "+20%",
    helper: "last month",
    trend: "up",
    Icon: GroupIcon,
  },
  {
    id: "revenue-total",
    label: "Revenue Total",
    value: "$234,210",
    delta: "+9.0%",
    helper: "last month",
    trend: "up",
    Icon: DollarLineIcon,
  },
  {
    id: "closed-deals",
    label: "Closed Deals",
    value: "874",
    delta: "-4.5%",
    helper: "last month",
    trend: "down",
    Icon: ShootingStarIcon,
  },
];

const trendBadge: Record<Trend, { color: "success" | "error"; Icon: ComponentType<SVGProps<SVGSVGElement>> }> = {
  up: { color: "success", Icon: ArrowUpIcon },
  down: { color: "error", Icon: ArrowDownIcon },
};

export default function AdminMetrics() {
  return (
    <div className="grid grid-cols-1 gap-4 md:gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map(({ id, label, value, delta, helper, trend, Icon }) => {
        const ToneIcon = trendBadge[trend].Icon;
        const toneColor = trendBadge[trend].color;

        return (
          <div
            key={id}
            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-gray-800 dark:bg-white/5 md:p-6"
          >
            <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
              <Icon className="text-gray-800 size-6 dark:text-white/90" />
            </div>
            <div className="flex items-end justify-between mt-5">
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
                <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">{value}</h4>
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{helper}</p>
              </div>
              <Badge color={toneColor}>
                <ToneIcon />
                {delta}
              </Badge>
            </div>
          </div>
        );
      })}
    </div>
  );
}
