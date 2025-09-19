import { gql } from "@apollo/client";

/** Create a Lead (basic details from LeadForm) */
export const CREATE_LEAD = gql`
  mutation CreateLead($input: CreateLeadInput!) {
    createLead(input: $input) {
      id
      leadCode
      firstName
      lastName
      email
      phone
      leadSource
      referralName
      createdAt
    }
  }
`;

/** Upsert / save Additional Details tied to a leadId (leadCode) */
export const UPSERT_ADDITIONAL_DETAILS = gql`
  mutation UpsertAdditionalDetails($input: UpsertAdditionalDetailsInput!) {
    upsertAdditionalDetails(input: $input) {
      id
      leadId
      location
      gender
      age
      profession
      companyName
      designation
      product
      investmentRange
      sipAmount
      clientTypes
      remark
      updatedAt
    }
  }
`;

/** Optionally: get one lead by code if you need to prefill extra form */
export const GET_LEAD_BY_CODE = gql`
  query GetLeadByCode($leadCode: String!) {
    leadByCode(leadCode: $leadCode) {
      id
      leadCode
      firstName
      lastName
      email
      phone
      leadSource
      referralName
      createdAt
    }
  }
`;
