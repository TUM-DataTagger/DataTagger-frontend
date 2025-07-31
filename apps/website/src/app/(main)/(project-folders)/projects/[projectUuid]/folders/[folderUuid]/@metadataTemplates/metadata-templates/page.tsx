import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import type { Metadata } from 'next';
import { openAPIClient, $api } from '@/util/fetch';
import { getQueryClient } from '@/util/getQueryClient';
import { ProjectFolderMetadataTemplatesView } from './ProjectFolderMetadataTemplatesView';

export const metadata: Metadata = {
	title: 'Folder page | Metadata templates',
};

export default async function Page({
	params,
	searchParams,
}: {
	readonly params: Promise<{ readonly folderUuid: string; readonly projectUuid: string }>;
	readonly searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
	const { folderUuid, projectUuid } = await params;
	const { sort: searchParamsSort } = await searchParams;

	const sort = searchParamsSort ?? 'name';

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
		queryClient.prefetchQuery({
			queryKey: ['folder', folderUuid, 'metadata-templates', { sort }],
			queryFn: async () => {
				const { data: projectMetadataTemplates } = await openAPIClient.GET('/api/v1/metadata-template/', {
					params: { query: { assigned_to_object_id: projectUuid, limit: 9_999, ordering: sort } },
				});

				const { data: folderMetadataTemplates } = await openAPIClient.GET('/api/v1/metadata-template/', {
					params: { query: { assigned_to_object_id: folderUuid, limit: 9_999, ordering: sort } },
				});

				return [...(projectMetadataTemplates?.results ?? []), ...(folderMetadataTemplates?.results ?? [])];
			},
		}),
	]);

	return (
		<div className="flex flex-col gap-6">
			<HydrationBoundary state={dehydrate(queryClient)}>
				<ProjectFolderMetadataTemplatesView folderUuid={folderUuid} projectUuid={projectUuid} />
			</HydrationBoundary>
		</div>
	);
}
