import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import type { Metadata } from 'next/types';
import { openAPIClient } from '@/util/fetch';
import { getQueryClient } from '@/util/getQueryClient';
import { getSearchSchemaQueryKey, isSearchSchemaResponse } from '@/util/globalSearch';
import { SearchView } from './SearchView';
import { normalizeSearchLimit } from './searchLimit';
import {
	buildSearchRouteRequest,
	getResolvedSearchResultTypes,
	getSearchRouteResultsQueryKey,
	hasSearchRouteCriteria,
} from './searchRouteCriteria';

export const metadata: Metadata = {
	title: 'Search',
};

export default async function Page({
	searchParams,
}: {
	readonly searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
	const {
		created_by: searchParamsCreatedBy,
		limit: searchParamsLimit,
		my_permissions: searchParamsMyPermissions,
		q: searchParamsQuery = '',
		sort: searchParamsSort,
		source: searchParamsSource,
	} = await searchParams;
	const limit = normalizeSearchLimit(searchParamsLimit);
	const queryClient = getQueryClient();

	const { data: searchSchemaData } = await openAPIClient.GET('/api/v1/search/global/schema/');
	if (isSearchSchemaResponse(searchSchemaData)) {
		queryClient.setQueryData(getSearchSchemaQueryKey(), searchSchemaData);
		const selectedTypes = getResolvedSearchResultTypes(searchParamsSource, searchSchemaData);

		if (
			hasSearchRouteCriteria({
				createdByParam: searchParamsCreatedBy,
				filters: [],
				myPermissionsParam: searchParamsMyPermissions,
				searchText: searchParamsQuery,
				sourceParam: searchParamsSource,
			})
		) {
			await queryClient.prefetchQuery({
				queryKey: getSearchRouteResultsQueryKey({
					createdByParam: searchParamsCreatedBy,
					filtersParam: null,
					limit,
					myPermissionsParam: searchParamsMyPermissions,
					responseMode: 'full',
					schema: searchSchemaData,
					searchText: searchParamsQuery,
					selectedTypes,
					sortParam: searchParamsSort,
					sourceParam: searchParamsSource,
				}),
				queryFn: async () => {
					const { data } = await openAPIClient.POST('/api/v1/search/global/', {
						body: buildSearchRouteRequest({
							createdByParam: searchParamsCreatedBy,
							filters: [],
							limit,
							myPermissionsParam: searchParamsMyPermissions,
							responseMode: 'full',
							schema: searchSchemaData,
							searchText: searchParamsQuery,
							selectedTypes,
							sortParam: searchParamsSort,
							sourceParam: searchParamsSource,
						}),
					});

					return data ?? null;
				},
			});
		}
	}

	return (
		<div className="mx-auto flex w-full max-w-[848px] grow flex-col px-4 py-8 print:max-w-none">
			<h1 className="sr-only">Search</h1>

			<HydrationBoundary state={dehydrate(queryClient)}>
				<SearchView initialSchema={isSearchSchemaResponse(searchSchemaData) ? searchSchemaData : undefined} />
			</HydrationBoundary>
		</div>
	);
}
