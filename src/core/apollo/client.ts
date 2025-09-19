// src/core/apollo/client.ts
import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  type NormalizedCacheObject,
} from "@apollo/client";
import type { TypePolicies } from "@apollo/client/cache";

const uri = import.meta.env.VITE_GRAPHQL_URL ?? "http://localhost:3333/graphql";

const httpLink = createHttpLink({
  uri,
  credentials: "include", // send cookies if you use session auth
});

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
    link: httpLink,
    cache: new InMemoryCache({ typePolicies }),
  });
