import { useEffect, useRef } from "react";
import ChatMessageBubble from "./ChatMessageBubble";
import type { Message, User } from "./types";

export default function ChatMessageList({
  me,
  contact,
  messages,
}: {
  me: User;
  contact: User;
  messages: Message[];
}) {
  const endRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  return (
    <div className="px-4 md:px-6 py-4 overflow-y-auto h-[calc(100vh-210px)] space-y-3">
      {messages.map((m) => (
        <ChatMessageBubble
          key={m.id}
          msg={m}
          me={me}
          author={m.authorId === me.id ? me : contact}
        />
      ))}
      <div ref={endRef} />
    </div>
  );
}
