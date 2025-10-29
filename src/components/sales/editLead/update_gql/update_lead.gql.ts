import { gql } from "@apollo/client";

export const UPDATE_LEAD_DETAILS = gql`
  mutation UpdateLeadDetails($input: UpdateLeadDetailsInput!) {
    updateLeadDetails(input: $input) {
      id
      name
      location
      gender
      age
      referralCode
      referralName
      occupations {
        profession
        companyName
        designation
        startedAt
        endedAt
      }
      bioText
      updatedAt
    }
  }
`;
