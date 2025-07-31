'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { SearchIcon } from 'lucide-react';
import { parseAsString, useQueryStates } from 'nuqs';
import { useEffect, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useDebounceValue, useMediaQuery } from 'usehooks-ts';
import { GenericComponentErrorBoundary } from '@/components/ErrorBoundary';
import { ShareButton } from '@/components/ShareButton';
import { ViewSwitch } from '@/components/ViewSwitch';
import { TextField } from '@/components/ui/TextField';
import { $api } from '@/util/clientFetch';
import { ProjectFolderFilesGrid } from './ProjectFolderFilesGrid';
import { ProjectFolderFilesSortByMenu } from './ProjectFolderFilesSortByMenu';
import { ProjectFolderFilesTable } from './ProjectFolderFilesTable';
import { ProjectFolderFilesViewEmpty } from './ProjectFolderFilesViewEmpty';

export function ProjectFolderFilesView(props: { readonly folderUuid: string }) {
	const [queryStates, setQueryStates] = useQueryStates({
		sort: parseAsString.withDefault('display_name'),
		view: parseAsString.withDefault('grid'),
		// eslint-disable-next-line id-length
		q: parseAsString.withDefault(''),
	});
	const isMobile = useMediaQuery('(max-width: 600px)', { initializeWithValue: false });
	const [search, setSearch] = useState(queryStates.q);
	const [debouncedSearch, setDebouncedSearch] = useDebounceValue(queryStates.q, 250);

	const { data: datasetsData } = useQuery(
		$api.queryOptions(
			'get',
			'/api/v1/uploads-dataset/',
			{
				params: {
					query: { folder: props.folderUuid, limit: 9_999, ordering: queryStates.sort, search: queryStates.q },
				},
			},
			{
				placeholderData: keepPreviousData,
			},
		),
	);

	const hasResults = datasetsData?.results?.length;

	useEffect(() => {
		// eslint-disable-next-line id-length
		void setQueryStates({ q: debouncedSearch });
	}, [debouncedSearch, setQueryStates]);

	return (
		<ErrorBoundary FallbackComponent={GenericComponentErrorBoundary}>
			<div className="flex place-content-between place-items-center">
				<span className="text-base-neutral-600 dark:text-base-neutral-300">
					Active metadata templates will be applied to files in this folder.
				</span>
				<ShareButton />
			</div>

			<div className="flex place-content-between place-items-center gap-4">
				<div className="flex grow flex-col place-content-between gap-2 md:flex-row md:place-items-center">
					<ProjectFolderFilesSortByMenu isDisabled={!hasResults} />
					<TextField
						aria-label="Search"
						className="md:w-72"
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
				</div>
				<ViewSwitch className="hidden md:flex" isDisabled={!hasResults} />
			</div>

			{hasResults ? (
				queryStates.view === 'grid' || isMobile ? (
					<ProjectFolderFilesGrid data={datasetsData.results} />
				) : (
					<ProjectFolderFilesTable data={datasetsData?.results} />
				)
			) : (
				<ProjectFolderFilesViewEmpty folderUuid={props.folderUuid} />
			)}
		</ErrorBoundary>
	);
}
