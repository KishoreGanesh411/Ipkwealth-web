import { useRef, useState } from "react";
import { Paperclip, Smile, Send } from "lucide-react";

export default function ChatComposer({
  onSend,
  disabled,
}: {
  onSend: (text: string, files: File[]) => Promise<void> | void;
  disabled?: boolean;
}) {
  const [text, setText] = useState("");
  const fileRef = useRef<HTMLInputElement | null>(null);

  async function handleSend() {
    const files = Array.from(fileRef.current?.files || []);
    if (!text.trim() && files.length === 0) return;
    await onSend(text.trim(), files);
    setText("");
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className="border-t border-gray-100 dark:border-white/10 px-4 md:px-6 py-3">
      <div className="flex items-end gap-2">
        <button
          onClick={() => fileRef.current?.click()}
          className="h-10 w-10 grid place-items-center rounded-full hover:bg-gray-100 dark:hover:bg-white/10"
          title="Attach"
        >
          <Paperclip size={18} />
        </button>
        <input ref={fileRef} type="file" multiple className="hidden" />

        <div className="flex-1">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            rows={1}
            placeholder="Type a message"
            className="w-full resize-none rounded-xl border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <button
          onClick={handleSend}
          disabled={disabled}
          className="h-10 w-10 grid place-items-center rounded-full bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-50"
          title="Send"
        >
          <Send size={18} />
        </button>

        <button
          className="h-10 w-10 grid place-items-center rounded-full hover:bg-gray-100 dark:hover:bg-white/10"
          title="Emoji"
        >
          <Smile size={18} />
        </button>
      </div>
    </div>
  );
}
