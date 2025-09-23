import { gql } from "@apollo/client";

export const LIST_RMS = gql`
  query ListRMs {
    usersByRole(role: RM, status: ACTIVE) {
      id
      name
    }
  }
`;

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

export const HAS_UPSERT_SELF = gql`
  query HasUpsertSelf {
    __type(name: "Mutation") {
      fields {
        name
      }
    }
  }
`;
