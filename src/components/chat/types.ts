export type User = {
  id: string;
  name: string;
  avatarUrl?: string;
  title?: string;
  online?: boolean;
};

export type Message = {
  id: string;
  threadId: string;
  authorId: string;
  text?: string;
  imageUrl?: string;
  createdAt: string; // ISO
};

export type Thread = {
  id: string;
  contact: User;
  lastMessageSnippet: string;
  lastMessageAt: string; // ISO
  unread?: boolean;
};

export type ChatState = {
  me: User;
  threads: Thread[];
  messagesByThread: Record<string, Message[]>;
};
