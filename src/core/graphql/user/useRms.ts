import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';

/**
 * Query active users and filter to role RM.
 * Matches backend schema: getActiveUsers: [UserEntity!]!
 * Accept an `enabled` flag to skip the query for non-admins to avoid 400s.
 */
const RMS_QUERY = gql`
  query GetActiveUsers {
    getActiveUsers {
      id
      name
      email
      phone
      role
    }
  }
`;

type RmNode = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
};

export function useRms(enabled: boolean = true) {
  const { data, loading, error } = useQuery<{ getActiveUsers: Array<RmNode & { role?: string }> }>(RMS_QUERY, {
    fetchPolicy: 'cache-first',
    skip: !enabled,
  });

  const rms = enabled
    ? (data?.getActiveUsers ?? []).filter((u) => (u.role ?? '').toUpperCase() === 'RM')
    : [];

  return {
    rms: rms.map((u) => ({ id: u.id, name: u.name })),
    loading: enabled ? loading : false,
    error: enabled ? error : undefined,
  };
}
