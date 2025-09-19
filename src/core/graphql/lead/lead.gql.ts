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

// Keep backward-compat import name if other files still import LEADS_OPEN
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
