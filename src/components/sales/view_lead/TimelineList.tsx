import TimelineRow from "./TimelineRow";
import type { LeadEvent } from "./interface/types";

type Props = {
  events: LeadEvent[];
};

export default function TimelineList({ events }: Props) {
  return (
    <section className="card card-padded">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Activity timeline</h2>
        <span className="text-xs text-gray-400">{events.length} entries</span>
      </div>
      <div className="mt-4 space-y-6">
        {events.length === 0 && (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/60 p-6 text-sm text-gray-500">
            No events recorded yet. Log a call or note to begin history.
          </div>
        )}
        {events.map((ev) => (
          <TimelineRow key={ev.id} event={ev as any} />
        ))}
      </div>
    </section>
  );
}


