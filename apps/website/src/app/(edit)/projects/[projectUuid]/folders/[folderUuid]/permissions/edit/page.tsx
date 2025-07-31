import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { openAPIClient } from '@/util/fetch';
import { ProjectFolderPermissionsEditFooter } from './ProjectFolderPermissionsEditFooter';
import { ProjectFoldersPermissionsEditForm } from './ProjectFolderPermissionsEditForm';

export const metadata: Metadata = {
	title: 'Edit project folder permissions',
};

export default async function Page({
	params,
}: {
	readonly params: Promise<{ readonly folderUuid: string; readonly projectUuid: string }>;
}) {
	const { folderUuid, projectUuid } = await params;

	const { data: projectData } = await openAPIClient.GET('/api/v1/project/{id}/', {
		params: { path: { id: projectUuid } },
	});

	const { data: projectPermissionsData } = await openAPIClient.GET('/api/v1/project-membership/', {
		params: { query: { project: projectUuid } },
	});

	const { data: folderData } = await openAPIClient.GET('/api/v1/folder/{id}/', {
		params: { path: { id: folderUuid } },
	});

	const { data: folderPermissionsData, error } = await openAPIClient.GET('/api/v1/folder-permission/', {
		params: { query: { folder: folderUuid } },
	});

	if (!projectData || !projectPermissionsData || !folderData || !folderPermissionsData || error) {
		notFound();
	}

	return (
		<>
			<div className="mx-auto flex w-full max-w-[536px] grow flex-col gap-8 px-4 py-12 md:px-0">
				<span className="text-base-sm text-base-neutral-600 dark:text-base-neutral-300">
					Folder: {folderData?.name}
				</span>
				<ProjectFoldersPermissionsEditForm
					data={folderPermissionsData}
					folderUuid={folderUuid}
					projectPermissionsData={projectPermissionsData}
					projectUuid={projectUuid}
				/>
			</div>
			<ProjectFolderPermissionsEditFooter folderUuid={folderUuid} />
		</>
	);
}
