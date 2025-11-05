import { memo, useEffect, useRef, useCallback, KeyboardEvent } from "react";
import { AngleLeftIcon, AngleRightIcon } from "@/icons/index";

/** tiny white spinner */
function SpinnerDot({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white ${className}`}
      aria-hidden
    />
  );
}

type Props = {
  page: number;
  totalPages: number;
  setPage: (p: number) => void;
  generateLead: () => void;
  generating: boolean;
  genDone: boolean;
  showGenerate?: boolean;
};

export const LeadTableFooter = memo(function LeadTableFooter({
  page,
  totalPages,
  setPage,
  generateLead,
  generating,
  genDone,
  showGenerate = true,
}: Props) {
  const go = useCallback(
    (p: number) => {
      if (p < 1 || p > totalPages || p === page) return;
      setPage(p);
    },
    [page, totalPages, setPage]
  );

  // track direction for slide animation
  const prevPageRef = useRef(page);
  const dir = page > prevPageRef.current ? "right" : page < prevPageRef.current ? "left" : "none";
  useEffect(() => void (prevPageRef.current = page), [page]);

  /** Build a stable, centered window. 9 slots => [-4..+4] around current, clamped to edges */
  const windowPages = (() => {
    if (totalPages <= 9) return Array.from({ length: totalPages }, (_, i) => i + 1);

    const start = Math.max(1, Math.min(page - 4, totalPages - 8));
    const end = Math.min(totalPages, start + 8);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  })();

  const showFirst = windowPages[0] > 1;
  const showLast = windowPages[windowPages.length - 1] < totalPages;

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft") go(page - 1);
    if (e.key === "ArrowRight") go(page + 1);
    if (e.key === "Home") go(1);
    if (e.key === "End") go(totalPages);
  };

  return (
    <div className="px-4 py-4">
      {/* Pagination row */}
      <div
        className="flex w-full items-center justify-center gap-2"
        data-dir={dir}
        onKeyDown={onKey}
        role="navigation"
        aria-label="Pagination"
        tabIndex={0}
      >
        <button
          onClick={() => go(page - 1)}
          disabled={page === 1}
          className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors
            ${page === 1
              ? "cursor-not-allowed border-gray-200 text-gray-400 dark:border-white/10 dark:text-white/30"
              : "border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:text-white/80 dark:hover:bg-white/5"}`}
          aria-label="Previous page"
        >
          <AngleLeftIcon /> Prev
        </button>

        {/* numbers container slides, while the current button stays visually centered for mid pages */}
        <div
          key={`${page}-${totalPages}`}
          className={`isolate grid grid-flow-col auto-cols-max items-center gap-1
            animate-[pager-none_1ms_linear] data-[dir=right]:animate-[pager-left_170ms_ease-out]
            data-[dir=left]:animate-[pager-right_170ms_ease-out]`}
          data-dir={dir}
        >
          {showFirst && (
            <>
              <PageBtn current={page} value={1} onClick={go} />
              <Ellipsis />
            </>
          )}

          {windowPages.map((p) => {
            const dist = Math.abs(p - page);
            const styleBlur = dist === 4 ? "opacity-60 blur-[1px] hover:opacity-75" : "";
            return <PageBtn key={p} current={page} value={p} onClick={go} extraClass={styleBlur} />;
          })}

          {showLast && (
            <>
              <Ellipsis />
              <PageBtn current={page} value={totalPages} onClick={go} />
            </>
          )}
        </div>

        <button
          onClick={() => go(page + 1)}
          disabled={page === totalPages}
          className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors
            ${page === totalPages
              ? "cursor-not-allowed border-gray-200 text-gray-400 dark:border-white/10 dark:text-white/30"
              : "border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:text-white/80 dark:hover:bg-white/5"}`}
          aria-label="Next page"
        >
          Next <AngleRightIcon />
        </button>
      </div>

      {/* Actions row */}
      {showGenerate && (
        <div className="mt-3 flex w-full justify-end">
          <button
            onClick={generateLead}
            disabled={generating}
            className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white transition
              ${generating ? "bg-brand-500/70"
                : genDone ? "bg-success-600"
                : "bg-brand-600 hover:bg-brand-700"}`}
          >
            {generating ? (
              <>
                <SpinnerDot /> Generating…
              </>
            ) : genDone ? (
              <>
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-white/90 text-success-700 ring-1 ring-success-300 animate-[pop_280ms_ease-out]">
                  ✓
                </span>
                Generated!
              </>
            ) : (
              <>Generate Lead</>
            )}
          </button>
        </div>
      )}
    </div>
  );
});

function Ellipsis() {
  return <span className="px-1 text-gray-400 select-none">…</span>;
}

function PageBtn({
  current,
  value,
  onClick,
  extraClass = "",
}: {
  current: number;
  value: number;
  onClick: (p: number) => void;
  extraClass?: string;
}) {
  const isActive = value === current;
  return (
    <button
      onClick={() => onClick(value)}
      aria-current={isActive ? "page" : undefined}
      aria-label={isActive ? `Page ${value}, current` : `Go to page ${value}`}
      className={[
        "relative inline-flex h-8 w-8 select-none items-center justify-center rounded-md border text-sm transition-all duration-150",
        isActive
          ? "border-brand-600 bg-brand-600 text-white shadow-sm animate-[pager-pop_130ms_ease-out]"
          : "border-gray-200 bg-transparent text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:text-white/80 dark:hover:bg-white/5",
        extraClass,
      ].join(" ")}
    >
      {value}
    </button>
  );
}
