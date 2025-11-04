// Lightweight localStorage-backed demo data for offline sales pages
// No external deps; shapes loosely match the app's GraphQL usage

export type DemoLead = {
  id: string;
  leadCode: string;
  name: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  phoneNormalized?: string | null;
  leadSource?: string | null;
  profession?: string | null;
  product?: string | null;
  investmentRange?: string | null;
  sipAmount?: number | null;
  status: string; // PENDING | OPEN | ON_HOLD | CLOSED | ASSIGNED
  clientStage?: string | null; // STAGE keys from app
  archived: boolean;
  remark?: string | null;
  bioText?: string | null;
  createdAt: string;
  updatedAt: string;
  firstSeenAt?: string | null;
  lastSeenAt?: string | null;
  lastContactedAt?: string | null;
  approachAt?: string | null;
  reenterCount?: number | null;
  nextActionDueAt?: string | null;
  assignedRM?: string | null;
  assignedRmId?: string | null;
  phones: Array<{ number: string; normalized?: string | null; isPrimary: boolean; isWhatsapp: boolean }>;
};

export type DemoEvent = {
  id: string;
  type: string; // NOTE | INTERACTION | STATUS_CHANGE | STAGE_CHANGE | REMARK_UPDATED | BIO_UPDATED
  text?: string | null;
  occurredAt: string;
  meta?: Record<string, any> | null;
  author?: { id: string; name: string } | null;
};

const LS_KEY = {
  leads: "ipk.demo.leads",
  events: "ipk.demo.events", // record: { [leadId]: DemoEvent[] }
};

const NOW = () => new Date().toISOString();

export function seedDemoData() {
  const seeded = localStorage.getItem(LS_KEY.leads);
  if (seeded) return; // already seeded

  const statuses = ["PENDING", "OPEN", "ON_HOLD", "CLOSED", "ASSIGNED"];
  const stages = [
    "NEW_LEAD",
    "FIRST_TALK_DONE",
    "FOLLOWING_UP",
    "CLIENT_INTERESTED",
    "ACCOUNT_OPENED",
    "NO_RESPONSE_DORMANT",
    "NOT_INTERESTED_DORMANT",
    "RISKY_CLIENT_DORMANT",
    "HIBERNATED",
  ];

  const leads: DemoLead[] = Array.from({ length: 10 }).map((_, i) => {
    const id = `L${1000 + i}`;
    const first = ["Bharath", "Prabhu", "Aisha", "Rahul", "Anita", "Vikram", "Sneha", "Rohan", "Deepa", "Kiran"][i % 10];
    const last = ["K", "S", "M", "R", "T", "V", "G", "B", "P", "N"][i % 10];
    const name = `${first} ${last}`;
    const status = statuses[i % statuses.length];
    const stage = stages[(i + 2) % stages.length];
    const created = new Date(Date.now() - (i + 1) * 86400000).toISOString();
    return {
      id,
      leadCode: `IPK-${(100 + i).toString()}`,
      name,
      firstName: first,
      lastName: last,
      email: `${first.toLowerCase()}@example.com`,
      phone: `98${(10000000 + i * 12345).toString().padStart(8, "0")}`,
      phoneNormalized: null,
      leadSource: ["WEB", "REFERRAL", "EVENT"][i % 3],
      profession: ["EMPLOYEE", "SELF_EMPLOYED", "BUSINESS"][i % 3],
      product: ["IAP", "SIP"][i % 2],
      investmentRange: ["<50k", "50k-1L", "1L-5L", ">5L"][i % 4],
      sipAmount: i % 2 === 0 ? 5000 + i * 500 : null,
      status,
      clientStage: stage,
      archived: false,
      remark: i % 2 === 0 ? "Warm lead. Follow-up next week." : "Requested product details.",
      bioText: i % 3 === 0 ? "NRI investor, focuses on SIPs." : null,
      createdAt: created,
      updatedAt: created,
      firstSeenAt: created,
      lastSeenAt: created,
      lastContactedAt: created,
      approachAt: created,
      reenterCount: i % 3,
      nextActionDueAt: i % 2 === 0 ? new Date(Date.now() + (i + 1) * 2 * 86400000).toISOString() : null,
      assignedRM: "Bharath",
      assignedRmId: "U1",
      phones: [
        { number: `+91${(9811111111 + i * 73).toString()}`, normalized: null, isPrimary: true, isWhatsapp: i % 2 === 0 },
      ],
    } as DemoLead;
  });

  const events: Record<string, DemoEvent[]> = {};
  leads.forEach((l, idx) => {
    const baseAuthor = { id: "U1", name: "Bharath" };
    events[l.id] = [
      {
        id: `${l.id}-e1`,
        type: "REMARK_UPDATED",
        occurredAt: NOW(),
        text: "Remark Updated",
        meta: null,
        author: baseAuthor,
      },
      {
        id: `${l.id}-e2`,
        type: "INTERACTION",
        occurredAt: NOW(),
        text: "Interaction captured",
        meta: { channel: "CALL", outcome: "ANSWERED" },
        author: baseAuthor,
      },
      {
        id: `${l.id}-e3`,
        type: "STATUS_CHANGE",
        occurredAt: NOW(),
        text: `Status changed from Pending to ${l.status.replace(/_/g, " ")}`,
        meta: { prevStatus: "PENDING", nextStatus: l.status },
        author: baseAuthor,
      },
    ];
  });

  localStorage.setItem(LS_KEY.leads, JSON.stringify(leads));
  localStorage.setItem(LS_KEY.events, JSON.stringify(events));
}

