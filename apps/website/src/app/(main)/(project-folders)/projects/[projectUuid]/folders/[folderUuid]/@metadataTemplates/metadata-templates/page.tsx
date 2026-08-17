import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import type { Metadata } from 'next';
import { $api } from '@/util/fetch';
import { getQueryClient } from '@/util/getQueryClient';
import { ProjectFolderMetadataTemplatesView } from './ProjectFolderMetadataTemplatesView';

export const metadata: Metadata = {
	title: 'Folder page | Metadata templates',
};

const limit = 12;

export default async function Page({
	params,
}: {
	readonly params: Promise<{ readonly folderUuid: string; readonly projectUuid: string }>;
}) {
	const { folderUuid, projectUuid } = await params;

	const queryClient = getQueryClient();

	await Promise.all([
		queryClient.prefetchQuery(
			$api.queryOptions('get', '/api/v1/project/{id}/', {
				params: { path: { id: projectUuid } },
			}),
		),
		queryClient.prefetchQuery(
			$api.queryOptions('get', '/api/v1/folder/{id}/', {
				params: { path: { id: folderUuid } },
			}),
		),
		queryClient.prefetchQuery(
			$api.queryOptions('get', '/api/v1/folder/{id}/metadata-template-container-pool/', {
				params: { path: { id: folderUuid } },
			}),
		),
	]);

	return (
		<div className="flex flex-col gap-6">
			<HydrationBoundary state={dehydrate(queryClient)}>
				<ProjectFolderMetadataTemplatesView folderUuid={folderUuid} limit={limit} projectUuid={projectUuid} />
			</HydrationBoundary>
		</div>
	);
}
