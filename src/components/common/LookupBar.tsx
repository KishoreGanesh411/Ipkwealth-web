// src/components/Leadform/LookupBar.tsx
import { useEffect, useState } from "react";
import { searchLeads } from "../../core/api/leadHelper";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import type { Lead } from "../lead/types";

export default function LookupBar({
  onPick,
  placeholder = "Enter Lead Code / Phone / Email / Name",
}: {
  onPick: (lead: Lead) => void;
  placeholder?: string;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Lead[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (!q.trim()) {
        setResults([]);
        return;
      }
      const rows = await searchLeads(q);
      setResults(rows.slice(0, 8));
      setOpen(true);
    }, 220);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div className="relative">
      <Label>Find Existing Lead</Label>
      <Input
        name="lookup"
        placeholder={placeholder}
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {open && results.length > 0 && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg dark:border-white/10 dark:bg-dark-900">
          {results.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => {
                onPick(r);
                setOpen(false);
              }}
              className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-white/10"
            >
              <span className="truncate">{`${r.firstName ?? ""} ${r.lastName ?? ""}`.trim() || "Unnamed"}</span>
              <span className="font-mono text-xs text-gray-500">{r.leadCode}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
