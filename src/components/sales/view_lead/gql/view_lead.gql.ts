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

    gender
    age
    location
    profession
    companyName
    designation

    product
    investmentRange
    sipAmount

    status
    clientStage
    archived

    remark
    bioText
    clientTypes
    clientQa { question answer }

    createdAt
    updatedAt
    firstSeenAt
    lastSeenAt
    approachAt
    reenterCount

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
