import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { openAPIClient } from '@/util/fetch';
import { ProjectFolderDetailsEditFooter } from './ProjectFolderDetailsEditFooter';
import { ProjectFolderDetailsEditForm } from './ProjectFolderDetailsEditForm';

export const metadata: Metadata = {
	title: 'Edit project folder details',
};

export default async function Page({
	params,
}: {
	readonly params: Promise<{ readonly folderUuid: string; readonly projectUuid: string }>;
}) {
	const { folderUuid, projectUuid } = await params;

	const { data: folderData, error } = await openAPIClient.GET('/api/v1/folder/{id}/', {
		params: { path: { id: folderUuid } },
	});

	if (!folderData || error) {
		notFound();
	}

	return (
		<>
			<div className="mx-auto flex w-full max-w-[536px] grow flex-col gap-4 px-4 py-12 md:px-0">
				<ProjectFolderDetailsEditForm data={folderData} folderUuid={folderUuid} projectUuid={projectUuid} />
			</div>
			<ProjectFolderDetailsEditFooter folderUuid={folderUuid} />
		</>
	);
}
