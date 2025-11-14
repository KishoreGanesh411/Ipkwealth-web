import { gql } from "@apollo/client";

const MARKETING_LEAD_LIST_FIELDS = gql`
  fragment MarketingLeadListFields on IpkLeaddEntity {
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

export const CREATE_LEAD = gql`
  mutation CreateLead($input: CreateIpkLeaddInput!) {
    createIpkLeadd(input: $input) {
      ...MarketingLeadListFields
    }
  }
  ${MARKETING_LEAD_LIST_FIELDS}
`;

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

export const AUTO_ASSIGN_LEADS_BULK = gql`
  mutation AutoAssignLeadsBulk($input: AssignLeadsBulkInput!) {
    assignLeadsWithMode(input: $input) {
      assigned
      failed
      errors
      items {
        id
        ok
        message
      }
    }
  }
`;

export const MARKETING_LEADS = gql`
  query MarketingLeads($args: LeadListArgs!) {
    leads(args: $args) {
      items {
        ...MarketingLeadListFields
      }
      page
      pageSize
      total
    }
  }
  ${MARKETING_LEAD_LIST_FIELDS}
`;
