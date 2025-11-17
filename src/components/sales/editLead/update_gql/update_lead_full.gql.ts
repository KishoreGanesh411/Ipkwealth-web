import { gql } from "@apollo/client";

export const UPDATE_LEAD_DETAILS_FULL = gql`
  mutation UpdateLeadDetailsFull($input: UpdateLeadDetailsInput!) {
    updateLeadDetails(input: $input) {
      id
      name
      firstName
      lastName
      email
      location
      gender
      age
      leadSource
      referralCode
      referralName
      stageFilter
      status
      occupations {
        profession
        companyName
        designation
        startedAt
        endedAt
      }
      bioText
      product
      investmentRange
      sipAmount
      updatedAt
    }
  }
`;
