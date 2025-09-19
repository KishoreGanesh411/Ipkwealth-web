// src/core/graphql/lead/lead.ts
import { apolloClient } from "@/core/apollo/client";
import { CREATE_LEAD, ASSIGN_LEADS, LEADS_OPEN } from "./lead.gql";

export async function createLead(input: any) {
  const { data } = await apolloClient.mutate({
    mutation: CREATE_LEAD,
    variables: { input },
  });
  return data?.createIpkLeadd;
}

/** One API for both single & multi. Pass `[id]` for single. */
export async function assignLeads(ids: string[]) {
  const { data } = await apolloClient.mutate({
    mutation: ASSIGN_LEADS,
    variables: { ids },
    refetchQueries: [{ query: LEADS_OPEN }],
  });
  return data?.assignLeads ?? [];
}
