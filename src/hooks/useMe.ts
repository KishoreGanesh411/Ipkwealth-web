import { useQuery } from "@apollo/client";
import { ME } from "@/core/graphql/user/user.gql";

export function useMe() {
  const { data, loading, error } = useQuery(ME, { fetchPolicy: "cache-first" });
  return { me: data?.me ?? null, loading, error };
}
