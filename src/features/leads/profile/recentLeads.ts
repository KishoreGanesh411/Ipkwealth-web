export type RecentLead = {
  id: string;
  leadCode?: string | null;
  name?: string | null;
  phone?: string | null;
  viewedAt: string; // ISO
};

const STORAGE_KEY = "ipk_recent_leads";

export function getRecentLeads(): RecentLead[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.filter(Boolean);
  } catch {
    return [];
  }
}

export function pushRecentLead(input: Omit<RecentLead, "viewedAt"> & { viewedAt?: string }) {
  const list = getRecentLeads();
  const now = input.viewedAt ?? new Date().toISOString();
  const without = list.filter((x) => x.id !== input.id);
  const trimmed = [
    { id: input.id, leadCode: input.leadCode ?? null, name: input.name ?? null, phone: input.phone ?? null, viewedAt: now },
    ...without,
  ].slice(0, 20);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    /* ignore quota */
  }
}

