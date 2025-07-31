import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import type { Metadata } from 'next';
import { $api } from '@/util/fetch';
import { getQueryClient } from '@/util/getQueryClient';
import { ProjectFolderFilesView } from './ProjectFolderFilesView';

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
	const { sort: searchParamsSort } = await searchParams;

	const sort = searchParamsSort ?? 'display_name';

	const queryClient = getQueryClient();

	await queryClient.prefetchQuery(
		$api.queryOptions('get', '/api/v1/uploads-dataset/', {
			params: { query: { folder: folderUuid, limit: 9_999, ordering: sort } },
		}),
	);

	return (
		<div className="flex flex-col gap-6">
			<HydrationBoundary state={dehydrate(queryClient)}>
				<ProjectFolderFilesView folderUuid={folderUuid} />
			</HydrationBoundary>
		</div>
	);
}
