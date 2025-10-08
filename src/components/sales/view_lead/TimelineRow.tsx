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
import { formatEventTimestamp, humanize } from "./utils";
import type { LeadStage } from "@/components/sales/myleads/interface/type";
import type { TimelineEvent } from "./types";

type Props = { event: TimelineEvent };

export default function TimelineRow({ event }: Props) {
  const Icon = iconFor(event.type);
  return (
    <div className="flex gap-3">
      <div className="mt-1">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-200">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </div>
      </div>

      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-400 dark:text-white/50">
          <span className="font-medium text-gray-600 dark:text-white/70">{humanize(event.type)}</span>
          <span aria-hidden="true">&bull;</span>
          <span>{formatEventTimestamp(event.occurredAt)}</span>
          {event.authorName && (
            <>
              <span aria-hidden="true">&bull;</span>
              <span>{event.authorName}</span>
            </>
          )}
        </div>

        <div className="mt-1 text-sm text-gray-800 dark:text-white/80">
          {renderEventSummary(event)}
        </div>

        {event.note && (
          <div className="mt-2 rounded-lg border border-gray-100 bg-gray-50/70 p-3 text-sm text-gray-600 dark:border-white/10 dark:bg-white/[0.05] dark:text-white/70">
            {event.note}
          </div>
        )}

        {event.followUpOn && (
          <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 dark:bg-sky-500/10 dark:text-sky-200">
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

function renderEventSummary(ev: TimelineEvent) {
  if (ev.type === "STATUS_CHANGE" && ev.prevStatus && ev.nextStatus) {
    return `Status changed from ${humanize(ev.prevStatus)} to ${humanize(ev.nextStatus)}`;
  }
  if (ev.type === "STAGE_CHANGE" && ev.prevStage && ev.nextStage) {
    const prev = STAGE_META[ev.prevStage as LeadStage]?.label ?? humanize(ev.prevStage);
    const next = STAGE_META[ev.nextStage as LeadStage]?.label ?? humanize(ev.nextStage);
    return `Stage moved from ${prev} to ${next}`;
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
      return humanize(ev.type ?? "event");
  }
}
