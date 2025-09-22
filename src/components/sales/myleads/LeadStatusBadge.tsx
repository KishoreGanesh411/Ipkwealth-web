import Badge from "../ui/badge/Badge";
import { humanize } from "@/utils/formatters";

type Props = {
  status?: string | null;
  size?: "sm" | "md";
};

export default function LeadStatusBadge({ status, size = "sm" }: Props) {
  const s = String(status || "PENDING").toUpperCase();

  const color: React.ComponentProps<typeof Badge>["color"] =
    s === "PENDING"
      ? "warning"
      : s === "ACTIVE" || s === "WON" || s === "COMPLETE" || s === "COMPLETED"
      ? "success"
      : s === "CANCEL" || s === "CANCELLED" || s === "LOST"
      ? "error"
      : "info";

  return (
    <Badge size={size} color={color}>
      {humanize(s)}
    </Badge>
  );
}

