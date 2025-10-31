// src/core/api/lead.ts
import type { Lead, LeadFormData } from "../../components/lead/types";
type AssignedRM = string;

const KEY = "ipk_leads";
const CURSOR_KEY = "ipk_rm_cursor";
const MEMBERS: AssignedRM[] = ["Bharath", "Ramya", "Haripriya"];

function readAll(): Lead[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}
function writeAll(rows: Lead[]) {
  localStorage.setItem(KEY, JSON.stringify(rows));
}

function getCursor(): number {
  const n = Number(localStorage.getItem(CURSOR_KEY) || "0");
  return Number.isFinite(n) ? n : 0;
}
function setCursor(n: number) {
  localStorage.setItem(CURSOR_KEY, String(n));
}
function nextRM(): AssignedRM {
  const cursor = getCursor();
  const rm = MEMBERS[cursor % MEMBERS.length];
  setCursor(cursor + 1);
  return rm;
}

function pad(n: number) {
  return String(n).padStart(6, "0");
}
export function generateLeadCode(next: number) {
  return `IPK-${pad(next)}`;
}

function composeName(d: LeadFormData) {
  const full = `${d.firstName ?? ""} ${d.lastName ?? ""}`.trim();
  return full || d.email || d.phone || "Unnamed";
}

export async function createLead(payload: LeadFormData): Promise<Lead> {
  const rows = readAll();
  const nextNumber = rows.length + 1;
  const leadCode = generateLeadCode(nextNumber);
  const assignedRM = nextRM();

  const lead: Lead = {
    id: cryptoRandomId(),
    leadCode,
    name: composeName(payload),

    // basic
    firstName: payload.firstName,
    lastName: payload.lastName,
    email: payload.email || "",
    phone: payload.phone,
    leadSource: payload.leadSource,
    remark: payload.remark,

    // assignment + times
    assignedRM,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  rows.push(lead);
  writeAll(rows);
  return lead;
}

export async function getLeadByCode(leadCode: string): Promise<Lead | null> {
  const rows = readAll();
  return rows.find((l) => l.leadCode === leadCode) || null;
}

export async function searchLeads(q: string): Promise<Lead[]> {
  const rows = readAll();
  const needle = q.trim().toLowerCase();
  if (!needle) return [];
  return rows.filter((l) => {
    return (
      l.leadCode?.toLowerCase().includes(needle) ||
      l.phone?.toLowerCase().includes(needle) ||
      l.email?.toLowerCase().includes(needle) ||
      `${l.firstName ?? ""} ${l.lastName ?? ""}`.toLowerCase().includes(needle) ||
      l.name?.toLowerCase().includes(needle)
    );
  });
}

export async function updateLeadByCode(
  leadCode: string,
  patch: Partial<Lead>
): Promise<Lead | null> {
  const rows = readAll();
  const idx = rows.findIndex((l) => l.leadCode === leadCode);
  if (idx < 0) return null;

  const ensureAssigned = rows[idx].assignedRM ?? nextRM();

  const merged: Lead = {
    ...rows[idx],
    ...patch,
    assignedRM: patch.assignedRM ?? ensureAssigned,
    updatedAt: new Date().toISOString(),
  };
  rows[idx] = merged;
  writeAll(rows);
  return merged;
}

function cryptoRandomId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
