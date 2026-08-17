import { notFound } from 'next/navigation';
import type { PropsWithChildren } from 'react';
import { EditRouteTopBar } from '@/components/edit-route/frame/EditRouteTopBar';
import { openAPIClient } from '@/util/fetch';
import { CloseButton } from './CloseButton';

export default async function Layout({
	params,
	children,
}: PropsWithChildren<{ readonly params: Promise<{ readonly projectUuid: string }> }>) {
	const { projectUuid } = await params;

	const { data: currentUserData } = await openAPIClient.GET('/api/v1/user/me/');

	const { data: permissionData } = await openAPIClient.GET('/api/v1/project-membership/', {
		params: { query: { project: projectUuid, member: currentUserData!.pk } },
	});

	const isProjectAdmin = permissionData?.[0]?.is_project_admin;

	if (!isProjectAdmin) {
		notFound();
	}

	return (
		<>
			<EditRouteTopBar closeButton={<CloseButton projectUuid={projectUuid} />} title="Edit basic information" />
			{children}
		</>
	);
}
