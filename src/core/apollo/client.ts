import { setContext } from "@apollo/client/link/context";
import { auth } from "@/core/firebase/firebaseInit";// src/core/apollo/client.ts
import {
  ApolloClient,
  InMemoryCache,
  createHttpLink, ApolloLink, type NormalizedCacheObject,
} from "@apollo/client";
import type { TypePolicies } from "@apollo/client/cache";

const uri = import.meta.env.VITE_GRAPHQL_URL ?? "http://localhost:3333/graphql";

const httpLink = createHttpLink({ uri });

// Type-safe cache policies: no `any`, no custom keyFields function needed.
const typePolicies: TypePolicies = {
  Query: {
    fields: {
      // Paged field: always replace the whole page and key by args so each
      // page/search/mode variant is distinct in cache.
      leads: {
        keyArgs: ["args"],
        merge(_existing, incoming) {
          return incoming;
        },
      },
    },
  },
  // Your GraphQL returns `id` (see LEAD_FIELDS fragment), so just use it.
  IpkLeaddEntity: {
    keyFields: ["id"],
  },
};

export const apolloClient: ApolloClient<NormalizedCacheObject> =
  new ApolloClient({
  link: setContext(async (_, { headers }) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      return { headers: { ...headers, Authorization: token ? `Bearer ${token}` : "" } };
    } catch { return { headers }; }
  }).concat(httpLink),
  cache: new InMemoryCache({ typePolicies }),
});

