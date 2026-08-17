import { notFound } from 'next/navigation';
import type { PropsWithChildren } from 'react';
import { EditRouteTopBar } from '@/components/edit-route/frame/EditRouteTopBar';
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
				<EditRouteTopBar closeButton={<CloseButton folderUuid={folderUuid} />} title="Edit permissions" />
				{children}
			</div>
			<GlobalToastRegion />
		</>
	);
}
