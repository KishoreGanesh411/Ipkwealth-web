import { useMemo } from "react";
import { CalendarClock } from "lucide-react";
import { formatDateDisplay, humanize } from "./interface/utils";

type HistoryEntry = {
  id?: string | null;
  type?: string | null;
  text?: string | null;
  at?: string | null;
  authorId?: string | null;
  authorName?: string | null;
};

type Props = {
  history?: Array<HistoryEntry | null> | null;
};

export default function LeadHistoryList({ history }: Props) {
  const sortedHistory = useMemo(() => {
    const normalized = (history ?? []).filter(
      (entry): entry is HistoryEntry => Boolean(entry),
    );
    return normalized
      .slice()
      .sort((a, b) => {
        const ta = a.at ? Date.parse(a.at) : 0;
        const tb = b.at ? Date.parse(b.at) : 0;
        return tb - ta;
      });
  }, [history]);

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03] flex flex-col max-h-[480px]">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Lead history</h2>
        <span className="text-xs text-gray-400">{sortedHistory.length} entries</span>
      </div>
      <div className="mt-4 space-y-4 flex-1 overflow-y-auto pr-2">
        {sortedHistory.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/60 p-6 text-sm text-gray-500">
            No history recorded yet.
          </div>
        ) : (
          sortedHistory.map((entry, index) => (
            <div
              key={entry.id ?? entry.at ?? `history-${index}`}
              className="rounded-2xl border border-gray-200 bg-gray-50 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]"
            >
              <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
                <div className="flex items-center gap-2 text-gray-700 dark:text-white">
                  <CalendarClock className="h-4 w-4 text-emerald-600" />
                  <span>{humanize(entry.type ?? "history")}</span>
                </div>
                <span className="text-[11px]">
                  {entry.at ? formatDateDisplay(entry.at) : "Unknown date"}
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-700 dark:text-white/80">
                {entry.text ?? "-"}
              </p>
              {entry.authorName && (
                <p className="mt-1 text-[11px] text-gray-500">
                  Updated by {entry.authorName}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
