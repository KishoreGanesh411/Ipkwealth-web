import Badge from "@/components/ui/badge/Badge";
import { humanize } from "@/utils/formatters";
import type { LeadStatus } from "./interface/type";

type Props = {
  status?: string | LeadStatus | null;
  size?: "sm" | "md";
};

export default function LeadStatusBadge({ status, size = "sm" }: Props) {
  const s = String(status || "PENDING").toUpperCase();

  // Support classic LeadStatus plus the new StageFilter values
  const color: React.ComponentProps<typeof Badge>["color"] = (() => {
    if (s === "PENDING") return "warning";
    if (["ACTIVE", "OPEN", "WON", "COMPLETE", "COMPLETED", "IN_PROGRESS", "ON_PROCESS"].includes(s)) return "success";
    if (["CANCEL", "CANCELLED", "LOST", "NOT_ELIGIBLE", "NOT_INTERESTED"].includes(s)) return "error";
    if (["ON_HOLD", "FUTURE_INTERESTED", "NEED_CLARIFICATION"].includes(s)) return "info";
    if (["HIGH_PRIORITY"].includes(s)) return "warning";
    return "secondary";
  })();

  return (
    <Badge size={size} color={color}>
      {humanize(s)}
    </Badge>
  );
}
