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