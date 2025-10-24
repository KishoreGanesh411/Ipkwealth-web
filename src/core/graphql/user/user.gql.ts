import { gql } from "@apollo/client";

// Shared
export const USER_FIELDS = gql`
  fragment UserFields on UserEntity {
    id
    name
    email
    role
    status
    phone
    archived
  }
`;

// Me (kept for context)
export const ME = gql`
  query Me {
    me {
      id
      name
      email
      role
      status
    }
  }
`;

// Lists
export const GET_USERS = gql`
  query GetUsers($withLeads: Boolean! = false) {
    getUsers(withLeads: $withLeads) { ...UserFields }
  }
  ${USER_FIELDS}
`;

export const GET_ACTIVE_USERS = gql`
  query GetActiveUsers {
    getActiveUsers { ...UserFields }
  }
  ${USER_FIELDS}
`;

// Mutations
export const CREATE_USER = gql`
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      success
      message
      user { ...UserFields }
    }
  }
  ${USER_FIELDS}
`;

export const UPDATE_USER = gql`
  mutation UpdateUser($id: ID!, $input: UpdateUserDto!) {
    updateUser(id: $id, input: $input) { ...UserFields }
  }
  ${USER_FIELDS}
`;

export const REMOVE_USER = gql`
  mutation RemoveUser($id: ID!) {
    removeUser(id: $id) { id }
  }
`;

// Back-compat helpers: optionally create self record if supported
export const HAS_UPSERT_SELF = gql`
  query HasUpsertSelf {
    __type(name: "Mutation") {
      fields { name }
    }
  }
`;

export const UPSERT_SELF = gql`
  mutation UpsertSelf {
    upsertSelf {
      id
      email
      name
      role
    }
  }
`;
