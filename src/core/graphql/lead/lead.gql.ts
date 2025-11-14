import { gql } from "@apollo/client";

export const LEAD_FIELDS = gql`
  fragment LeadFields on IpkLeaddEntity {
    id
    leadCode
    firstName
    lastName
    name
    email
    phone
    leadSource
    assignedRM
    assignedRmId
    status
    stageFilter
    clientStage
    createdAt
    lastContactedAt
    firstSeenAt
    lastSeenAt
    reenterCount
    approachAt
    nextActionDueAt
  }
`;
export const LEADS_PAGED = gql`
  query Leads($args: LeadListArgs!) {
    leads(args: $args) {
      items {
        ...LeadFields
      }
      page
      pageSize
      total
    }
  }
  ${LEAD_FIELDS}
`;

export const MY_ASSIGNED_LEADS = gql`
  query MyAssignedLeads($args: LeadListArgs!) {
    myAssignedLeads(args: $args) {
      items {
        ...LeadFields
      }
      page
      pageSize
      total
    }
  }
  ${LEAD_FIELDS}
`;

export const MY_ASSIGNED_LEAD_SUMMARY = gql`
  query MyAssignedLeadSummary {
    myAssignedLeadSummary {
      totalAssigned
      newToday
      inProgress
      hotLeads
      dormant
      closed
      followUpsDueToday
      followUpsOverdue
    }
  }
`;

export const LEAD_DETAIL_WITH_TIMELINE = gql`
  query LeadDetailWithTimeline($id: ID!, $eventsLimit: Int) {
    lead: leadDetailWithTimeline(leadId: $id, eventsLimit: $eventsLimit) {
      ...LeadFields
      # extra profile fields
      location
      product
      investmentRange
      sipAmount
      clientTypes
      gender
      # embedded occupations
      occupations {
        profession
        companyName
        designation
        startedAt
        endedAt
      }
      phones {
        number
        isPrimary
        isWhatsapp
        label
      }
      referralName
      referralCode
      # full remark history (safe: backend field is remarks[])
      remarks {
        text
        author
        createdAt
      }
      history
      # timeline events
      events {
        id
        type
        occurredAt
        text
        tags
        prev
        next
        meta
        authorId
      }
    }
  }
  ${LEAD_FIELDS}
`;

export const CREATE_LEAD = gql`
  mutation CreateIpkLeadd($input: CreateIpkLeaddInput!) {
    createIpkLeadd(input: $input) {
      ...LeadFields
    }
  }
  ${LEAD_FIELDS}
`;


// Use backend's mode-based assignment API for both auto and manual
// Align with current backend schema:
// - Auto-assign a single lead
export const ASSIGN_LEAD = gql`
  mutation AssignLead($id: ID!) {
    assignLead(id: $id) {
      ...LeadFields
    }
  }
  ${LEAD_FIELDS}
`;

// - Manually reassign a lead to a specific RM
export const REASSIGN_LEAD = gql`
  mutation ReassignLead($input: ReassignLeadInput!) {
    reassignLead(input: $input) {
      ...LeadFields
    }
  }
  ${LEAD_FIELDS}
`;

export const ASSIGN_LEADS = gql`
  mutation AssignLeads($ids: [ID!]!) {
    assignLeads(ids: $ids) {
      ...LeadFields
    }
  }
  ${LEAD_FIELDS}
`;


export const UPDATE_LEAD_PROGRESS = gql`
  mutation UpdateLeadProgress($id: ID!, $input: UpdateLeadProgressInput!) {
    updateLeadProgress(id: $id, input: $input) {
      id
      status
      clientStage
      lastContactedAt
      updatedAt
    }
  }
`;

export const CREATE_LEAD_EVENT = gql`
  mutation CreateLeadEvent($input: CreateLeadEventInput!) {
    createLeadEvent(input: $input) {
      id
      type
      occurredAt
      note
      summary
      prevStatus
      nextStatus
      prevStage
      nextStage
      followUpOn
      createdAt
      author {
        id
        name
        initials
        avatarUrl
      }
    }
  }
`;

// keep existing import naming in your components
export { LEADS_PAGED as LEADS_OPEN };

/**
 * If/when your server adds the autoAssign flag,
 * switch this to:
 *
 * mutation CreateLeadsBulk($rows: [BulkLeadRowInput!]!, $autoAssign: Boolean) {
 *   createLeadsBulk(rows: $rows, autoAssign: $autoAssign) { created merged failed errors assigned }
 * }
 */
export const CREATE_LEADS_BULK = gql`
  mutation CreateLeadsBulk($rows: [BulkLeadRowInput!]!) {
    createLeadsBulk(rows: $rows) {
      created
      merged
      failed
      errors
    }
  }
`;
