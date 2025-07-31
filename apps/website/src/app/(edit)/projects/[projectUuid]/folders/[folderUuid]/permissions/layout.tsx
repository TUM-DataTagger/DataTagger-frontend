import { notFound } from 'next/navigation';
import type { PropsWithChildren } from 'react';
import { GlobalToastRegion } from '@/components/ui/Toast';
import { openAPIClient } from '@/util/fetch';
import { CloseButton } from './CloseButton';

export default async function Layout({
	params,
	children,
}: PropsWithChildren<{ readonly params: Promise<{ readonly folderUuid: string }> }>) {
	const { folderUuid } = await params;

	const { data: currentUserData } = await openAPIClient.GET('/api/v1/user/me/');

	const { data: folderPermissionData } = await openAPIClient.GET('/api/v1/folder-permission/', {
		params: {
			query: { folder: folderUuid, project_membership__member: currentUserData!.pk },
		},
	});

	const isFolderAdmin = folderPermissionData?.[0]?.is_folder_admin;

	if (!isFolderAdmin) {
		notFound();
	}

	return (
		<>
			<div className="flex min-h-dvh flex-col">
				<div className="bg-base-neutral-800 text-base-xl text-base-neutral-40 dark:bg-base-neutral-100 dark:text-base-neutral-900 sticky top-0 z-10 flex h-16 place-content-between place-items-center px-4 pt-6 pb-4 md:px-[132px]">
					<span>Edit permissions</span>
					<CloseButton folderUuid={folderUuid} />
				</div>
				{children}
			</div>
			<GlobalToastRegion />
		</>
	);
}
