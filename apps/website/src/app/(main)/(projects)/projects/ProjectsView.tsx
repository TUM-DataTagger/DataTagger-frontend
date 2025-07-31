'use client';

import { keepPreviousData, useSuspenseQuery } from '@tanstack/react-query';
import { parseAsString, parseAsInteger, useQueryStates } from 'nuqs';
import { ErrorBoundary } from 'react-error-boundary';
import { useMediaQuery } from 'usehooks-ts';
import { GenericComponentErrorBoundary } from '@/components/ErrorBoundary';
import { ViewSwitch } from '@/components/ViewSwitch';
import { Pagination } from '@/components/ui/Pagination';
import { $api } from '@/util/clientFetch';
import { ProjectsFilterMenu } from './ProjectsFilterMenu';
import { ProjectsGrid } from './ProjectsGrid';
import { ProjectsSortByMenu } from './ProjectsSortByMenu';
import { ProjectsTable } from './ProjectsTable';
import { ProjectsViewEmpty } from './ProjectsViewEmpty';
import { ProjectsViewFilterEmpty } from './ProjectsViewFilterEmpty';

export function ProjectsView(props: { readonly limit: number }) {
	const [queryStates] = useQueryStates({
		page: parseAsInteger.withDefault(1),
		sort: parseAsString.withDefault('name'),
		created_by: parseAsString,
		my_permissions: parseAsString,
		view: parseAsString.withDefault('grid'),
	});
	const isMobile = useMediaQuery('(max-width: 600px)', { initializeWithValue: false });

	const offset = (queryStates.page - 1) * props.limit;

	const { data: projectsData } = useSuspenseQuery(
		$api.queryOptions(
			'get',
			'/api/v1/project/',
			{
				params: {
					query: {
						limit: props.limit,
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
		<ErrorBoundary FallbackComponent={GenericComponentErrorBoundary}>
			<div className="flex flex-col gap-4">
				<div className="flex place-content-between place-items-center">
					<ProjectsSortByMenu isDisabled={!hasResults} />
					<ViewSwitch className="hidden md:flex" isDisabled={!hasResults} />
				</div>
				{(hasResults || hasFilters) && <ProjectsFilterMenu />}
			</div>

			{hasResults || hasFilters ? (
				<Pagination
					count={projectsData.count ?? 0}
					length={projectsData.results?.length ?? 0}
					limit={props.limit}
					offset={offset}
				/>
			) : null}

			{hasResults ? (
				queryStates.view === 'grid' || isMobile ? (
					<ProjectsGrid data={projectsData.results} />
				) : (
					<ProjectsTable data={projectsData.results} />
				)
			) : hasFilters ? (
				<ProjectsViewFilterEmpty />
			) : (
				<ProjectsViewEmpty />
			)}

			{hasResults || hasFilters ? (
				<Pagination
					count={projectsData.count ?? 0}
					length={projectsData.results?.length ?? 0}
					limit={props.limit}
					offset={offset}
				/>
			) : null}
		</ErrorBoundary>
	);
}
