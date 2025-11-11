import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { leadOptions, valueToLabel } from "@/components/lead/types";

/* ===== Types ===== */
export type AssignedRM = "Ramyapriya" | "Haripriya" | "Bharath";

export type LeadRow = {
  id: string;            // e.g. IPK-000001
  name: string;
  phone: string;
  source: string;
  createdAt: string;     // ISO
  assignedRm?: AssignedRM;
};

export type NewLead = {
  firstName: string;
  lastName: string;
  phone: string;
  leadSource: string;
};

type LeadStore = {
  leads: LeadRow[];
  addLead: (l: NewLead) => void;
  deleteLead: (id: string) => void;
  generateLead: () => void; // assign IPK ids + round-robin RM for any missing
};

/* ===== Helpers ===== */
const DEFAULT_RMS: AssignedRM[] = ["Ramyapriya", "Haripriya", "Bharath"];

function createLeadId(n: number) {
  // IPK-000001 style
  return `IPK-${String(n).padStart(6, "0")}`;
}

/* ===== Context ===== */
const LeadStoreCtx = createContext<LeadStore | null>(null);

export function LeadStoreProvider({ children }: { children: React.ReactNode }) {
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const nextNum = useRef(1); // next serial for IPK code

  const addLead = useCallback((data: NewLead) => {
    // We create a temp ID immediately (so it's unique even before Generate)
    const tempId = `TMP-${String(nextNum.current).padStart(4, "0")}`;
    const name = `${data.firstName ?? ""} ${data.lastName ?? ""}`.trim() || "Unnamed Lead";

    setLeads(prev => [
      {
        id: tempId,
        name,
        phone: data.phone,
        source: valueToLabel(data.leadSource, leadOptions) || "Unknown",
        createdAt: new Date().toISOString(),
        // assignedRm left blank until Generate
      },
      ...prev,
    ]);
  }, []);

  const deleteLead = useCallback((id: string) => {
    setLeads(prev => prev.filter(l => l.id !== id));
  }, []);

  const generateLead = useCallback(() => {
    setLeads(prev => {
      let rmIndex = 0;
      return prev.map(l => {
        const hasIpK = l.id.startsWith("IPK-");
        const id = hasIpK ? l.id : createLeadId(nextNum.current++);
        const assignedRm = l.assignedRm ?? DEFAULT_RMS[rmIndex++ % DEFAULT_RMS.length];
        return { ...l, id, assignedRm };
      });
    });
  }, []);

  const value = useMemo(
    () => ({ leads, addLead, deleteLead, generateLead }),
    [leads, addLead, deleteLead, generateLead],
  );

  return <LeadStoreCtx.Provider value={value}>{children}</LeadStoreCtx.Provider>;
}

export function useLeadStore() {
  const ctx = useContext(LeadStoreCtx);
  if (!ctx) throw new Error("useLeadStore must be used within LeadStoreProvider");
  return ctx;
}
