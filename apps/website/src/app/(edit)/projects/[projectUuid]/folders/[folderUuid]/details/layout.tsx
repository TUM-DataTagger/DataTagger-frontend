import { notFound } from 'next/navigation';
import type { PropsWithChildren } from 'react';
import { EditRouteTopBar } from '@/components/edit-route/frame/EditRouteTopBar';
import { openAPIClient } from '@/util/fetch';
import { CloseButton } from './CloseButton';

export default async function Layout({
	params,
	children,
}: PropsWithChildren<{ readonly params: Promise<{ readonly folderUuid: string; readonly projectUuid: string }> }>) {
	const { folderUuid, projectUuid } = await params;

	const { data: currentUserData } = await openAPIClient.GET('/api/v1/user/me/');

	const { data: folderPermissionData } = await openAPIClient.GET('/api/v1/folder-permission/', {
		params: {
			query: { folder: folderUuid, project_membership__member: currentUserData!.pk },
		},
	});

	const canEdit = folderPermissionData?.[0]?.is_folder_admin || folderPermissionData?.[0]?.can_edit;

	if (!canEdit) {
		notFound();
	}

	return (
		<>
			<EditRouteTopBar
				closeButton={<CloseButton folderUuid={folderUuid} projectUuid={projectUuid} />}
				title="Edit basic information"
			/>
			{children}
		</>
	);
}
