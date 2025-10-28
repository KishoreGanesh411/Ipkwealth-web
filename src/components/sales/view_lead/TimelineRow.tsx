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
import { useAuth } from "@/context/AuthContex";
import type { TimelineEvent } from "./interface/types";

type Props = { event: TimelineEvent };

export default function TimelineRow({ event }: Props) {
  const Icon = iconFor(event.type);
  const { user } = useAuth();
  const author = (() => {
    if (event.authorName) return event.authorName;
    const aId = (event as any).authorId as string | undefined;
    const uId = (user as any)?.id as string | undefined;
    if (aId && uId && aId === uId) return user?.name || "You";
    return undefined;
  })();
  const meta = (event as any)?.meta || {};
  const nextFollowUpRaw: string | undefined =
    (meta?.nextFollowUpAt as string | undefined) || (meta?.followUpOn as string | undefined);
  const channel: string | undefined = (meta?.channel as string | undefined);
  const outcome: string | undefined = (meta?.outcome as string | undefined);

  const inlineDetail = (() => {
    if (event.type === "STATUS_CHANGE" && (event as any).prev && (event as any).next) {
      const prev = humanize((event as any).prev?.status);
      const next = humanize((event as any).next?.status);
      if (prev || next) return `${prev} -> ${next}`.trim();
    }
    if (event.type === "STAGE_CHANGE" && (event as any).prev && (event as any).next) {
      const prevKey = (event as any).prev?.stage ?? "";
      const nextKey = (event as any).next?.stage ?? "";
      const prevLabel = (STAGE_META as any)[prevKey]?.label ?? humanize(prevKey);
      const nextLabel = (STAGE_META as any)[nextKey]?.label ?? humanize(nextKey);
      if (prevLabel || nextLabel) return `${prevLabel} -> ${nextLabel}`.trim();
    }
    if (event.type === "INTERACTION") {
      const parts: string[] = [];
      if (channel) parts.push(humanize(channel));
      if (outcome) parts.push(humanize(outcome));
      return parts.join(" · ");
    }
    return undefined;
  })();

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
          {inlineDetail && (
            <>
              <span aria-hidden="true" className="mx-2 select-none text-gray-300">{String.fromCharCode(8226)}</span>
              <span className="text-gray-500 dark:text-white/60">{inlineDetail}</span>
            </>
          )}
          <span aria-hidden="true" className="mx-2 select-none text-gray-300">{String.fromCharCode(8226)}</span>
          <span title={new Date(event.occurredAt).toLocaleString()}>{formatEventTimestamp(event.occurredAt)}</span>
          {author && (
            <>
              <span aria-hidden="true" className="mx-2 select-none text-gray-300">{String.fromCharCode(8226)}</span>
              <span title={author}>{author}</span>
            </>
          )}
        </div>

        <div className="mt-1 text-sm text-gray-800 dark:text-white/80" title={renderSummary(event)}>
          {renderSummary(event)}
        </div>

        {event.note && (
          <div className="mt-2 max-h-36 overflow-auto rounded-lg border border-gray-100 bg-gray-50/70 p-3 text-sm text-gray-600 dark:border-white/10 dark:bg-white/[0.05] dark:text-white/70">
            {event.note}
          </div>
        )}

        {(nextFollowUpRaw || (event as any).followUpOn) && (
          <div className="timeline-next">
            <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
            Follow-up {formatEventTimestamp(nextFollowUpRaw || (event as any).followUpOn)}
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
  if (ev.type === "STATUS_CHANGE" && (ev as any).prev && (ev as any).next) {
    return `Status changed from ${humanize((ev as any).prev.status)} to ${humanize((ev as any).next.status)}`;
  }
  if (ev.type === "STAGE_CHANGE" && (ev as any).prev && (ev as any).next) {
    const prevKey = (ev as any).prev.stage ?? "";
    const nextKey = (ev as any).next.stage ?? "";
    const prevLabel = (STAGE_META as any)[prevKey]?.label ?? humanize(prevKey);
    const nextLabel = (STAGE_META as any)[nextKey]?.label ?? humanize(nextKey);
    return `Stage moved from ${prevLabel} to ${nextLabel}`;
  }
  if ((ev as any).summary) return (ev as any).summary as string;
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
