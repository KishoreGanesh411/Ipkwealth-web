import Badge from "@/components/ui/badge/Badge";
import { humanize } from "@/utils/formatters";
import type { LeadStatus } from "./interface/type";

type Props = {
  status?: string | LeadStatus | null;
  size?: "sm" | "md";
};

export default function LeadStatusBadge({ status, size = "sm" }: Props) {
  const s = String(status || "PENDING").toUpperCase();

  const color: React.ComponentProps<typeof Badge>["color"] =
    s === "PENDING"
      ? "warning"
      : s === "ACTIVE" || s === "OPEN" || s === "WON" || s === "COMPLETE" || s === "COMPLETED" || s === "IN_PROGRESS"
      ? "success"
      : s === "CANCEL" || s === "CANCELLED" || s === "LOST"
      ? "error"
      : s === "ON_HOLD"
      ? "info"
      : "secondary";

  return (
    <Badge size={size} color={color}>
      {humanize(s)}
    </Badge>
  );
}
