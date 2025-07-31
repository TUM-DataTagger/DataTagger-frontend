import { isServer, QueryClient, defaultShouldDehydrateQuery } from '@tanstack/react-query';

export function makeQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: 60 * 1_000,
			},
			dehydrate: {
				shouldDehydrateQuery: (query) => defaultShouldDehydrateQuery(query) || query.state.status === 'pending',
				shouldRedactErrors: () => false,
			},
		},
	});
}

let browserQueryClient: QueryClient | undefined;

export function getQueryClient() {
	if (isServer) {
		return makeQueryClient();
	} else {
		browserQueryClient ??= makeQueryClient();

		return browserQueryClient;
	}
}
