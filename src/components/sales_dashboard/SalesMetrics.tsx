import { ArrowDownIcon, ArrowUpIcon, BoxIconLine, DollarLineIcon, GroupIcon, ShootingStarIcon } from "../../icons";
import Badge from "../ui/badge/Badge";
import { useQuery } from "@apollo/client";
import { MY_ASSIGNED_LEAD_SUMMARY } from "@/core/graphql/lead/lead.gql";

const CARD_BASE = "rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03] md:p-6";

export default function SalesMetrics() {
  const { data, loading, error, refetch } = useQuery(MY_ASSIGNED_LEAD_SUMMARY, {
    fetchPolicy: "cache-and-network",
  });

  const summary = data?.myAssignedLeadSummary;

  const cards = [
    {
      label: "Total Assigned",
      value: summary?.totalAssigned ?? 0,
      helper: `${summary?.hotLeads ?? 0} hot leads`,
      icon: GroupIcon,
      badge: (
        <Badge color="primary" size="sm">
          <ShootingStarIcon />
          {summary?.closed ?? 0} closed
        </Badge>
      ),
    },
    {
      label: "New Today",
      value: summary?.newToday ?? 0,
      helper: `${summary?.followUpsDueToday ?? 0} follow-ups due`,
      icon: BoxIconLine,
      badge: (
        <Badge color={summary && summary.newToday > 0 ? "success" : "secondary"} size="sm">
          <ArrowUpIcon />
          {summary?.followUpsOverdue ?? 0} overdue
        </Badge>
      ),
    },
    {
      label: "Active Pipeline",
      value: (summary?.inProgress ?? 0) + (summary?.hotLeads ?? 0),
      helper: `${summary?.inProgress ?? 0} in follow-up`,
      icon: DollarLineIcon,
      badge: (
        <Badge color="info" size="sm">
          <ArrowUpIcon />
          {summary?.hotLeads ?? 0} hot
        </Badge>
      ),
    },
    {
      label: "Dormant",
      value: summary?.dormant ?? 0,
      helper: `${summary?.closed ?? 0} closed total`,
      icon: ShootingStarIcon,
      badge: (
        <Badge color="warning" size="sm">
          <ArrowDownIcon />
          Tap to revive
        </Badge>
      ),
    },
  ];

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-100">
        <div className="font-semibold">Lead summary unavailable.</div>
        <div className="mt-1 text-xs opacity-80">{error.message}</div>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-3 inline-flex items-center gap-2 rounded-lg bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div key={card.label} className={`${CARD_BASE} ${loading ? "animate-pulse" : ""}`}>
            <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-gray-100 dark:bg-gray-800">
              <Icon className="size-6 text-gray-800 dark:text-white/90" />
            </div>
            <div className="mt-5 flex items-end justify-between">
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">{card.label}</span>
                <h4 className="mt-2 text-title-sm font-bold text-gray-800 dark:text-white/90">
                  {loading ? placeholders[index % placeholders.length] : card.value}
                </h4>
                <p className="mt-1 text-xs text-gray-400 dark:text-white/50">{card.helper}</p>
              </div>
              {card.badge}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const placeholders = ["--", "..", "...", "--"];
