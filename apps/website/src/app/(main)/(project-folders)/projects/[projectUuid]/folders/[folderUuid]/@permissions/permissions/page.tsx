import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import type { Metadata } from 'next';
import { $api } from '@/util/fetch';
import { getQueryClient } from '@/util/getQueryClient';
import { ProjectFolderPermissionsView } from './ProjectFolderPermissionsView';

export const metadata: Metadata = {
	title: 'Folder page | Permissions',
};

const limit = 12;

export default async function Page({
	params,
}: {
	readonly params: Promise<{ readonly folderUuid: string; readonly projectUuid: string; readonly tab?: string[] }>;
}) {
	const { folderUuid, projectUuid } = await params;

	const queryClient = getQueryClient();

	await queryClient.prefetchQuery(
		$api.queryOptions('get', '/api/v1/folder-permission/', {
			params: {
				query: { folder: folderUuid, ordering: '-is_folder_admin,-can_edit,project_membership__member__email' },
			},
		}),
	);

	return (
		<div className="flex flex-col gap-6">
			<HydrationBoundary state={dehydrate(queryClient)}>
				<ProjectFolderPermissionsView folderUuid={folderUuid} limit={limit} projectUuid={projectUuid} />
			</HydrationBoundary>
		</div>
	);
}
