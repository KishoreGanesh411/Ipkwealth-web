import { useMemo, useState } from "react";
import { MessageSquare, Search } from "lucide-react";
import ChatThreadItem from "./ChatThreadItem";
import type { Thread } from "./types";

export default function ChatSidebar({
  threads,
  activeId,
  onSelect,
}: {
  threads: Thread[];
  activeId?: string;
  onSelect: (id: string) => void;
}) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (!n) return threads;
    return threads.filter((t) =>
      t.contact.name.toLowerCase().includes(n) ||
      t.lastMessageSnippet.toLowerCase().includes(n)
    );
  }, [q, threads]);

  return (
    <aside className="w-full md:w-[320px] border-r border-gray-100 dark:border-white/10">
      <div className="flex items-center gap-2 px-4 md:px-5 py-3">
        <MessageSquare className="shrink-0" />
        <div className="font-semibold">Chats</div>
      </div>

      <div className="px-4 md:px-5 pb-3">
        <div className="relative">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search…"
            className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 px-10 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
        </div>
      </div>

      <div className="overflow-y-auto h-[calc(100vh-140px)] px-2 py-1 md:px-3 space-y-1">
        {filtered.map((t) => (
          <ChatThreadItem
            key={t.id}
            thread={t}
            selected={t.id === activeId}
            onClick={() => onSelect(t.id)}
          />
        ))}
      </div>
    </aside>
  );
}
