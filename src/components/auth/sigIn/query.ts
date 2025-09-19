import { gql } from "@apollo/client";

/** Adjust names if your backend differs */
export const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(input: { email: $email, password: $password }) {
      accessToken
      refreshToken
      user {
        id
        name
        email
        role
        status
      }
    }
  }
`;

/** Optional: to refetch current user after login */
export const ME_QUERY = gql`
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
