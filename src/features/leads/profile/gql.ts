import { gql } from "@apollo/client";

// Query a single lead with recent events
export const LEAD_PROFILE_QUERY = gql`
  query LeadProfile($id: ID!) {
    lead(id: $id) {
      __typename
      id
      leadCode
      name
      clientStage
      product
      investmentRange
      phone
      phoneNormalized
      phones { __typename number normalized isPrimary }
      leadSource
      profession
      approachAt
      createdAt
      events {
        __typename
        id
        type
        occurredAt
        text
        meta
        author {
          __typename
          id
          name
        }
      }
    }
  }
`;

// Update the lead's current stage
export const CHANGE_LEAD_STAGE_MUTATION = gql`
  mutation ChangeLeadStage($id: ID!, $stage: ClientStage!) {
    updateLead(id: $id, input: { clientStage: $stage }) {
      __typename
      id
      clientStage
      leadCode
    }
  }
`;

// Create a new interaction / note event for a lead
export const CREATE_LEAD_EVENT_MUTATION = gql`
  mutation CreateLeadEvent(
    $leadId: ID!
    $type: LeadEventType!
    $text: String
    $nextFollowUpAt: DateTime
  ) {
    createLeadEvent(
      input: { leadId: $leadId, type: $type, text: $text, nextFollowUpAt: $nextFollowUpAt }
    ) {
      __typename
      id
      type
      occurredAt
      text
      meta
      author {
        __typename
        id
        name
      }
    }
  }
`;

// Edit an existing event's text (if API supports it)
export const UPDATE_LEAD_EVENT_MUTATION = gql`
  mutation UpdateLeadEvent($id: ID!, $text: String!) {
    updateLeadEvent(id: $id, input: { text: $text }) {
      __typename
      id
      type
      occurredAt
      text
      meta
      author { __typename id name }
    }
  }
`;

export type LeadEventTypeStr =
  | "REVISIT"
  | "NOTE"
  | "INTERACTION"
  | "STATUS_CHANGE"
  | "ASSIGNMENT"
  | "PHONE_ADDED"
  | "PHONE_REMOVED"
  | "PHONE_MARKED_PRIMARY"
  | "REMARK_UPDATED"
  | "BIO_UPDATED"
  | "HISTORY_SNAPSHOT";

export const EVENT_TYPES: LeadEventTypeStr[] = [
  "REVISIT",
  "NOTE",
  "INTERACTION",
  "STATUS_CHANGE",
  "ASSIGNMENT",
  "PHONE_ADDED",
  "PHONE_REMOVED",
  "PHONE_MARKED_PRIMARY",
  "REMARK_UPDATED",
  "BIO_UPDATED",
  "HISTORY_SNAPSHOT",
];

export type StageOption =
  | "FIRST_TALK_DONE"
  | "FOLLOWING_UP"
  | "CLIENT_INTERESTED"
  | "ACCOUNT_OPENED"
  | "NO_RESPONSE_DORMANT"
  | "NOT_INTERESTED_DORMANT"
  | "RISKY_CLIENT_DORMANT"
  | "HIBERNATED";

export const STAGE_OPTIONS: StageOption[] = [
  "FIRST_TALK_DONE",
  "FOLLOWING_UP",
  "CLIENT_INTERESTED",
  "ACCOUNT_OPENED",
  "NO_RESPONSE_DORMANT",
  "NOT_INTERESTED_DORMANT",
  "RISKY_CLIENT_DORMANT",
  "HIBERNATED",
];

// Helpers
export function displayPhone(lead: any): string | null {
  const arr = Array.isArray(lead?.phones) ? lead.phones : [];
  const primary = arr.find((p: any) => p?.isPrimary) || arr[0];
  return (
    primary?.number || primary?.normalized || lead?.mobile || lead?.phone || lead?.phoneNormalized || null
  );
}

export function inferClientTypeFromProfession(profession?: string | null): string | null {
  if (!profession) return null;
  const p = profession.toLowerCase();
  if (/(self|freelance|consult|independent|professional)/.test(p)) return "Self-employed";
  if (/(business|owner|entrepreneur|trader|shop|firm|company)/.test(p)) return "Business";
  if (/(employee|staff|engineer|developer|analyst|manager|executive|assistant|officer)/.test(p)) return "Employee";
  return profession;
}
