import { gql } from "@apollo/client";

const SALES_LEAD_LIST_FIELDS = gql`
  fragment SalesLeadListFields on IpkLeaddEntity {
    id
    name
    phone
    clientStage
    stageFilter
    status
    leadSource
    assignedRmId
    assignedRM
    nextActionDueAt
    lastContactedAt
    updatedAt
  }
`;

const SALES_LEAD_DETAIL_FIELDS = gql`
  fragment SalesLeadDetailFields on IpkLeaddEntity {
    id
    name
    phone
    email
    clientStage
    stageFilter
    status
    leadSource
    assignedRmId
    assignedRM
    nextActionDueAt
    lastContactedAt
    updatedAt
    remark {
      at
      by
      byName
      text
    }
    remarks {
      author
      createdAt
      text
    }
    phones {
      id
      number
      label
      isPrimary
      isWhatsapp
      updatedAt
    }
    events {
      id
      type
      occurredAt
      text
      tags
      meta
      prev
      next
    }
  }
`;

export const MY_ASSIGNED_LEADS = gql`
  query MyAssignedLeads($args: LeadListArgs!) {
    myAssignedLeads(args: $args) {
      items {
        ...SalesLeadListFields
      }
      page
      pageSize
      total
    }
  }
  ${SALES_LEAD_LIST_FIELDS}
`;

export const LEAD_DETAIL_WITH_TIMELINE = gql`
  query LeadDetailWithTimeline($leadId: ID!, $eventsLimit: Int) {
    leadDetailWithTimeline(leadId: $leadId, eventsLimit: $eventsLimit) {
      ...SalesLeadDetailFields
    }
  }
  ${SALES_LEAD_DETAIL_FIELDS}
`;

export const CHANGE_STAGE = gql`
  mutation ChangeStage($input: ChangeStageInput!) {
    changeStage(input: $input) {
      ...SalesLeadDetailFields
    }
  }
  ${SALES_LEAD_DETAIL_FIELDS}
`;

export const ADD_LEAD_INTERACTION = gql`
  mutation AddLeadInteraction($input: LeadInteractionInput!) {
    addLeadInteraction(input: $input) {
      id
      type
      occurredAt
      text
      tags
      meta
      prev
      next
    }
  }
`;

export const ADD_LEAD_NOTE = gql`
  mutation AddLeadNote($input: LeadNoteInput!) {
    addLeadNote(input: $input) {
      id
      type
      occurredAt
      text
      tags
      meta
      prev
      next
    }
  }
`;

export const UPDATE_LEAD_REMARK = gql`
  mutation UpdateLeadRemark($input: UpdateLeadRemarkInput!) {
    updateLeadRemark(input: $input) {
      ...SalesLeadDetailFields
    }
  }
  ${SALES_LEAD_DETAIL_FIELDS}
`;
