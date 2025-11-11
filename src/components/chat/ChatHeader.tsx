import { Phone, Video, MoreHorizontal } from "lucide-react";
import type { User } from "./types";
import Button from "../ui/button/Button";

export default function ChatHeader({ contact }: { contact: User }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/10 px-4 md:px-6 py-3">
      <div className="flex items-center gap-3">
        <img
          src={contact.avatarUrl || `https://api.dicebear.com/8.x/avataaars/svg?seed=${encodeURIComponent(contact.name)}`}
          alt={contact.name}
          className="h-9 w-9 rounded-full"
        />
        <div>
          <div className="font-medium text-gray-900 dark:text-white">{contact.name}</div>
          {contact.title && (
            <div className="text-xs text-gray-500">{contact.title}</div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button className="h-9 w-9 grid place-items-center rounded-full hover:bg-gray-100 dark:hover:bg-white/10">
          <Phone size={18} />
        </Button>
        <Button className="h-9 w-9 grid place-items-center rounded-full hover:bg-gray-100 dark:hover:bg-white/10">
          <Video size={18} />
        </Button>
        <Button className="h-9 w-9 grid place-items-center rounded-full hover:bg-gray-100 dark:hover:bg-white/10">
          <MoreHorizontal size={18} />
        </Button>
      </div>
    </div>
  );
}
