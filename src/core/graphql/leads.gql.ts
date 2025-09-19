import { gql } from "@apollo/client";

export const LEADS_QUERY = gql`
  query Leads {
    leads {
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
      clientTypes
      remark
      leadSource
      referralName
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_LEAD = gql`
  mutation CreateLead($input: CreateLeadInput!) {
    createLead(input: $input) {
      id
      name
      email
      phone
      leadSource
      referralName
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_LEAD = gql`
  mutation UpdateLead($id: ID!, $input: UpdateLeadInput!) {
    updateLead(id: $id, input: $input) {
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
      clientTypes
      remark
      leadSource
      referralName
      updatedAt
    }
  }
`;

export const DELETE_LEAD = gql`
  mutation DeleteLead($id: ID!) {
    deleteLead(id: $id)
  }
`;
