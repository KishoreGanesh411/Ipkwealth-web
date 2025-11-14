import { gql } from "@apollo/client";

const ADMIN_LEAD_LIST_FIELDS = gql`
  fragment AdminLeadListFields on IpkLeaddEntity {
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

const ADMIN_USER_FIELDS = gql`
  fragment AdminUserFields on UserEntity {
    id
    name
    email
    phone
    role
    status
    archived
    createdAt
    updatedAt
  }
`;

export const ADMIN_LEADS = gql`
  query AdminLeads($args: LeadListArgs!) {
    leads(args: $args) {
      items {
        ...AdminLeadListFields
      }
      page
      pageSize
      total
    }
  }
  ${ADMIN_LEAD_LIST_FIELDS}
`;

export const ADMIN_LEADS_BY_STAGE = gql`
  query AdminLeadsByStage($stage: ClientStage, $args: LeadListArgs) {
    leadsByStage(stage: $stage, args: $args) {
      items {
        ...AdminLeadListFields
      }
      page
      pageSize
      total
    }
  }
  ${ADMIN_LEAD_LIST_FIELDS}
`;

export const LEAD_STAGE_SUMMARY = gql`
  query LeadStageSummary {
    leadStageSummary {
      total
      items {
        stage
        count
      }
    }
  }
`;

export const ASSIGN_LEAD_WITH_MODE = gql`
  mutation AssignLeadWithMode($input: AssignLeadInput!) {
    assignLeadWithMode(input: $input) {
      message
      lead {
        ...AdminLeadListFields
      }
    }
  }
  ${ADMIN_LEAD_LIST_FIELDS}
`;

export const ASSIGN_LEADS_BULK_WITH_MODE = gql`
  mutation AssignLeadsBulkWithMode($input: AssignLeadsBulkInput!) {
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

export const REASSIGN_LEAD = gql`
  mutation ReassignLead($input: ReassignLeadInput!) {
    reassignLead(input: $input) {
      ...AdminLeadListFields
    }
  }
  ${ADMIN_LEAD_LIST_FIELDS}
`;

export const ACTIVE_RMS = gql`
  query ActiveRms {
    activeRms {
      id
      name
      email
      phone
    }
  }
`;

export const ADMIN_USERS = gql`
  query AdminUsers($withLeads: Boolean = false) {
    getUsers(withLeads: $withLeads) {
      ...AdminUserFields
    }
  }
  ${ADMIN_USER_FIELDS}
`;

export const CREATE_USER = gql`
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      success
      message
      user {
        ...AdminUserFields
      }
    }
  }
  ${ADMIN_USER_FIELDS}
`;

export const UPDATE_USER = gql`
  mutation UpdateUser($id: ID!, $input: UpdateUserDto!) {
    updateUser(id: $id, input: $input) {
      ...AdminUserFields
    }
  }
  ${ADMIN_USER_FIELDS}
`;

export const INVITE_RM = gql`
  mutation InviteRm($input: InviteRmInput!) {
    inviteRm(input: $input) {
      success
      message
      starterPassword
      user {
        ...AdminUserFields
      }
    }
  }
  ${ADMIN_USER_FIELDS}
`;

export const MAKE_ADMIN = gql`
  mutation MakeAdmin($id: ID!) {
    makeAdmin(id: $id) {
      ...AdminUserFields
    }
  }
  ${ADMIN_USER_FIELDS}
`;
