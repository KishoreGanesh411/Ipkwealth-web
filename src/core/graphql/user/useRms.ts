import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';

/**
 * Query active RMs from backend.
 * Backend schema exposes `activeRms: [UserLiteModel!]!`.
 * Accept an `enabled` flag to skip the query for non-admins to avoid 400s.
 */
const RMS_QUERY = gql`
  query ActiveRms {
    activeRms {
      id
      name
      email
      phone
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
  const { data, loading, error } = useQuery<{ activeRms: RmNode[] }>(RMS_QUERY, {
    fetchPolicy: 'cache-first',
    skip: !enabled,
  });

  return {
    rms: (enabled ? data?.activeRms ?? [] : []) as Array<{ id: string; name: string }>,
    loading: enabled ? loading : false,
    error: enabled ? error : undefined,
  };
}