export function listLeads(): DemoLead[] {
  const s = localStorage.getItem(LS_KEY.leads);
  return s ? (JSON.parse(s) as DemoLead[]) : [];
}

export function saveLeads(list: DemoLead[]) {
  localStorage.setItem(LS_KEY.leads, JSON.stringify(list));
}

export function getLead(id: string): DemoLead | null {
  return listLeads().find((l) => l.id === id) || null;
}

export function listEvents(leadId: string): DemoEvent[] {
  const map = JSON.parse(localStorage.getItem(LS_KEY.events) || "{}") as Record<string, DemoEvent[]>;
  return map[leadId] || [];
}

export function pushEvent(leadId: string, ev: Omit<DemoEvent, "id" | "occurredAt"> & { id?: string; occurredAt?: string }) {
  const id = ev.id || `${leadId}-e${Math.random().toString(36).slice(2, 9)}`;
  const occurredAt = ev.occurredAt || NOW();
  const map = JSON.parse(localStorage.getItem(LS_KEY.events) || "{}") as Record<string, DemoEvent[]>;
  const arr = map[leadId] || [];
  arr.unshift({ ...(ev as any), id, occurredAt });
  map[leadId] = arr;
  localStorage.setItem(LS_KEY.events, JSON.stringify(map));
  return arr[0];
}

export function updateLead(id: string, patch: Partial<DemoLead>): DemoLead | null {
  const list = listLeads();
  const idx = list.findIndex((l) => l.id === id);
  if (idx === -1) return null;
  const updated = { ...list[idx], ...patch, updatedAt: NOW() } as DemoLead;
  list[idx] = updated;
  saveLeads(list);
  return updated;
}

export function summaryForAssigned(): {
  totalAssigned: number;
  newToday: number;
  inProgress: number;
  hotLeads: number;
  dormant: number;
  closed: number;
  followUpsDueToday: number;
  followUpsOverdue: number;
} {
  const list = listLeads();
  const today = new Date();
  const isToday = (iso?: string | null) => {
    if (!iso) return false;
    const d = new Date(iso);
    return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
  };
  const res = {
    totalAssigned: list.length,
    newToday: list.filter((l) => isToday(l.createdAt)).length,
    inProgress: list.filter((l) => l.status === "OPEN" || l.status === "PENDING" || l.status === "ASSIGNED").length,
    hotLeads: list.filter((l) => l.clientStage === "CLIENT_INTERESTED").length,
    dormant: list.filter((l) => (l.clientStage || "").includes("DORMANT")).length,
    closed: list.filter((l) => l.status === "CLOSED").length,
    followUpsDueToday: list.filter((l) => isToday(l.nextActionDueAt)).length,
    followUpsOverdue: list.filter((l) => l.nextActionDueAt && new Date(l.nextActionDueAt) < today).length,
  };
  return res;
}

export const demoUser = { id: "U1", name: "Bharath", email: "bharath@ipkwealth.com", role: "RM", status: "ACTIVE" };

