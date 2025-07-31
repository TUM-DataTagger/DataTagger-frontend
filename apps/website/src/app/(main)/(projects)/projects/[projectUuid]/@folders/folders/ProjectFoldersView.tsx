'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { parseAsString, useQueryStates } from 'nuqs';
import { ErrorBoundary } from 'react-error-boundary';
import { useMediaQuery } from 'usehooks-ts';
import { GenericComponentErrorBoundary } from '@/components/ErrorBoundary';
import { ShareButton } from '@/components/ShareButton';
import { ViewSwitch } from '@/components/ViewSwitch';
import { $api } from '@/util/clientFetch';
import { ProjectFoldersGrid } from './ProjectFoldersGrid';
import { ProjectFoldersSortByMenu } from './ProjectFoldersSortByMenu';
import { ProjectFoldersTable } from './ProjectFoldersTable';
import { ProjectFoldersViewEmpty } from './ProjectFoldersViewEmpty';

export function ProjectFoldersView(props: { readonly projectUuid: string }) {
	const [queryStates] = useQueryStates({
		sort: parseAsString.withDefault('name'),
		view: parseAsString.withDefault('grid'),
	});
	const isMobile = useMediaQuery('(max-width: 600px)', { initializeWithValue: false });

	const { data: foldersData } = useQuery(
		$api.queryOptions(
			'get',
			'/api/v1/folder/',
			{
				params: { query: { project: props.projectUuid, limit: 9_999, ordering: queryStates.sort } },
			},
			{
				placeholderData: keepPreviousData,
			},
		),
	);

	const hasResults = foldersData?.results?.length;

	return (
		<ErrorBoundary FallbackComponent={GenericComponentErrorBoundary}>
			<div className="flex place-content-between place-items-center">
				<span className="text-base-neutral-600 dark:text-base-neutral-300">
					Manage your research data and apply folder-specific metadata templates.
				</span>
				<div className="flex place-items-center gap-2">
					<ShareButton />
				</div>
			</div>

			<div className="flex place-content-between place-items-center">
				<ProjectFoldersSortByMenu isDisabled={!foldersData?.results?.length} />
				<ViewSwitch className="hidden md:flex" isDisabled={!foldersData?.results?.length} />
			</div>

			{hasResults ? (
				queryStates.view === 'grid' || isMobile ? (
					<ProjectFoldersGrid data={foldersData.results} />
				) : (
					<ProjectFoldersTable data={foldersData.results} />
				)
			) : (
				<ProjectFoldersViewEmpty projectUuid={props.projectUuid} />
			)}
		</ErrorBoundary>
	);
}
