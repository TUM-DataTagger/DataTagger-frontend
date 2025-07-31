import type { Metadata } from 'next';
import { openAPIClient } from '@/util/fetch';
import { ProjectFolderPermissionsView } from './ProjectFolderPermissionsView';

export const metadata: Metadata = {
	title: 'Folder page | Permissions',
};

export default async function Page({
	params,
}: {
	readonly params: Promise<{ readonly folderUuid: string; readonly projectUuid: string; readonly tab?: string[] }>;
}) {
	const { folderUuid, projectUuid } = await params;

	const { data: folderPermissionsData } = await openAPIClient.GET('/api/v1/folder-permission/', {
		params: { query: { folder: folderUuid, ordering: '-is_folder_admin,member__email' } },
	});

	return (
		<div className="flex flex-col gap-6">
			<ProjectFolderPermissionsView data={folderPermissionsData} folderUuid={folderUuid} projectUuid={projectUuid} />
		</div>
	);
}
