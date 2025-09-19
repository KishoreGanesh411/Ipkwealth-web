    import { gql } from "@apollo/client";

    export const LIST_RMS = gql`
    query ListRMs {
        usersByRole(role: RM, status: ACTIVE) {
        id
        name
        }
    }
    `;
