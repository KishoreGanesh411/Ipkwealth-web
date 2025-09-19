// import { useCallback, useReducer } from "react";
// import type { Lead, LeadFormData } from "../components/lead/types";
// import type { LeadDataSource } from "../core/lead/leadAdapter";
// import { restLeadAdapter } from "../core/lead/leadAdapter";

// type Step = "CREATE" | "ADDITIONAL";

// interface LeadEntryState {
//   step: Step;
//   basic: LeadFormData;
//   server: Lead | null;
//   draft: Partial<Lead>;
//   status: "idle" | "loading" | "creating" | "saving";
//   error?: string;
//   lastSavedAt?: number;
// }

// type Action =
//   | { type: "BASIC_CHANGE"; name: keyof LeadFormData; value: string }
//   | { type: "SET_STEP"; step: Step }
//   | { type: "SET_LOADING"; on: boolean }
//   | { type: "SET_CREATING"; on: boolean }
//   | { type: "SET_SAVING"; on: boolean }
//   | { type: "LOAD_SUCCESS"; lead: Lead }
//   | { type: "CREATE_SUCCESS"; lead: Lead }
//   | { type: "SAVE_SUCCESS"; lead: Lead; at: number }
//   | { type: "DRAFT_PATCH"; patch: Partial<Lead> }
//   | { type: "TOGGLE_CLIENT"; label: string; checked: boolean }
//   | { type: "ERROR"; message?: string }
//   | { type: "RESET_DRAFT" }
//   | { type: "RESET_ALL" };

// const initial: LeadEntryState = {
//   step: "CREATE",
//   basic: {
//     firstName: "",
//     lastName: "",
//     email: "",
//     phone: "",
//     leadSource: "",
//     referralName: "",
//     remark: "",
//   },
//   server: null,
//   draft: {},
//   status: "idle",
// };

// function reducer(state: LeadEntryState, a: Action): LeadEntryState {
//   switch (a.type) {
//     case "BASIC_CHANGE":
//       return { ...state, basic: { ...state.basic, [a.name]: a.value } };
//     case "SET_STEP":
//       return { ...state, step: a.step };
//     case "SET_LOADING":
//       return { ...state, status: a.on ? "loading" : "idle" };
//     case "SET_CREATING":
//       return { ...state, status: a.on ? "creating" : "idle" };
//     case "SET_SAVING":
//       return { ...state, status: a.on ? "saving" : "idle" };
//     case "LOAD_SUCCESS":
//       return { ...state, server: a.lead, draft: a.lead, step: "ADDITIONAL", status: "idle", error: undefined };
//     case "CREATE_SUCCESS":
//       return { ...state, server: a.lead, draft: a.lead, step: "ADDITIONAL", status: "idle", error: undefined };
//     case "SAVE_SUCCESS":
//       return { ...state, server: a.lead, draft: a.lead, status: "idle", lastSavedAt: a.at, error: undefined };
//     case "DRAFT_PATCH":
//       return { ...state, draft: { ...state.draft, ...a.patch } };
//     case "TOGGLE_CLIENT": {
//       const cur = new Set<string>((state.draft.clientTypes as string[]) ?? []);
//       a.checked ? cur.add(a.label) : cur.delete(a.label);
//       return { ...state, draft: { ...state.draft, clientTypes: Array.from(cur) } };
//     }
//     case "RESET_DRAFT":
//       return state.server ? { ...state, draft: state.server } : state;
//     case "ERROR":
//       return { ...state, status: "idle", error: a.message };
//     case "RESET_ALL":
//       return initial;
//     default:
//       return state;
//   }
// }

// export function useLeadEntry(adapter: LeadDataSource = restLeadAdapter) {
//   const [state, dispatch] = useReducer(reducer, initial);

//   const creating = state.status === "creating";
//   const saving = state.status === "saving";
//   const loading = state.status === "loading";

//   const changeBasic = useCallback(
//     (name: keyof LeadFormData, value: string) =>
//       dispatch({ type: "BASIC_CHANGE", name, value }),
//     []
//   );

//   const validateBasic = useCallback(() => {
//     const phoneOk = /^[0-9+\-\s()]{8,}$/.test(state.basic.phone.trim());
//     const emailOk = !state.basic.email || /\S+@\S+\.\S+/.test(state.basic.email);
//     return phoneOk && emailOk && state.basic.leadSource !== "";
//   }, [state.basic]);

//   const create = useCallback(async () => {
//     if (!validateBasic()) throw new Error("Invalid basic info");
//     dispatch({ type: "SET_CREATING", on: true });
//     try {
//       const lead = await adapter.create(state.basic);
//       dispatch({ type: "CREATE_SUCCESS", lead });
//       return lead;
//     } catch (e: any) {
//       dispatch({ type: "ERROR", message: e?.message ?? "Create failed" });
//       throw e;
//     } finally {
//       dispatch({ type: "SET_CREATING", on: false });
//     }
//   }, [adapter, state.basic, validateBasic]);

//   const loadByCode = useCallback(async (code: string) => {
//     dispatch({ type: "SET_LOADING", on: true });
//     try {
//       const lead = await adapter.getByCode(code);
//       if (lead) dispatch({ type: "LOAD_SUCCESS", lead });
//     } catch (e: any) {
//       dispatch({ type: "ERROR", message: e?.message ?? "Load failed" });
//     } finally {
//       dispatch({ type: "SET_LOADING", on: false });
//     }
//   }, [adapter]);

//   const patch = useCallback((patch: Partial<Lead>) => {
//     dispatch({ type: "DRAFT_PATCH", patch });
//   }, []);

//   const toggleClientType = useCallback((label: string, checked: boolean) => {
//     dispatch({ type: "TOGGLE_CLIENT", label, checked });
//   }, []);

//   const save = useCallback(async () => {
//     const code = state.draft.leadCode as string;
//     if (!code) return;
//     dispatch({ type: "SET_SAVING", on: true });
//     try {
//       // 1) Save current draft
//       const saved = await adapter.updateByCode(code, state.draft as Lead);
//       dispatch({ type: "SAVE_SUCCESS", lead: saved, at: Date.now() });
//       // 2) Auto-refresh to pull server-computed changes (RM, timestamps)
//       const fresh = await adapter.getByCode(code);
//       if (fresh) dispatch({ type: "LOAD_SUCCESS", lead: fresh });
//     } catch (e: any) {
//       dispatch({ type: "ERROR", message: e?.message ?? "Save failed" });
//     } finally {
//       dispatch({ type: "SET_SAVING", on: false });
//     }
//   }, [adapter, state.draft]);

//   const resetDraft = useCallback(() => dispatch({ type: "RESET_DRAFT" }), []);
//   const refresh = useCallback(async () => {
//     const code = state.server?.leadCode;
//     if (code) await loadByCode(code);
//   }, [loadByCode, state.server?.leadCode]);

//   const resetAll = useCallback(() => dispatch({ type: "RESET_ALL" }), []);

//   const goto = useCallback((step: Step) => dispatch({ type: "SET_STEP", step }), []);

//   return {
//     state, creating, saving, loading,
//     changeBasic, create, loadByCode,
//     patch, toggleClientType, save,
//     resetDraft, refresh, resetAll, goto,
//   };
// }
