import {
  ApolloClient,
  ApolloLink,
  createHttpLink,
  FetchResult,
  InMemoryCache,
  NextLink,
  Observable,
  Operation,
  from,
  fromPromise,
} from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import { setContext } from '@apollo/client/link/context';

const apolloError = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors)
    graphQLErrors.map(({ message, locations, path }) =>
      console.log(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      )
    );

  if (networkError) console.log(`[Network error]: ${networkError}`);
});

const httpLink = createHttpLink({ uri: 'http://localhost:3333/graphql' });

async function getToken(forceRefresh = false): Promise<string | null> {
  try {
    const { getAuth, signOut } = await import('firebase/auth');
    const auth = getAuth();
    const u = auth.currentUser;
    if (!u) return null;
    return await u.getIdToken(forceRefresh);
  } catch {
    return null;
  }
}

// Attach a fresh ID token to every request (SDK refreshes as needed)
const authLink = setContext(async (_, { headers }) => {
  const t = await getToken(false);
  return {
    headers: {
      ...(headers || {}),
      ...(t ? { Authorization: `Bearer ${t}` } : {}),
    },
  };
});

// On expired token, refresh once and retry; on revoked/invalid, sign out
const refreshOnExpiredLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  // extract a friendly message the backend returns
  const gqlMsg = graphQLErrors && graphQLErrors.length > 0 ? graphQLErrors[0].message : undefined;
  // many servers surface auth failures as network 401 errors
  const net: any = networkError as any;
  const netStatus = net?.statusCode ?? net?.response?.status;
  const netMsg = net?.result?.message || net?.message || undefined;
  const msg = gqlMsg || netMsg;

  // Helper to retry with a forced fresh token
  const doRetry = () =>
    fromPromise(
      (async () => {
        const fresh = await getToken(true);
        if (!fresh) return null;
        operation.setContext(({ headers = {} }) => ({
          headers: { ...headers, Authorization: `Bearer ${fresh}` },
        }));
        return fresh;
      })(),
    ).flatMap((t) => (t ? forward(operation) : Observable.of(undefined)));

  if (netStatus === 401 || msg) {
    if (msg === 'ID_TOKEN_EXPIRED') {
      return doRetry() as unknown as Observable<FetchResult>;
    }
    if (msg === 'ID_TOKEN_REVOKED' || msg === 'INVALID_ID_TOKEN') {
      (async () => {
        try {
          const { getAuth, signOut } = await import('firebase/auth');
          await signOut(getAuth());
        } catch {}
      })();
      // do not retry
      return;
    }
  }
  });

const client = new ApolloClient({
  link: from([refreshOnExpiredLink, authLink, apolloError, httpLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-first',
    },
  },
});

export const clearApolloStore = () => client.clearStore();

export { client };
