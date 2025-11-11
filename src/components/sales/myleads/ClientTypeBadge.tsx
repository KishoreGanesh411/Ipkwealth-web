import Badge from "@/components/ui/badge/Badge"
import { humanize } from "@/utils/formatters";

type Props = {
  type?: string | null;
  size?: "sm" | "md";
};

export default function ClientTypeBadge({ type, size = "sm" }: Props) {
  const t = String(type || "");
  const key = t.toLowerCase();

  const color: React.ComponentProps<typeof Badge>["color"] =
    key === "enquiry"
      ? "warning"
      : key === "important"
      ? "primary"
      : key === "interested"
      ? "info"
      : "light";

  return (
    <Badge size={size} color={color}>
      {t ? humanize(t) : "-"}
    </Badge>
  );
}

