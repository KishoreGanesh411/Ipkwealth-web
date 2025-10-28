import { gql } from "@apollo/client";

export const UPDATE_LEAD_DETAILS = gql`
  mutation UpdateLeadDetails($input: UpdateLeadDetailsInput!) {
    updateLeadDetails(input: $input) {
      id
      name
      email
      phone
      location
      gender
      age
      profession
      companyName
      designation
      product
      investmentRange
      sipAmount
      referralCode
      referralName
      bioText
      updatedAt
    }
  }
`;
