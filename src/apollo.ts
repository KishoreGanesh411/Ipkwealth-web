import {
    ApolloClient,
    ApolloLink,
    createHttpLink,
    FetchResult,
    InMemoryCache,
    NextLink,
    Observable,
    Operation,
} from '@apollo/client';
import { onError } from '@apollo/client/link/error';

const apolloError = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors)
    graphQLErrors.map(({ message, locations, path }) =>
      console.log(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      )
    );

  if (networkError) console.log(`[Network error]: ${networkError}`);
});

const httpLink = createHttpLink({
  uri: 'http://localhost:3333/graphql',
});
function getForwardOperationLink(
  operation: Operation,
  forward: NextLink
): Observable<
  FetchResult<{ [key: string]: any }, Record<string, any>, Record<string, any>>
> {
  return new Observable((observer) => {
    try {
      const subscriber = {
        next: observer.next.bind(observer),
        error: observer.error.bind(observer),
        complete: observer.complete.bind(observer),
      };

      forward(operation).subscribe(subscriber);
    } catch (error) {
      observer.error(error);
    }
  });
}
const authLink = new ApolloLink((operation, forward) => {
  return getForwardOperationLink(operation, forward);
});

const client = new ApolloClient({
  link: authLink.concat(apolloError).concat(httpLink),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-first',
    },
  },
});

export const clearApolloStore = () => client.clearStore();

export { client };
