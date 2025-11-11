import { useMemo, useState } from "react";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatHeader from "@/components/chat/ChatHeader";
import ChatMessageList from "@/components/chat/ChatMessageList";
import ChatComposer from "@/components/chat/ChatComposer";
import type { ChatState, Message } from "@/components/chat/types";

const seed: ChatState = {
  me: { id: "me", name: "Musharof", title: "Admin" },
  threads: [
    {
      id: "t1",
      contact: { id: "u1", name: "Lindsey Curtis", title: "Designer", online: true },
      lastMessageSnippet: "I want more detailed information.",
      lastMessageAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      unread: false,
    },
    {
      id: "t2",
      contact: { id: "u2", name: "Kaiya George", title: "Project Manager", online: true },
      lastMessageSnippet: "Can we do 2:00 to 5:00pm?",
      lastMessageAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      unread: true,
    },
    {
      id: "t3",
      contact: { id: "u3", name: "Zain Geidt", title: "Content Writer" },
      lastMessageSnippet: "Draft is ready.",
      lastMessageAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    },
  ],
  messagesByThread: {
    t1: [
      {
        id: "m1",
        threadId: "t1",
        authorId: "u1",
        text: "I want to make an appointment tomorrow from 2:00 to 5:00pm?",
        createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      },
      {
        id: "m2",
        threadId: "t1",
        authorId: "me",
        text: "If I don't like something, I'll stay away from it.",
        createdAt: new Date(Date.now() - 30 * 60 * 1000 + 60 * 1000).toISOString(),
      },
      {
        id: "m3",
        threadId: "t1",
        authorId: "u1",
        text: "I want more detailed information.",
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
    ],
    t2: [
      {
        id: "m4",
        threadId: "t2",
        authorId: "u2",
        text: "I want to make an appointment tomorrow from 2:00 to 5:00pm?",
        createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      },
      {
        id: "m5",
        threadId: "t2",
        authorId: "me",
        text: "They got there early, and got really good seats.",
        createdAt: new Date(Date.now() - 15 * 60 * 1000 + 60 * 1000).toISOString(),
      },
    ],
    t3: [],
  },
};

export default function ChatPage() {
  const [state, setState] = useState<ChatState>(seed);
  const [activeId, setActiveId] = useState<string>(state.threads[0]?.id);

  const activeThread = useMemo(
    () => state.threads.find((t) => t.id === activeId)!,
    [activeId, state.threads]
  );
  const messages = state.messagesByThread[activeId!] || [];

  async function handleSend(text: string, files: File[]) {
    // 1) optimistic local append
    const newMsg: Message = {
      id: crypto.randomUUID(),
      threadId: activeId!,
      authorId: state.me.id,
      text,
      createdAt: new Date().toISOString(),
    };

    setState((prev) => ({
      ...prev,
      messagesByThread: {
        ...prev.messagesByThread,
        [activeId!]: [...messages, newMsg],
      },
      threads: prev.threads.map((t) =>
        t.id === activeId
          ? {
              ...t,
              lastMessageSnippet: text || (files.length ? "Attachment" : ""),
              lastMessageAt: newMsg.createdAt,
              unread: false,
            }
          : t
      ),
    }));

    // 2) (future) send to backend/WhatsApp Cloud API
    // await sendToBackend(newMsg, files)
  }

  return (
    <div className="xl:flex min-h-[calc(100vh-120px)] rounded-2xl bg-white/70 dark:bg-white/5 border border-gray-100 dark:border-white/10 overflow-hidden">
      <ChatSidebar
        threads={state.threads}
        activeId={activeId}
        onSelect={setActiveId}
      />

      <section className="flex-1 flex flex-col">
        <ChatHeader contact={activeThread.contact} />
        <ChatMessageList
          me={state.me}
          contact={activeThread.contact}
          messages={messages}
        />
        <ChatComposer onSend={handleSend} />
      </section>
    </div>
  );
}
