import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
  ApolloLink,
  from,
  DefaultOptions,
} from "@apollo/client";
import { onError } from "@apollo/client/link/error";

const API_URL = import.meta.env.VITE_GRAPHQL_URL ?? "http://localhost:3333/graphql";

const httpLink = new HttpLink({ uri: API_URL });

/** Attach Authorization header from storage */
const authLink = new ApolloLink((operation, forward) => {
  const token =
    localStorage.getItem("ipk_token") ?? sessionStorage.getItem("ipk_token");
  operation.setContext(({ headers = {} }) => ({
    headers: { ...headers, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  }));
  return forward(operation);
});

/** Log GraphQL/network errors (optional) */
const errorLink = onError(({ graphQLErrors, networkError, operation }) => {
  if (graphQLErrors) {
    for (const err of graphQLErrors) {
      console.log(`[GraphQL error] ${operation.operationName ?? ""}`, {
        message: err.message,
        path: err.path,
        code: err.extensions?.code,
      });
    }
  }
  if (networkError) console.log("[Network error]", networkError);
});

const link = from([errorLink, authLink, httpLink]);

const cache = new InMemoryCache();

const defaultOptions: DefaultOptions = {
  watchQuery: { fetchPolicy: "cache-and-network", errorPolicy: "all" },
  query: { fetchPolicy: "network-only", errorPolicy: "all" },
  mutate: { errorPolicy: "all" },
};

export const apolloClient = new ApolloClient({
  link,
  cache,
  defaultOptions,
});

export const clearApolloStore = () => apolloClient.clearStore();
export default apolloClient;