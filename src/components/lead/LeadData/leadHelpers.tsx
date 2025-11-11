import { useEffect, useState } from "react";

export const PAGE_SIZE = 10;

export function useDebounced<T>(value: T, delay = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setV(value), delay);
    return () => window.clearTimeout(t);
  }, [value, delay]);
  return v;
}

export function TopCenterLoader({ show, text = "Loading..." }: { show: boolean; text?: string }) {
  if (!show) return null;
  return (
    <div className="pointer-events-none absolute left-1/2 top-3 z-20 -translate-x-1/2">
      <div className="flex items-center gap-2 rounded-full bg-white/85 px-3 py-1 shadow-sm ring-1 ring-black/5 backdrop-blur dark:bg-white/10">
        <span
          className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-blue-500/30 border-t-blue-600"
          aria-hidden
        />
        <span className="text-xs text-gray-700 dark:text-white/80">{text}</span>
      </div>
    </div>
  );
}

