'use client';

import { keepPreviousData, useSuspenseQuery } from '@tanstack/react-query';
import { SearchIcon, XCircleIcon } from 'lucide-react';
import { parseAsString, parseAsInteger, useQueryStates } from 'nuqs';
import { useEffect, useState } from 'react';
import { useDebounceValue, useMediaQuery } from 'usehooks-ts';
import {
	BulkEditAssignToFolderButton,
	BulkEditMoreButton,
	BulkEditFilesToolbar,
} from '@/components/BulkEditFilesToolbar';
import { ViewSwitch } from '@/components/query-controls/ViewSwitch';
import { Button } from '@/components/ui/Button';
import { Input, InputGroup } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { TextField } from '@/components/ui/TextField';
import { DraftsUploadDropzone } from '@/components/upload-assistant/DraftsUploadDropzone';
import { useUserSettings } from '@/hooks/useUserSettings';
import { $api } from '@/util/clientFetch';
import { resolveViewMode } from '@/util/userSettingsOptions';
import { DraftsGrid } from './DraftsGrid';
import { DraftsSortByMenu } from './DraftsSortByMenu';
import { DraftsTable } from './DraftsTable';
import { DraftsViewEmpty } from './DraftsViewEmpty';

export function DraftsView(props: { readonly limit: number }) {
	const { settings } = useUserSettings();
	const defaultViewMode = resolveViewMode(settings.defaultViewMode, settings.draftsViewMode);

	const [queryStates, setQueryStates] = useQueryStates({
		page: parseAsInteger.withDefault(1),
		sort: parseAsString.withDefault(settings.draftsSort),
		view: parseAsString.withDefault(defaultViewMode),
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
			<DraftsUploadDropzone className="h-[124px] md:h-[104px]" hidden={!hasResults} showBorderOnMobile={false} />

			<div className="flex place-content-between place-items-center gap-4">
				<div className="flex grow flex-col place-content-between gap-2 md:flex-row md:place-items-center">
					<DraftsSortByMenu defaultSort={settings.draftsSort} isDisabled={!hasResults} />
					<TextField
						aria-label="Search for something"
						className="md:w-72"
						onChange={(value) => {
							setSearch(value);
							setDebouncedSearch(value);
						}}
						value={search}
					>
						<InputGroup>
							<SearchIcon aria-hidden data-slot="icon" size={18} strokeWidth={1.5} />
							<Input aria-label="Search drafts" placeholder="Search for something..." />
							{search ? (
								<Button
									aria-label="Clear search"
									onPress={() => {
										setSearch('');
										setDebouncedSearch('');
									}}
									size="icon"
									variant="unset"
								>
									<XCircleIcon aria-hidden className="size-6 shrink-0 stroke-[1.5]" />
								</Button>
							) : null}
						</InputGroup>
					</TextField>
				</div>
				<ViewSwitch className="hidden md:flex" defaultView={defaultViewMode} isDisabled={!hasResults} />
			</div>

			{hasResults ? (
				<BulkEditFilesToolbar count={datasetsData.count ?? 0}>
					<BulkEditAssignToFolderButton />
					<BulkEditMoreButton />
				</BulkEditFilesToolbar>
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
