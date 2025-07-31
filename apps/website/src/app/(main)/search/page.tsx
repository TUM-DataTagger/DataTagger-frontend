import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query';
import { SearchIcon } from 'lucide-react';
import type { Metadata } from 'next/types';
import { openAPIClient } from '@/util/fetch';
import { SearchView } from './SearchView';

export const metadata: Metadata = {
	title: 'Search',
};

export default async function Page({
	searchParams,
}: {
	readonly searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
	const { q: searchParamsQuery = '', page: searchParamsPage, sort: searchParamsSort } = await searchParams;

	const page = searchParamsPage ? Number(searchParamsPage) : 1;
	const limit = 100;
	const offset = (page - 1) * limit;
	const sort = searchParamsSort ?? '-creation_date';

	const queryClient = new QueryClient();

	await queryClient.prefetchQuery({
		queryKey: ['search', { query: searchParamsQuery, limit, offset, sort }],
		queryFn: async () => {
			const { data } = await openAPIClient.GET('/api/v1/search/global/', {
				params: { query: { term: searchParamsQuery, limit } },
			});

			return data ?? null;
		},
	});

	return (
		<div className="mx-auto flex w-full max-w-[852px] grow flex-col gap-6 px-4 py-12 print:max-w-none">
			<div className="flex flex-col gap-6">
				<div className="flex flex-col gap-4">
					<h1 className="text-base-heading-md flex place-items-center gap-3">
						<SearchIcon aria-hidden size={40} strokeWidth={1} /> Search
					</h1>
				</div>
			</div>
			<div className="border-base-neutral-200 dark:border-base-neutral-600 border-b" />

			<HydrationBoundary state={dehydrate(queryClient)}>
				<SearchView limit={limit} offset={offset} />
			</HydrationBoundary>
		</div>
	);
}
