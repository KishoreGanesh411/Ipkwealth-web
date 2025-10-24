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
    clientStage
    createdAt
    # telemetry for dormant view / metrics
    firstSeenAt
    lastSeenAt
    reenterCount
  }
`;

export const LEADS_PAGED = gql`
  query Leads($args: LeadListArgs!) {
    leads(args: $args) {
      items { ...LeadFields }
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
      items { ...LeadFields }
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
  query LeadDetailWithTimeline($id: ID!) {
    lead(id: $id) {
      ...LeadFields
      clientStage
      location
      city
      product
      investmentRange
      sipAmount
      profession
      companyName
      clientTypes
      gender
      designation
      mobile
      phone
      phones {
        number
        isPrimary
        isWhatsapp
      }
      referralName
      referralCode
      remark
      lastContactedAt
      assignedRmDetails {
        id
        name
        email
        phone
      }
    }
    leadEvents(leadId: $id) {
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
  ${LEAD_FIELDS}
`;

export const CREATE_LEAD = gql`
  mutation CreateIpkLeadd($input: CreateIpkLeaddInput!) {
    createIpkLeadd(input: $input) { ...LeadFields }
  }
  ${LEAD_FIELDS}
`;

export const ASSIGN_LEAD = gql`
  mutation AssignLead($id: ID!, $rmId: ID) {
    assignLead(id: $id, rmId: $rmId) { ...LeadFields }
  }
  ${LEAD_FIELDS}
`;

export const ASSIGN_LEADS = gql`
  mutation AssignLeads($ids: [ID!]!) {
    assignLeads(ids: $ids) { ...LeadFields }
  }
  ${LEAD_FIELDS}
`;

export const UPDATE_LEAD_PROGRESS = gql`
  mutation UpdateLeadProgress($id: ID!, $input: UpdateLeadProgressInput!) {
    updateLeadProgress(id: $id, input: $input) {
      id
      status
      clientStage
      remark
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
