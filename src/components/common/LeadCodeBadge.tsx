// src/components/common/LeadCodeBadge.tsx
import { useState } from "react";

export default function LeadCodeBadge({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 dark:border-white/10 dark:bg-white/5 dark:text-gray-200">
      <span className="font-medium">Lead Code:</span>
      <span className="font-mono">{code}</span>
      <button
        type="button"
        onClick={copy}
        className="rounded-md border border-gray-200 px-2 py-0.5 text-xs hover:bg-gray-50 dark:border-white/10 dark:hover:bg-white/10"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
