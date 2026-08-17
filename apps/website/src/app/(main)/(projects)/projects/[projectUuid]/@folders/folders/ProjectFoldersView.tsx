'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { useMediaQuery } from 'usehooks-ts';
import { ShareButton } from '@/components/ShareButton';
import { MainRouteListFrame } from '@/components/main-route/frame/MainRouteListFrame';
import { ViewSwitch } from '@/components/query-controls/ViewSwitch';
import { useCurrentProjectMembership } from '@/hooks/useCurrentProjectMembership';
import { useUserSettings } from '@/hooks/useUserSettings';
import { $api } from '@/util/clientFetch';
import { getEffectiveListLimit } from '@/util/paginationLimits';
import { resolveViewMode } from '@/util/userSettingsOptions';
import { ProjectFoldersGrid } from './ProjectFoldersGrid';
import { ProjectFoldersSortByMenu } from './ProjectFoldersSortByMenu';
import { ProjectFoldersTable } from './ProjectFoldersTable';
import { ProjectFoldersViewEmpty } from './ProjectFoldersViewEmpty';

export function ProjectFoldersView(props: { readonly limit: number; readonly projectUuid: string }) {
	const { canCreateFolders } = useCurrentProjectMembership(props.projectUuid);
	const { settings } = useUserSettings();
	const defaultViewMode = resolveViewMode(settings.defaultViewMode, settings.foldersViewMode);

	const [queryStates] = useQueryStates({
		page: parseAsInteger.withDefault(1),
		sort: parseAsString.withDefault(settings.foldersSort),
		view: parseAsString.withDefault(defaultViewMode),
	});
	const isMobile = useMediaQuery('(max-width: 600px)', { initializeWithValue: false });
	const isGridLayout = queryStates.view === 'grid' || isMobile;
	const hasLeadingActionItem = canCreateFolders;
	const effectiveLimit = getEffectiveListLimit({ hasLeadingActionItem, isGridLayout });
	const offset = (queryStates.page - 1) * effectiveLimit;

	const { data: foldersData } = useQuery(
		$api.queryOptions(
			'get',
			'/api/v1/folder/',
			{
				params: { query: { project: props.projectUuid, limit: effectiveLimit, offset, ordering: queryStates.sort } },
			},
			{
				placeholderData: keepPreviousData,
			},
		),
	);

	const hasResults = foldersData?.results?.length;

	return (
		<MainRouteListFrame
			controls={
				<div className="flex place-content-between place-items-center">
					<span className="text-base-neutral-600 dark:text-base-neutral-300">
						Manage your research data and apply folder-specific metadata templates.
					</span>
					<div className="flex place-items-center gap-2">
						<ShareButton />
					</div>
				</div>
			}
			empty={<ProjectFoldersViewEmpty projectUuid={props.projectUuid} />}
			hasResults={Boolean(hasResults)}
			layout={isGridLayout ? 'grid' : 'table'}
			list={
				isGridLayout ? (
					<ProjectFoldersGrid data={foldersData?.results ?? []} />
				) : (
					<ProjectFoldersTable data={foldersData?.results ?? []} />
				)
			}
			pagination={
				hasResults
					? {
							count: foldersData?.count ?? 0,
							length: foldersData?.results?.length ?? 0,
							limit: effectiveLimit,
							offset,
						}
					: undefined
			}
			preListContent={
				<div className="flex place-content-between place-items-center">
					<ProjectFoldersSortByMenu defaultSort={settings.foldersSort} isDisabled={!foldersData?.results?.length} />
					<ViewSwitch
						className="hidden md:flex"
						defaultView={defaultViewMode}
						isDisabled={!foldersData?.results?.length}
						resetPageOnChange
					/>
				</div>
			}
		/>
	);
}
