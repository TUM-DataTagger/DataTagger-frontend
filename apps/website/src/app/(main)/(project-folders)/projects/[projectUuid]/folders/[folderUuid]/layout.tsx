import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { notFound } from 'next/navigation';
import type { PropsWithChildren, ReactNode } from 'react';
import { FolderHeading } from '@/components/Folder';
import { TabPanel } from '@/components/ui/Tabs';
import { $api, openAPIClient } from '@/util/fetch';
import { getQueryClient } from '@/util/getQueryClient';
import { ProjectFolderBreadcrumbs } from './ProjectFolderBreadcrumbs';
import { ProjectFolderTabs } from './ProjectFolderTabs';

export default async function Layout({
	details,
	permissions,
	files,
	metadataTemplates,
	params,
}: PropsWithChildren<{
	readonly details: ReactNode;
	readonly files: ReactNode;
	readonly metadataTemplates: ReactNode;
	readonly params: Promise<{ readonly folderUuid: string; readonly projectUuid: string }>;
	readonly permissions: ReactNode;
}>) {
	const { folderUuid, projectUuid } = await params;

	const { response } = await openAPIClient.GET('/api/v1/folder/{id}/', {
		params: { path: { id: folderUuid } },
	});

	if (response.status === 404) {
		notFound();
	}

	const { data: currentUserData } = await openAPIClient.GET('/api/v1/user/me/');

	const queryClient = getQueryClient();

	await Promise.all(
		[
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
			currentUserData
				? queryClient.prefetchQuery(
						$api.queryOptions('get', '/api/v1/folder-permission/', {
							params: { query: { folder: folderUuid, project_membership__member: currentUserData.pk } },
						}),
					)
				: null,
		].filter(Boolean),
	);

	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			<div className="mx-auto flex w-full max-w-[852px] flex-col gap-6 px-4 py-6">
				<ProjectFolderBreadcrumbs folderUuid={folderUuid} />
				<FolderHeading folderUuid={folderUuid} />
			</div>
			<ProjectFolderTabs folderUuid={folderUuid} projectUuid={projectUuid}>
				<div className="mx-auto w-full max-w-[852px] px-4 py-6">
					<TabPanel id="files">{files}</TabPanel>
					<TabPanel id="permissions">{permissions}</TabPanel>
					<TabPanel id="metadata-templates">{metadataTemplates}</TabPanel>
					<TabPanel id="details">{details}</TabPanel>
				</div>
			</ProjectFolderTabs>
		</HydrationBoundary>
	);
}
