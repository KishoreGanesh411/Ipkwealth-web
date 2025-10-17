const STORAGE_KEY = 'ipk_last_lead';

export function getLastLeadId(): string | null {
  try {
    if (typeof window === 'undefined') return null;
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v && v.trim() ? v : null;
  } catch {
    return null;
  }
}

export function setLastLeadId(id: string) {
  try {
    if (typeof window === 'undefined') return;
    const v = String(id || '').trim();
    if (v) window.localStorage.setItem(STORAGE_KEY, v);
  } catch {
    // ignore
  }
}

