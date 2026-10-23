import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import type { Metadata } from 'next';
import { $api } from '@/util/fetch';
import { getQueryClient } from '@/util/getQueryClient';
import { getServerUserSettings } from '@/util/getServerUserSettings';
import { GRID_PAGE_LIMIT_WITH_LEADING_ACTION, TABLE_PAGE_LIMIT } from '@/util/paginationLimits';
import { ProjectFolderFilesView } from './ProjectFolderFilesView';
import { getSubfolderDatasetQuery } from './subfolderQuery';

export const metadata: Metadata = {
	title: 'Folder page | Files',
};

export default async function Page({
	params,
	searchParams,
}: {
	readonly params: Promise<{ readonly folderUuid: string }>;
	readonly searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
	const { folderUuid } = await params;
	const {
		page: searchParamsPage,
		sort: searchParamsSort,
		q: searchParamsSearch,
		subfolder: searchParamsSubfolder,
	} = await searchParams;
	const subfolderQuery = getSubfolderDatasetQuery(searchParamsSubfolder, searchParamsSearch);

	const page = searchParamsPage ? Number(searchParamsPage) : 1;
	const settings = await getServerUserSettings();
	const tableLimit = TABLE_PAGE_LIMIT;
	const tableOffset = (page - 1) * tableLimit;
	const gridLimit = GRID_PAGE_LIMIT_WITH_LEADING_ACTION;
	const gridOffset = (page - 1) * gridLimit;
	const sort = searchParamsSort ?? settings.filesSort;

	const queryClient = getQueryClient();

	await Promise.all([
		queryClient.prefetchQuery(
			$api.queryOptions('get', '/api/v1/uploads-dataset/', {
				params: {
					query: {
						folder: folderUuid,
						limit: tableLimit,
						offset: tableOffset,
						ordering: sort,
						search: searchParamsSearch ?? '',
						...subfolderQuery,
					},
				},
			}),
		),
		queryClient.prefetchQuery(
			$api.queryOptions('get', '/api/v1/uploads-dataset/', {
				params: {
					query: {
						folder: folderUuid,
						limit: gridLimit,
						offset: gridOffset,
						ordering: sort,
						search: searchParamsSearch ?? '',
						...subfolderQuery,
					},
				},
			}),
		),
	]);

	return (
		<div className="flex flex-col gap-6">
			<HydrationBoundary state={dehydrate(queryClient)}>
				<ProjectFolderFilesView folderUuid={folderUuid} limit={TABLE_PAGE_LIMIT} />
			</HydrationBoundary>
		</div>
	);
}
