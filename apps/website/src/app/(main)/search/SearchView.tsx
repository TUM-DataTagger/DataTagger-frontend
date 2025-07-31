'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { SearchIcon } from 'lucide-react';
import { parseAsString, useQueryStates } from 'nuqs';
import { useEffect, useState } from 'react';
import { useDebounceValue, useMediaQuery } from 'usehooks-ts';
import { ViewSwitch } from '@/components/ViewSwitch';
import { Pagination } from '@/components/ui/Pagination';
import { TextField } from '@/components/ui/TextField';
import { openAPIClient } from '@/util/clientFetch';
import { SearchGrid } from './SearchGrid';
import { SearchTable } from './SearchTable';
import { SearchViewEmpty } from './SearchViewEmpty';

export function SearchView(props: { readonly limit: number; readonly offset: number }) {
	const [queryStates, setQueryStates] = useQueryStates({
		sort: parseAsString.withDefault('display_name'),
		// eslint-disable-next-line id-length
		q: parseAsString.withDefault(''),
		view: parseAsString.withDefault('grid'),
	});
	const isMobile = useMediaQuery('(max-width: 600px)', { initializeWithValue: false });

	const [search, setSearch] = useState(queryStates.q);
	const [debouncedSearch, setDebouncedSearch] = useDebounceValue(queryStates.q, 250);

	const { data } = useQuery({
		queryKey: ['search', { query: queryStates.q, limit: props.limit, offset: props.offset, sort: queryStates.sort }],
		queryFn: async () => {
			const { data } = await openAPIClient.GET('/api/v1/search/global/', {
				params: { query: { term: queryStates.q, limit: 100 } },
			});

			return data ?? null;
		},
		placeholderData: keepPreviousData,
	});

	const hasResults =
		data?.folders?.length || data?.projects?.length || data?.uploads_datasets?.length || data?.uploads_versions?.length;
	const resultCount = Object.entries(data ?? {}).reduce((acc, val) => acc + (val.length || 0), 0);

	useEffect(() => {
		// eslint-disable-next-line id-length
		void setQueryStates({ q: debouncedSearch });
	}, [debouncedSearch, setQueryStates]);

	return (
		<>
			<div className="flex place-content-between place-items-center">
				{/* <SearchSortByMenu isDisabled={!hasResults} /> */}
				<TextField
					className="w-72"
					isClearable
					onChange={(value) => {
						setSearch(value);
						setDebouncedSearch(value);
					}}
					placeholder="Search for something..."
					prefix={<SearchIcon aria-hidden data-slot="icon" size={18} strokeWidth={1.5} />}
					type="text"
					value={search}
				/>
				<ViewSwitch className="hidden md:flex" isDisabled={!hasResults} />
			</div>

			{hasResults ? (
				<Pagination count={resultCount} length={resultCount} limit={props.limit} offset={props.offset} />
			) : null}

			{hasResults ? (
				queryStates.view === 'grid' || isMobile ? (
					<SearchGrid data={data} />
				) : (
					<SearchTable data={data} />
				)
			) : (
				<SearchViewEmpty />
			)}

			{hasResults ? (
				<Pagination count={resultCount} length={resultCount} limit={props.limit} offset={props.offset} />
			) : null}
		</>
	);
}
