import { format } from "date-fns";
import type { Message, User } from "./types";

export default function ChatMessageBubble({
  msg,
  me,
  author,
}: {
  msg: Message;
  me: User;
  author: User;
}) {
  const mine = msg.authorId === me.id;

  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div className={`flex items-end gap-2 max-w-[78%]`}>
        {!mine && (
          <img
            src={
              author.avatarUrl ||
              `https://api.dicebear.com/8.x/avataaars/svg?seed=${encodeURIComponent(author.name)}`
            }
            alt={author.name}
            className="h-8 w-8 rounded-full"
          />
        )}

        <div className={`space-y-1 ${mine ? "text-right" : "text-left"}`}>
          {msg.text && (
            <div
              className={[
                "rounded-2xl px-4 py-2 text-sm leading-relaxed",
                mine
                  ? "bg-indigo-500 text-white rounded-br-md"
                  : "bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white rounded-bl-md",
              ].join(" ")}
            >
              {msg.text}
            </div>
          )}

          {msg.imageUrl && (
            <img
              src={msg.imageUrl}
              alt="attachment"
              className="rounded-xl border border-gray-100 dark:border-white/10"
            />
          )}

          <div className="text-[11px] text-gray-400">
            {format(new Date(msg.createdAt), "p")}
          </div>
        </div>
      </div>
    </div>
  );
}
