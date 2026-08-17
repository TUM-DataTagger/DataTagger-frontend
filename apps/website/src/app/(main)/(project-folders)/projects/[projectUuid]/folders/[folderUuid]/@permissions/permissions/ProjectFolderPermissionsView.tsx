'use client';

import { keepPreviousData, useSuspenseQuery } from '@tanstack/react-query';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { useMediaQuery } from 'usehooks-ts';
import { ShareButton } from '@/components/ShareButton';
import { MainRouteListFrame } from '@/components/main-route/frame/MainRouteListFrame';
import { ViewSwitch } from '@/components/query-controls/ViewSwitch';
import { useUserSettings } from '@/hooks/useUserSettings';
import { $api } from '@/util/clientFetch';
import { ProjectFolderPermissionsGrid } from './ProjectFolderPermissionsGrid';
import { ProjectFolderPermissionsMenu } from './ProjectFolderPermissionsMenu';
import { ProjectFolderPermissionsTable } from './ProjectFolderPermissionsTable';

export function ProjectFolderPermissionsView(props: {
	readonly folderUuid: string;
	readonly limit: number;
	readonly projectUuid: string;
}) {
	const { settings } = useUserSettings();

	const [queryStates] = useQueryStates({
		page: parseAsInteger.withDefault(1),
		view: parseAsString.withDefault(settings.defaultViewMode ?? 'grid'),
	});
	const isMobile = useMediaQuery('(max-width: 600px)', { initializeWithValue: false });

	const offset = (queryStates.page - 1) * props.limit;

	const { data } = useSuspenseQuery(
		$api.queryOptions(
			'get',
			'/api/v1/folder-permission/',
			{
				params: {
					query: { folder: props.folderUuid, ordering: '-is_folder_admin,-can_edit,project_membership__member__email' },
				},
			},
			{
				placeholderData: keepPreviousData,
			},
		),
	);

	// Client-side pagination until backend supports limit/offset
	const paginatedData = data?.slice(offset, offset + props.limit) ?? [];
	const totalCount = data?.length ?? 0;

	const hasResults = paginatedData.length;

	return (
		<MainRouteListFrame
			controls={
				<div className="flex place-content-end place-items-center gap-2">
					<ShareButton />
					<ProjectFolderPermissionsMenu folderUuid={props.folderUuid} projectUuid={props.projectUuid} />
					<ViewSwitch className="hidden md:flex" defaultView={settings.defaultViewMode} isDisabled={!totalCount} />
				</div>
			}
			hasResults={Boolean(hasResults)}
			layout={queryStates.view === 'grid' || isMobile ? 'grid' : 'table'}
			list={
				queryStates.view === 'grid' || isMobile ? (
					<ProjectFolderPermissionsGrid data={paginatedData} />
				) : (
					<ProjectFolderPermissionsTable data={paginatedData} />
				)
			}
			pagination={
				totalCount
					? {
							count: totalCount,
							length: paginatedData.length,
							limit: props.limit,
							offset,
						}
					: undefined
			}
		/>
	);
}
