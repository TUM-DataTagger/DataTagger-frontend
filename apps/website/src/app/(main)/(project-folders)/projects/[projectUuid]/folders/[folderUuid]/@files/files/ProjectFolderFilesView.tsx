'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { SearchIcon, XCircleIcon } from 'lucide-react';
import { parseAsArrayOf, parseAsBoolean, parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { useEffect, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useDebounceValue, useMediaQuery } from 'usehooks-ts';
import {
	BulkEditFilesToolbar,
	BulkEditFillInTemplateFieldsButton,
	BulkEditMoreButton,
} from '@/components/BulkEditFilesToolbar';
import { GenericComponentErrorBoundary } from '@/components/ErrorBoundary';
import { ShareButton } from '@/components/ShareButton';
import { ExperimentLinks } from '@/components/elabftw/ExperimentLinks';
import { ViewSwitch } from '@/components/query-controls/ViewSwitch';
import { Button } from '@/components/ui/Button';
import { Input, InputGroup } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { TextField } from '@/components/ui/TextField';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useUserSettings } from '@/hooks/useUserSettings';
import { $api } from '@/util/clientFetch';
import { getEffectiveListLimit } from '@/util/paginationLimits';
import { resolveViewMode } from '@/util/userSettingsOptions';
import { ProjectFolderFilesGrid } from './ProjectFolderFilesGrid';
import { ProjectFolderFilesSortByMenu } from './ProjectFolderFilesSortByMenu';
import { ProjectFolderFilesTable } from './ProjectFolderFilesTable';
import { ProjectFolderFilesViewEmpty } from './ProjectFolderFilesViewEmpty';
import { ProjectFolderSubfolders } from './ProjectFolderSubfolders';
import { SubfolderMetadata } from './SubfolderMetadata';
import { getSubfolderDatasetQuery } from './subfolderQuery';
import { useCurrentSubfolder } from './useCurrentSubfolder';

export function ProjectFolderFilesView(props: { readonly folderUuid: string; readonly limit: number }) {
	const { currentUserData } = useCurrentUser();
	const { settings } = useUserSettings();
	const defaultViewMode = resolveViewMode(settings.defaultViewMode, settings.filesViewMode);

	const [queryStates, setQueryStates] = useQueryStates({
		page: parseAsInteger.withDefault(1),
		sort: parseAsString.withDefault(settings.filesSort),
		view: parseAsString.withDefault(defaultViewMode),
		bulk_edit: parseAsBoolean.withDefault(false),
		selected: parseAsArrayOf(parseAsString).withDefault([]),
		q: parseAsString.withDefault(''),
	});
	const [currentSubfolder] = useCurrentSubfolder();
	const isMobile = useMediaQuery('(max-width: 600px)', { initializeWithValue: false });
	const isGridLayout = queryStates.view === 'grid' || isMobile;
	const [search, setSearch] = useState(queryStates.q);
	const [debouncedSearch, setDebouncedSearch] = useDebounceValue(queryStates.q, 250);

	const { data: folderPermissionData, isFetched: isPermissionFetched } = useQuery(
		$api.queryOptions(
			'get',
			'/api/v1/folder-permission/',
			{
				params: { query: { folder: props.folderUuid, project_membership__member: currentUserData?.pk ?? -1 } },
			},
			{ enabled: Boolean(currentUserData?.pk) },
		),
	);

	const canUploadFiles = Boolean(folderPermissionData?.[0]?.is_folder_admin || folderPermissionData?.[0]?.can_edit);
	const effectiveLimit = getEffectiveListLimit({ hasLeadingActionItem: canUploadFiles, isGridLayout });
	const offset = (queryStates.page - 1) * effectiveLimit;

	const { data: datasetsData } = useQuery(
		$api.queryOptions(
			'get',
			'/api/v1/uploads-dataset/',
			{
				params: {
					query: {
						folder: props.folderUuid,
						limit: effectiveLimit,
						offset,
						ordering: queryStates.sort,
						search: queryStates.q,
						...getSubfolderDatasetQuery(currentSubfolder, queryStates.q),
					},
				},
			},
			{
				placeholderData: keepPreviousData,
			},
		),
	);
	const hasResults = datasetsData?.results?.length;
	const canBulkEdit = canUploadFiles;

	useEffect(() => {
		void setQueryStates({ q: debouncedSearch });
	}, [debouncedSearch, setQueryStates]);

	useEffect(() => {
		if (isPermissionFetched && !canBulkEdit && (queryStates.bulk_edit || queryStates.selected.length > 0)) {
			void setQueryStates({
				bulk_edit: false,
				selected: [],
			});
		}
	}, [isPermissionFetched, canBulkEdit, queryStates.bulk_edit, queryStates.selected.length, setQueryStates]);

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
					<ProjectFolderFilesSortByMenu defaultSort={settings.filesSort} isDisabled={!hasResults} />
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
							<Input aria-label="Search files in folder" placeholder="Search for something..." />
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
				<ViewSwitch
					className="hidden md:flex"
					defaultView={defaultViewMode}
					isDisabled={!hasResults}
					resetPageOnChange
				/>
			</div>

			{queryStates.q ? null : (
				<ExperimentLinks
					canEdit={canUploadFiles}
					key={`experiment-links-${currentSubfolder ?? props.folderUuid}`}
					targetId={currentSubfolder ?? props.folderUuid}
					targetType={currentSubfolder ? 'subfolder' : 'folder'}
				/>
			)}

			{queryStates.q || !currentSubfolder ? null : (
				<SubfolderMetadata
					canEdit={canUploadFiles}
					key={`subfolder-metadata-${currentSubfolder}`}
					subfolderUuid={currentSubfolder}
				/>
			)}

			{queryStates.q ? null : <ProjectFolderSubfolders canManage={canUploadFiles} folderUuid={props.folderUuid} />}

			{hasResults ? (
				<BulkEditFilesToolbar count={datasetsData?.count ?? 0} isDisabled={!canBulkEdit}>
					<BulkEditFillInTemplateFieldsButton folderUuid={props.folderUuid} isDisabled={!canBulkEdit} />
					<BulkEditMoreButton folderUuid={props.folderUuid} isDisabled={!canBulkEdit} />
				</BulkEditFilesToolbar>
			) : null}

			{hasResults ? (
				<Pagination
					count={datasetsData?.count ?? 0}
					length={datasetsData?.results?.length ?? 0}
					limit={effectiveLimit}
					offset={offset}
				/>
			) : null}

			{hasResults ? (
				queryStates.view === 'grid' || isMobile ? (
					<ProjectFolderFilesGrid canBulkEdit={canBulkEdit} data={datasetsData.results} />
				) : (
					<ProjectFolderFilesTable canBulkEdit={canBulkEdit} data={datasetsData?.results} />
				)
			) : (
				<ProjectFolderFilesViewEmpty folderUuid={props.folderUuid} />
			)}

			{hasResults ? (
				<Pagination
					count={datasetsData?.count ?? 0}
					length={datasetsData?.results?.length ?? 0}
					limit={effectiveLimit}
					offset={offset}
				/>
			) : null}
		</ErrorBoundary>
	);
}
