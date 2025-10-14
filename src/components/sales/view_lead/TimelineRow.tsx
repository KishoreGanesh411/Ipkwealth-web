import {
  CalendarClock,
  NotebookPen,
  PhoneCall,
  UserCircle2,
  MessageSquare,
  CheckCircle2,
  UserRoundCheck,
  UserRound,
} from "lucide-react";
import { STAGE_META } from "@/components/sales/myleads/stageMeta";
import { formatEventTimestamp, humanize } from "./interface/utils";
import type { TimelineEvent } from "./interface/types";

type Props = { event: TimelineEvent };

export default function TimelineRow({ event }: Props) {
  const Icon = iconFor(event.type);
  return (
    <div className="timeline-row">
      <div className="mt-1">
        <div className="timeline-icon">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </div>
      </div>

      <div className="flex-1">
        <div className="timeline-meta">
          <span className="font-medium text-gray-600 dark:text-white/70">
            {humanize(event.type)}
          </span>
          <span aria-hidden="true">â€¢</span>
          <span>{formatEventTimestamp(event.occurredAt)}</span>
          {event.authorName && (
            <>
              <span aria-hidden="true">â€¢</span>
              <span>{event.authorName}</span>
            </>
          )}
        </div>

        <div className="mt-1 text-sm text-gray-800 dark:text-white/80">
          {renderSummary(event)}
        </div>

        {event.note && (
          <div className="mt-2 rounded-lg border border-gray-100 bg-gray-50/70 p-3 text-sm text-gray-600 dark:border-white/10 dark:bg-white/[0.05] dark:text-white/70">
            {event.note}
          </div>
        )}

        {event.followUpOn && (
          <div className="timeline-next">
            <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
            Follow-up {formatEventTimestamp(event.followUpOn)}
          </div>
        )}
      </div>
    </div>
  );
}

function iconFor(type?: string) {
  switch (type) {
    case "NOTE":
      return NotebookPen;
    case "CALL":
      return PhoneCall;
    case "MEETING":
      return UserCircle2;
    case "WHATSAPP":
    case "INTERACTION":
      return MessageSquare;
    case "STATUS_CHANGE":
      return CheckCircle2;
    case "STAGE_CHANGE":
      return UserRoundCheck;
    case "ASSIGNMENT":
      return UserRound;
    default:
      return NotebookPen;
  }
}

function renderSummary(ev: TimelineEvent) {
  if (ev.type === "STATUS_CHANGE" && ev.prev && ev.next) {
    return `Status changed from ${humanize(ev.prev.status)} to ${humanize(ev.next.status)}`;
  }
  if (ev.type === "STAGE_CHANGE" && ev.prev && ev.next) {
    const prevLabel = STAGE_META[ev.prev.stage ?? ""]?.label ?? humanize(ev.prev.stage);
    const nextLabel = STAGE_META[ev.next.stage ?? ""]?.label ?? humanize(ev.next.stage);
    return `Stage moved from ${prevLabel} to ${nextLabel}`;
  }
  if (ev.summary) return ev.summary;
  switch (ev.type) {
    case "NOTE":
      return "Note added";
    case "CALL":
      return "Call logged";
    case "MEETING":
      return "Meeting recorded";
    case "WHATSAPP":
      return "WhatsApp follow-up";
    case "INTERACTION":
      return "Interaction captured";
    case "ASSIGNMENT":
      return "Lead assigned";
    default:
      return humanize(ev.type);
  }
}
