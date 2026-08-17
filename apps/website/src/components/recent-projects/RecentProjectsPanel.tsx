'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { PackageIcon, PlusIcon } from 'lucide-react';
import { parseAsString, useQueryState, useQueryStates } from 'nuqs';
import { useMediaQuery } from 'usehooks-ts';
import { ProjectsFilterMenu } from '@/app/(main)/(projects)/projects/ProjectsFilterMenu';
import { ProjectsEmptyState } from '@/components/projects/ProjectsEmptyState';
import { ViewSwitch } from '@/components/query-controls/ViewSwitch';
import { RecentProjectsGrid } from '@/components/recent-projects/RecentProjectsGrid';
import { RecentProjectsSortByMenu } from '@/components/recent-projects/RecentProjectsSortByMenu';
import { RecentProjectsTable } from '@/components/recent-projects/RecentProjectsTable';
import { Link } from '@/components/ui/Link';
import { Separator } from '@/components/ui/Separator';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useUserSettings } from '@/hooks/useUserSettings';
import { buttonStyles } from '@/styles/ui/button';
import { $api } from '@/util/clientFetch';
import { useRecentProjects } from '@/util/useRecentActivity';
import {
	createRecentProjectEnrichmentMap,
	filterRecentProjectViewModels,
	getRecentProjectsQueryParameters,
	mapFallbackProjects,
	mapRecentProjectEntries,
	RECENT_PROJECTS_LIMIT,
	sortRecentProjectViewModels,
	type RecentProjectCreatedByFilter,
	type RecentProjectMembershipFilter,
	type RecentProjectsSortKey,
} from './recentProjectsViewModel';

function isCreatedByFilter(input: string | null): input is RecentProjectCreatedByFilter {
	return input === 'me' || input === 'others';
}

function isMembershipFilter(input: string | null): input is RecentProjectMembershipFilter {
	return input === 'admin' || input === 'member';
}

export function RecentProjectsPanel() {
	const recentProjects = useRecentProjects();
	const { currentUserData } = useCurrentUser();
	const { settings } = useUserSettings();

	const [view] = useQueryState('view', parseAsString.withDefault(settings.defaultViewMode ?? 'grid'));
	const [sort] = useQueryState('recent_projects_sort', parseAsString.withDefault('last_worked_on'));
	const [filterQueryStates] = useQueryStates({
		created_by: parseAsString,
		my_permissions: parseAsString,
	});
	const isMobile = useMediaQuery('(max-width: 600px)', { initializeWithValue: false });
	const isGridLayout = view === 'grid' || isMobile;
	const recentProjectUuids = Array.from(new Set(recentProjects.map((project) => project.projectUuid)));
	const isUsingProjectListFallback = recentProjectUuids.length === 0;

	const {
		data: projectsData,
		isPending: isProjectsPending,
		isSuccess: hasResolvedProjects,
	} = useQuery(
		$api.queryOptions(
			'get',
			'/api/v1/project/',
			{
				params: {
					query: getRecentProjectsQueryParameters(recentProjectUuids),
				},
			},
			{
				placeholderData: keepPreviousData,
			},
		),
	);
	const enrichmentByUuid = hasResolvedProjects
		? createRecentProjectEnrichmentMap(projectsData.results ?? [])
		: undefined;

	const recentProjectViewModels = isUsingProjectListFallback
		? mapFallbackProjects(projectsData?.results ?? [], currentUserData?.pk)
		: mapRecentProjectEntries(recentProjects, {
				currentUserPk: currentUserData?.pk,
				enrichmentByUuid,
			});
	const filteredRecentProjects = filterRecentProjectViewModels(recentProjectViewModels, {
		createdBy: isCreatedByFilter(filterQueryStates.created_by) ? filterQueryStates.created_by : undefined,
		membership: isMembershipFilter(filterQueryStates.my_permissions) ? filterQueryStates.my_permissions : undefined,
	});
	const sortedRecentProjects = sortRecentProjectViewModels(
		filteredRecentProjects,
		sort === 'last_worked_on' ? (sort as RecentProjectsSortKey) : 'last_worked_on',
	).slice(0, RECENT_PROJECTS_LIMIT);
	const hasFilter = filterQueryStates.created_by !== null || filterQueryStates.my_permissions !== null;
	const hasFilterableResults = Boolean(recentProjectViewModels.length);
	const hasResults = Boolean(sortedRecentProjects.length);
	const isLoadingFallback = isUsingProjectListFallback && isProjectsPending;

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col place-content-between gap-3 md:flex-row md:place-items-center">
				<h3 className="flex place-items-center gap-3 text-base-heading-xs">
					<PackageIcon aria-hidden size={24} strokeWidth={1.5} /> Recent projects
				</h3>
				<div className="flex flex-col gap-6 md:flex-row md:place-items-center">
					{currentUserData?.can_create_projects ? (
						<Link
							className={buttonStyles({ variant: 'secondary-filled', className: 'w-fit' })}
							href="/projects/create/1"
							variant="unset"
						>
							<PlusIcon aria-hidden size={18} strokeWidth={1.5} />
							Project
						</Link>
					) : null}
					<Separator orientation="vertical" className="hidden h-4 md:block" />
					<ViewSwitch className="hidden md:flex" defaultView={settings.defaultViewMode} isDisabled={!hasResults} />
				</div>
			</div>

			<div className="flex flex-col gap-4">
				<div className="flex flex-col gap-2 md:flex-row md:place-content-between md:place-items-center">
					<RecentProjectsSortByMenu isDisabled={!hasResults} />
					<ProjectsFilterMenu isDisabled={!hasFilterableResults} />
				</div>

				{isLoadingFallback ? (
					<div
						aria-label="Loading projects"
						className="min-h-64 animate-pulse rounded-2xl bg-base-neutral-60 dark:bg-base-neutral-700/38"
					/>
				) : hasResults ? (
					<div className="rounded-2xl bg-base-neutral-60 p-4 dark:bg-base-neutral-700/38">
						{isGridLayout ? (
							<RecentProjectsGrid data={sortedRecentProjects} />
						) : (
							<RecentProjectsTable data={sortedRecentProjects} />
						)}
					</div>
				) : (
					<ProjectsEmptyState
						canCreateProjects={currentUserData?.can_create_projects}
						createButtonLabel="Create project"
						description={
							hasFilter
								? 'No recent projects match the selected filters.'
								: 'Recent projects appear after project activity.'
						}
						title={hasFilter ? 'No matching projects' : 'No projects yet'}
					/>
				)}
			</div>
		</div>
	);
}
