import { gql } from "@apollo/client";

export const GENERATE_PASSWORD_RESET_LINK = gql`
  mutation GeneratePasswordResetLink($email: String!) {
    generatePasswordResetLink(email: $email)
  }
`;

