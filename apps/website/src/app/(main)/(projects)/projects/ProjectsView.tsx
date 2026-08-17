'use client';

import { keepPreviousData, useSuspenseQuery } from '@tanstack/react-query';
import { parseAsString, parseAsInteger, useQueryStates } from 'nuqs';
import { useMediaQuery } from 'usehooks-ts';
import { MainRouteListFrame } from '@/components/main-route/frame/MainRouteListFrame';
import { ViewSwitch } from '@/components/query-controls/ViewSwitch';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useUserSettings } from '@/hooks/useUserSettings';
import { $api } from '@/util/clientFetch';
import { getEffectiveListLimit } from '@/util/paginationLimits';
import { resolveViewMode } from '@/util/userSettingsOptions';
import { ProjectsFilterMenu } from './ProjectsFilterMenu';
import { ProjectsGrid } from './ProjectsGrid';
import { ProjectsSortByMenu } from './ProjectsSortByMenu';
import { ProjectsTable } from './ProjectsTable';
import { ProjectsViewEmpty } from './ProjectsViewEmpty';
import { ProjectsViewFilterEmpty } from './ProjectsViewFilterEmpty';

export function ProjectsView() {
	const { currentUserData } = useCurrentUser();
	const { settings } = useUserSettings();
	const defaultViewMode = resolveViewMode(settings.defaultViewMode, settings.projectsViewMode);

	const [queryStates] = useQueryStates({
		page: parseAsInteger.withDefault(1),
		sort: parseAsString.withDefault(settings.projectsSort),
		created_by: parseAsString,
		my_permissions: parseAsString,
		view: parseAsString.withDefault(defaultViewMode),
	});
	const isMobile = useMediaQuery('(max-width: 600px)', { initializeWithValue: false });
	const isGridLayout = queryStates.view === 'grid' || isMobile;

	const hasLeadingActionItem = Boolean(currentUserData?.can_create_projects);
	const effectiveLimit = getEffectiveListLimit({ hasLeadingActionItem, isGridLayout });
	const offset = (queryStates.page - 1) * effectiveLimit;

	const { data: projectsData } = useSuspenseQuery(
		$api.queryOptions(
			'get',
			'/api/v1/project/',
			{
				params: {
					query: {
						limit: effectiveLimit,
						offset,
						ordering: queryStates.sort,
						created_by: (queryStates.created_by ?? undefined) as 'me' | 'others',
						membership: (queryStates.my_permissions ?? undefined) as 'admin' | 'member',
					},
				},
			},
			{
				placeholderData: keepPreviousData,
			},
		),
	);

	const hasResults = projectsData.results?.length;
	const hasFilters = queryStates.created_by ?? queryStates.my_permissions;

	return (
		<MainRouteListFrame
			controls={
				<div className="flex flex-col gap-4">
					<div className="flex place-content-between place-items-center">
						<ProjectsSortByMenu defaultSort={settings.projectsSort} isDisabled={!hasResults} />
						<ViewSwitch
							className="hidden md:flex"
							defaultView={defaultViewMode}
							isDisabled={!hasResults}
							resetPageOnChange
						/>
					</div>
					{(hasResults || hasFilters) && <ProjectsFilterMenu />}
				</div>
			}
			empty={hasFilters ? <ProjectsViewFilterEmpty /> : <ProjectsViewEmpty />}
			hasResults={Boolean(hasResults)}
			layout={isGridLayout ? 'grid' : 'table'}
			list={
				isGridLayout ? (
					<ProjectsGrid data={projectsData.results ?? []} />
				) : (
					<ProjectsTable data={projectsData.results ?? []} />
				)
			}
			pagination={
				hasResults || hasFilters
					? {
							count: projectsData.count ?? 0,
							length: projectsData.results?.length ?? 0,
							limit: effectiveLimit,
							offset,
						}
					: undefined
			}
		/>
	);
}
