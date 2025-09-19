import type { Lead, LeadFormData } from "../../components/lead/types";
import {
    createLead, getLeadByCode,
} from "../api/leadHelper";

export interface LeadDataSource {
  create(input: LeadFormData): Promise<Lead>;
  getByCode(code: string): Promise<Lead | null>;
  updateByCode(code: string, patch: Partial<Lead>): Promise<Lead>;
}

/** Default adapter using your existing REST helpers */
export const restLeadAdapter: LeadDataSource = {
    create: (input) => createLead(input),
    getByCode: (code) => getLeadByCode(code),
    updateByCode: function (): Promise<Lead> {
        throw new Error('Function not implemented.');
    }
};

/** Example GraphQL adapter (plug later without touching UI)
import { apolloClient } from "../graphql/apolloClient";
import { gql } from "@apollo/client";
export const gqlLeadAdapter: LeadDataSource = {
  async create(input) {
    const { data } = await apolloClient.mutate({ mutation: CREATE_LEAD, variables: { input }});
    return data.createLead;
  },
  async getByCode(code) {
    const { data } = await apolloClient.query({ query: LEAD_BY_CODE, variables: { code }, fetchPolicy:"network-only" });
    return data.leadByCode ?? null;
  },
  async updateByCode(code, patch) {
    const { data } = await apolloClient.mutate({ mutation: UPDATE_LEAD, variables: { code, input: patch }});
    return data.updateLead;
  },
};
*/
