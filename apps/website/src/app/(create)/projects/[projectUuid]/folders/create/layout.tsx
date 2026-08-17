import { notFound } from 'next/navigation';
import type { PropsWithChildren } from 'react';
import { CreateRouteTopBar } from '@/components/create-route/frame/CreateRouteTopBar';
import { openAPIClient } from '@/util/fetch';
import { CloseButton } from './CloseButton';
import { ResetCreateProjectFolderStateOnMount } from './ResetCreateProjectFolderStateOnMount';

export default async function Layout({
	params,
	children,
}: PropsWithChildren<{ readonly params: Promise<{ readonly projectUuid: string }> }>) {
	const { projectUuid } = await params;

	const { data: currentUserData } = await openAPIClient.GET('/api/v1/user/me/');

	const { data: projectPermissionData } = await openAPIClient.GET('/api/v1/project-membership/', {
		params: { query: { project: projectUuid, member: currentUserData!.pk } },
	});

	const canCreateFolders = projectPermissionData?.[0]?.can_create_folders;

	if (!canCreateFolders) {
		notFound();
	}

	return (
		<>
			<ResetCreateProjectFolderStateOnMount />
			<CreateRouteTopBar closeButton={<CloseButton />} title="Create folder" />
			{children}
		</>
	);
}
