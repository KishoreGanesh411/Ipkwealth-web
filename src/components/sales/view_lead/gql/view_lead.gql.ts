import { gql } from "@apollo/client";

/* ---------------------------- Shared Fragments ---------------------------- */

export const FRAG_LEAD_PHONE = gql`
  fragment LeadPhoneParts on LeadPhoneEntity {
    id
    label
    number
    normalized
    isPrimary
    isWhatsapp
    createdAt
  }
`;

export const FRAG_LEAD_EVENT = gql`
  fragment LeadEventParts on LeadEventEntity {
    id
    authorId
    type
    text
    tags
    occurredAt
    prev
    next
    meta
  }
`;

export const FRAG_LEAD_BASE = gql`
  fragment LeadBase on IpkLeaddEntity {
    id
    leadCode
    name
    firstName
    lastName
    email
    phone
    phoneNormalized

    leadSource
    referralCode
    referralName

    gender
    age
    location
    occupations { profession companyName designation startedAt endedAt }

    product
    investmentRange
    sipAmount

    status
    stageFilter
    clientStage
    archived

    remarks { text author createdAt }
    bioText
    clientTypes
    clientQa { question answer }

    createdAt
    updatedAt
    firstSeenAt
    lastSeenAt
    lastContactedAt
    approachAt
    reenterCount

    nextActionDueAt

    # Matches schema exactly:
    assignedRM
    assignedRmId
  }
`;

/* -------------------------------- Queries -------------------------------- */

/** Profile page: full lead + phones + events */
export const LEAD_DETAIL_WITH_TIMELINE = gql`
  query LeadDetailWithTimeline($leadId: ID!, $eventsLimit: Int = 100) {
    leadDetailWithTimeline(leadId: $leadId, eventsLimit: $eventsLimit) {
      ...LeadBase
      phones { ...LeadPhoneParts }
      events { ...LeadEventParts }
    }
  }
  ${FRAG_LEAD_BASE}
  ${FRAG_LEAD_PHONE}
  ${FRAG_LEAD_EVENT}
`;

/** Simpler variant if you ever want to read by id directly */
export const LEAD_BY_ID = gql`
  query LeadById($id: ID!) {
    lead(id: $id) {
      ...LeadBase
      phones { ...LeadPhoneParts }
      events { ...LeadEventParts }
    }
  }
  ${FRAG_LEAD_BASE}
  ${FRAG_LEAD_PHONE}
  ${FRAG_LEAD_EVENT}
`;

/* -------------------------------- Mutations ------------------------------- */

export const UPDATE_LEAD_STATUS = gql`
  mutation UpdateLeadStatus($leadId: ID!, $status: LeadStatus!) {
    updateLeadStatus(leadId: $leadId, status: $status) {
      id
      status
      clientStage
      leadCode
      updatedAt
    }
  }
`;

export const CHANGE_STAGE = gql`
  mutation ChangeStage($input: ChangeStageInput!) {
    changeStage(input: $input) {
      id
      clientStage
      approachAt
      lastSeenAt
      leadCode
      updatedAt
    }
  }
`;

/** Timeline interaction (maps to addLeadInteraction) */
export const CREATE_LEAD_EVENT = gql`
  mutation CreateLeadEvent($input: LeadInteractionInput!) {
    addLeadInteraction(input: $input) {
      id
      type
      text
      tags
      occurredAt
      meta
    }
  }
`;

/** Create a simple note on the timeline */
export const ADD_LEAD_NOTE = gql`
  mutation AddLeadNote($input: LeadNoteInput!) {
    addLeadNote(input: $input) {
      id
      type
      text
      tags
      occurredAt
      meta
    }
  }
`;

/** Add an extra phone to a lead (returns the full updated list) */
export const ADD_LEAD_PHONE = gql`
  mutation AddLeadPhone($leadId: ID!, $input: LeadPhoneInput!) {
    addLeadPhone(input: $input, leadId: $leadId) { ...LeadPhoneParts }
  }
  ${FRAG_LEAD_PHONE}
`;

/** Update just the biography text */
export const UPDATE_LEAD_BIO = gql`
  mutation UpdateLeadBio($input: UpdateLeadBioInput!) {
    updateLeadBio(input: $input) {
      id
      bioText
      updatedAt
    }
  }
`;

/** Update only the remark/notes field */
export const UPDATE_LEAD_REMARK = gql`
  mutation UpdateLeadRemark($input: UpdateLeadRemarkInput!) {
    updateLeadRemark(input: $input) {
      id
      updatedAt
    }
  }
`;

/** First contact form submission (server persists structured JSON in remark) */
export const RM_FIRST_CONTACT = gql`
  mutation RmFirstContact($input: RmFirstContactInput!) {
    rmFirstContact(input: $input) {
      id
      status
      clientStage
      approachAt
      lastSeenAt
      nextActionDueAt
      lastContactedAt
      updatedAt
    }
  }
`;
