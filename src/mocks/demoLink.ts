import { ApolloLink, Observable, FetchResult, Operation } from "@apollo/client";
import {
  demoUser,
  seedDemoData,
  listLeads,
  getLead,
  listEvents,
  updateLead,
  pushEvent,
  summaryForAssigned,
} from "./demoData";

function ok(data: any) {
  return new Observable<FetchResult>((observer) => {
    setTimeout(() => {
      observer.next({ data });
      observer.complete();
    }, 30);
  });
}

function pick<T>(obj: T | undefined | null, ...keys: (keyof T)[]): Partial<T> {
  const out: Partial<T> = {};
  if (!obj) return out;
  keys.forEach((k) => ((out as any)[k] = (obj as any)[k]));
  return out;
}

export class DemoLink extends ApolloLink {
  constructor() {
    super();
    // Ensure there is data in localStorage
    try { seedDemoData(); } catch {}
  }

  request(operation: Operation) {
    const name = operation.operationName || "";
    const vars = operation.variables || {};

    // Common helpers
    const user = demoUser;

    // Auth
    if (name === "Me") {
      return ok({ me: user });
    }

    // Lists
    if (name === "MyAssignedLeads" || name === "Leads") {
      const all = listLeads();
      const page = vars?.args?.page ?? 1;
      const pageSize = vars?.args?.pageSize ?? 20;
      const start = (page - 1) * pageSize;
      const items = all.slice(start, start + pageSize).map((l) => pick(l, "id", "leadCode", "firstName", "lastName", "name", "email", "phone", "leadSource", "assignedRM", "assignedRmId", "status", "clientStage", "createdAt", "lastContactedAt", "firstSeenAt", "lastSeenAt", "reenterCount", "remark", "approachAt"));
      const key = name === "MyAssignedLeads" ? "myAssignedLeads" : "leads";
      return ok({ [key]: { items, page, pageSize, total: all.length } });
    }

    if (name === "MyAssignedLeadSummary") {
      return ok({ myAssignedLeadSummary: summaryForAssigned() });
    }

    // Lead detail with events (two shapes in repo)
    if (name === "LeadDetailWithTimeline" || name === "LeadById") {
      const id = vars.leadId || vars.id;
      const lead = getLead(String(id));
      const events = listEvents(String(id));
      if (name === "LeadDetailWithTimeline") {
        return ok({
          leadDetailWithTimeline: { ...(lead as any), phones: lead?.phones ?? [], events },
          lead: { ...(lead as any) },
          leadEvents: events,
        });
      }
      return ok({ lead: { ...(lead as any), phones: lead?.phones ?? [], events } });
    }

    // Lead detail alternative from core/graphql/lead/lead.gql.ts
    if (name === "LeadDetailWithTimeline_2") {
      const id = vars.id;
      const lead = getLead(String(id));
      return ok({ lead: pick(lead as any, "id", "leadCode", "name", "clientStage", "product", "investmentRange", "phone", "phoneNormalized", "leadSource", "profession", "approachAt", "createdAt", "referralName", "referralCode", "remark", "lastContactedAt"), leadEvents: listEvents(String(id)) });
    }

    // Mutations
    if (name === "UpdateLeadStatus") {
      const id = vars.leadId;
      const status = vars.status;
      const u = updateLead(String(id), { status });
      if (u) {
        pushEvent(String(id), { type: "STATUS_CHANGE", text: `Status changed from Pending to ${String(status).replace(/_/g, " ")}`, meta: { prevStatus: "PENDING", nextStatus: status }, author: { id: user.id, name: user.name } });
      }
      return ok({ updateLeadStatus: pick(u as any, "id", "status", "clientStage", "leadCode", "updatedAt") });
    }

    if (name === "ChangeStage") {
      const { input } = vars;
      const id = input.leadId;
      const stage = input.stage;
      const u = updateLead(String(id), { clientStage: stage, approachAt: (u: any) => u?.approachAt || new Date().toISOString() } as any);
      if (u) {
        pushEvent(String(id), { type: "STAGE_CHANGE", text: `Stage moved from Unknown to ${String(stage).replace(/_/g, " ")}`, meta: { prevStage: "", nextStage: stage }, author: { id: user.id, name: user.name } });
      }
      return ok({ changeStage: pick(u as any, "id", "clientStage", "approachAt", "lastSeenAt", "leadCode", "updatedAt") });
    }

    if (name === "CreateLeadEvent") {
      const { input } = vars;
      const ev = pushEvent(String(input.leadId), { type: input.type || "INTERACTION", text: input.text || "", meta: { channel: input.channel ?? null, outcome: input.outcome ?? null, nextFollowUpAt: input.nextFollowUpAt ?? null }, author: { id: user.id, name: user.name } });
      return ok({ addLeadInteraction: pick(ev as any, "id", "type", "text", "occurredAt", "meta", "author") });
    }

    if (name === "AddLeadNote") {
      const { input } = vars;
      const ev = pushEvent(String(input.leadId), { type: "NOTE", text: input.text || "", meta: null, author: { id: user.id, name: user.name } });
      return ok({ addLeadNote: pick(ev as any, "id", "type", "text", "occurredAt", "meta") });
    }

    if (name === "UpdateLeadBio") {
      const { input } = vars;
      const u = updateLead(String(input.leadId), { bioText: input.bioText });
      return ok({ updateLeadBio: pick(u as any, "id", "bioText", "updatedAt") });
    }

    if (name === "UpdateLeadRemark") {
      const { input } = vars;
      const u = updateLead(String(input.leadId), { remark: input.remark });
      pushEvent(String(input.leadId), { type: "REMARK_UPDATED", text: "Remark Updated", author: { id: user.id, name: user.name }, meta: null });
      return ok({ updateLeadRemark: pick(u as any, "id", "remark", "updatedAt") });
    }

    if (name === "RmFirstContact") {
      const { input } = vars;
      const u = updateLead(String(input.leadId), {
        nextActionDueAt: input.nextFollowUpAt ?? null,
        lastContactedAt: new Date().toISOString(),
        remark: input.note || "",
      });
      pushEvent(String(input.leadId), { type: "INTERACTION", text: input.note || "First contact", meta: { channel: input.channel, productExplained: input.productExplained, notExplainedReason: input.notExplainedReason, nextFollowUpAt: input.nextFollowUpAt }, author: { id: user.id, name: user.name } });
      return ok({ rmFirstContact: pick(u as any, "id", "status", "clientStage", "approachAt", "lastSeenAt", "nextActionDueAt", "lastContactedAt", "remark", "updatedAt") });
    }

    // Default: echo empty
    return ok({});
  }
}
