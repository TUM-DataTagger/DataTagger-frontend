'use client';

import { keepPreviousData, useSuspenseQuery } from '@tanstack/react-query';
import { FilePlusIcon, SearchIcon } from 'lucide-react';
import { parseAsString, parseAsInteger, useQueryStates } from 'nuqs';
import { useEffect, useState } from 'react';
import { useDebounceValue, useMediaQuery } from 'usehooks-ts';
import { BulkEditAssignToFolderButton, BulkEditMoreButton, BulkEditToolbar } from '@/components/BulkEditToolbar';
import { UploadTrigger } from '@/components/UploadTrigger';
import { ViewSwitch } from '@/components/ViewSwitch';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { TextField } from '@/components/ui/TextField';
import { cx } from '@/styles/cva';
import { $api } from '@/util/clientFetch';
import { DraftsGrid } from './DraftsGrid';
import { DraftsSortByMenu } from './DraftsSortByMenu';
import { DraftsTable } from './DraftsTable';
import { DraftsViewEmpty } from './DraftsViewEmpty';

export function DraftsView(props: { readonly limit: number }) {
	const [queryStates, setQueryStates] = useQueryStates({
		page: parseAsInteger.withDefault(1),
		sort: parseAsString.withDefault('-creation_date'),
		view: parseAsString.withDefault('grid'),
		// eslint-disable-next-line id-length
		q: parseAsString.withDefault(''),
	});
	const isMobile = useMediaQuery('(max-width: 600px)', { initializeWithValue: false });
	const [search, setSearch] = useState(queryStates.q);
	const [debouncedSearch, setDebouncedSearch] = useDebounceValue(queryStates.q, 250);

	const offset = (queryStates.page - 1) * props.limit;

	const { data: datasetsData } = useSuspenseQuery(
		$api.queryOptions(
			'get',
			'/api/v1/uploads-dataset/',
			{
				params: { query: { limit: props.limit, offset, ordering: queryStates.sort, search: queryStates.q } },
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
		<>
			<div
				className={cx(
					'flex h-[124px] flex-col place-content-center rounded-xl p-px md:h-[104px] print:hidden',
					!isMobile && 'global-dropzone-border',
					!hasResults && 'hidden',
				)}
			>
				<div className="bg-base-lavender-100/64 text-base-lavender-600 dark:bg-base-lavender-800/64 dark:text-base-lavender-200 h-full w-full place-content-center place-items-center rounded-xl text-center">
					<div className="flex flex-col gap-3">
						{isMobile ? (
							<div className="flex flex-col place-content-center place-items-center gap-4">
								<span>Select files for use within the tool.</span>
								<UploadTrigger>
									<Button variant="filled">
										<FilePlusIcon aria-hidden size={18} strokeWidth={1.5} />
										Upload files
									</Button>
								</UploadTrigger>
							</div>
						) : (
							<div className="flex flex-col place-content-center place-items-center gap-2">
								<span>Drag and drop files to upload them or</span>
								<UploadTrigger>
									<Button isDark size="sm" variant="filled">
										Select files
									</Button>
								</UploadTrigger>
							</div>
						)}
					</div>
				</div>
			</div>

			<div className="flex place-content-between place-items-center gap-4">
				<div className="flex grow flex-col place-content-between gap-2 md:flex-row md:place-items-center">
					<DraftsSortByMenu isDisabled={!hasResults} />
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
				<BulkEditToolbar count={datasetsData.count ?? 0}>
					<BulkEditAssignToFolderButton />
					<BulkEditMoreButton />
				</BulkEditToolbar>
			) : null}

			{hasResults ? (
				<Pagination
					count={datasetsData.count ?? 0}
					length={datasetsData.results!.length}
					limit={props.limit}
					offset={offset}
				/>
			) : null}

			{hasResults ? (
				queryStates.view === 'grid' || isMobile ? (
					<DraftsGrid data={datasetsData.results} />
				) : (
					<DraftsTable data={datasetsData.results} />
				)
			) : (
				<DraftsViewEmpty />
			)}

			{hasResults ? (
				<Pagination
					count={datasetsData.count ?? 0}
					length={datasetsData.results!.length}
					limit={props.limit}
					offset={offset}
				/>
			) : null}
		</>
	);
}
