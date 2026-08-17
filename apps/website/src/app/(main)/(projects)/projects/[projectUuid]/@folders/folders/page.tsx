import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import type { Metadata } from 'next';
import { $api } from '@/util/fetch';
import { getQueryClient } from '@/util/getQueryClient';
import { getServerUserSettings } from '@/util/getServerUserSettings';
import { GRID_PAGE_LIMIT_WITH_LEADING_ACTION, TABLE_PAGE_LIMIT } from '@/util/paginationLimits';
import { ProjectFoldersView } from './ProjectFoldersView';

export const metadata: Metadata = {
	title: 'Project page | Folders',
};

export default async function Page({
	params,
	searchParams,
}: {
	readonly params: Promise<{ readonly projectUuid: string }>;
	readonly searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
	const { projectUuid } = await params;
	const { page: searchParamsPage, sort: searchParamsSort } = await searchParams;

	const page = searchParamsPage ? Number(searchParamsPage) : 1;
	const settings = await getServerUserSettings();
	const tableLimit = TABLE_PAGE_LIMIT;
	const tableOffset = (page - 1) * tableLimit;
	const gridLimit = GRID_PAGE_LIMIT_WITH_LEADING_ACTION;
	const gridOffset = (page - 1) * gridLimit;
	const sort = searchParamsSort ?? settings.foldersSort;

	const queryClient = getQueryClient();

	await Promise.all([
		queryClient.prefetchQuery(
			$api.queryOptions('get', '/api/v1/folder/', {
				params: { query: { project: projectUuid, limit: tableLimit, offset: tableOffset, ordering: sort } },
			}),
		),
		queryClient.prefetchQuery(
			$api.queryOptions('get', '/api/v1/folder/', {
				params: { query: { project: projectUuid, limit: gridLimit, offset: gridOffset, ordering: sort } },
			}),
		),
	]);

	return (
		<div className="flex flex-col gap-6">
			<HydrationBoundary state={dehydrate(queryClient)}>
				<ProjectFoldersView limit={TABLE_PAGE_LIMIT} projectUuid={projectUuid} />
			</HydrationBoundary>
		</div>
	);
}
