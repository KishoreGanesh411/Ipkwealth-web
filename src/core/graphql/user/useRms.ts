import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';

// Flip to true only after you actually implement `users` on the backend.
const HAS_USERS_QUERY = false;

const RMS_QUERY = gql`
  query RmsActive {
    users(where: { role: RM, status: ACTIVE, archived: false }) {
      id
      name
    }
  }
`;

export function useRms() {
  const { data, loading, error } = HAS_USERS_QUERY
    ? useQuery(RMS_QUERY, { fetchPolicy: 'cache-first' })
    : ({ data: undefined, loading: false, error: undefined } as any);

  return {
    rms: (HAS_USERS_QUERY ? data?.users ?? [] : []) as Array<{ id: string; name: string }>,
    loading: HAS_USERS_QUERY ? loading : false,
    error: HAS_USERS_QUERY ? error : undefined,
  };
}
