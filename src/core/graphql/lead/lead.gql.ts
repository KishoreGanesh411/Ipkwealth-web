// src/core/graphql/lead/lead.gql.ts
import { gql } from "@apollo/client";

export const LEAD_FIELDS = gql`
  fragment LeadFields on IpkLeaddEntity {
    id
    leadCode
    firstName
    lastName
    name
    phone
    leadSource
    assignedRM
    status
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

// keep existing import naming in your components
export { LEADS_PAGED as LEADS_OPEN };

export const CREATE_LEAD = gql`
  mutation CreateIpkLeadd($input: CreateIpkLeaddInput!) {
    createIpkLeadd(input: $input) { ...LeadFields }
  }
  ${LEAD_FIELDS}
`;

export const ASSIGN_LEAD = gql`
  mutation AssignLead($id: ID!) {
    assignLead(id: $id) { ...LeadFields }
  }
  ${LEAD_FIELDS}
`;

export const ASSIGN_LEADS = gql`
  mutation AssignLeads($ids: [ID!]!) {
    assignLeads(ids: $ids) { ...LeadFields }
  }
  ${LEAD_FIELDS}
`;

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
