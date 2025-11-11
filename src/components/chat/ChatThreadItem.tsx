import { formatDistanceToNow } from "date-fns";
import type { Thread } from "./types";

export default function ChatThreadItem({
  thread,
  selected,
  onClick,
}: {
  thread: Thread;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "w-full text-left flex items-center gap-3 px-3 py-2 rounded-xl",
        selected
          ? "bg-indigo-50 dark:bg-indigo-500/10"
          : "hover:bg-gray-50 dark:hover:bg-white/10",
      ].join(" ")}
    >
      <img
        src={
          thread.contact.avatarUrl ||
          `https://api.dicebear.com/8.x/avataaars/svg?seed=${encodeURIComponent(thread.contact.name)}`
        }
        alt={thread.contact.name}
        className="h-10 w-10 rounded-full"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <div className="font-medium truncate">{thread.contact.name}</div>
          <div className="text-xs text-gray-500">
            {formatDistanceToNow(new Date(thread.lastMessageAt), { addSuffix: true })}
          </div>
        </div>
        <div className="text-xs text-gray-500 truncate">
          {thread.lastMessageSnippet}
        </div>
      </div>
      {thread.unread && (
        <span className="ml-2 h-2.5 w-2.5 rounded-full bg-indigo-500" />
      )}
    </button>
  );
}
