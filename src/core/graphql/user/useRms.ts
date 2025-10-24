import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';

// Flip to true only after you actually implement `users` on the backend.
const HAS_USERS_QUERY = true;

const RMS_QUERY = gql`
  query RmsActive {
    users(where: { role: RM, status: ACTIVE, archived: false }) {
      id
      name
    }
  }
`;

type RmNode = {
  id: string;
  name: string;
};

export function useRms() {
  const { data, loading, error } = useQuery<{ users: RmNode[] }>(RMS_QUERY, {
    fetchPolicy: 'cache-first',
    skip: !HAS_USERS_QUERY,
  });

  return {
    rms: (HAS_USERS_QUERY ? data?.users ?? [] : []) as Array<{ id: string; name: string }>,
    loading: HAS_USERS_QUERY ? loading : false,
    error: HAS_USERS_QUERY ? error : undefined,
  };
}
