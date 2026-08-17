import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { notFound } from 'next/navigation';
import type { PropsWithChildren, ReactNode } from 'react';
import { FolderDetailsSummary, FolderHeading } from '@/components/Folder';
import { TabPanel } from '@/components/ui/Tabs';
import { $api, openAPIClient } from '@/util/fetch';
import { getQueryClient } from '@/util/getQueryClient';
import { ProjectFolderBadges } from './ProjectFolderBadges';
import { ProjectFolderBreadcrumbs } from './ProjectFolderBreadcrumbs';
import { ProjectFolderMenu } from './ProjectFolderMenu';
import { ProjectFolderMoreMenu } from './ProjectFolderMoreMenu';
import { ProjectFolderTabs } from './ProjectFolderTabs';

export default async function Layout({
	permissions,
	files,
	metadataTemplates,
	params,
}: PropsWithChildren<{
	readonly files: ReactNode;
	readonly metadataTemplates: ReactNode;
	readonly params: Promise<{ readonly folderUuid: string; readonly projectUuid: string }>;
	readonly permissions: ReactNode;
}>) {
	const { folderUuid, projectUuid } = await params;

	const { data: folderData, response } = await openAPIClient.GET('/api/v1/folder/{id}/', {
		params: { path: { id: folderUuid } },
	});

	if (response.status === 404) {
		notFound();
	}

	const { data: currentUserData } = await openAPIClient.GET('/api/v1/user/me/');

	const queryClient = getQueryClient();
	const folderQueryOptions = $api.queryOptions('get', '/api/v1/folder/{id}/', {
		params: { path: { id: folderUuid } },
	});

	if (folderData) {
		queryClient.setQueryData(folderQueryOptions.queryKey, folderData);
	}

	await Promise.all([
		queryClient.prefetchQuery(
			$api.queryOptions('get', '/api/v1/project/{id}/', {
				params: { path: { id: projectUuid } },
			}),
		),
		currentUserData
			? queryClient.prefetchQuery(
					$api.queryOptions('get', '/api/v1/folder-permission/', {
						params: { query: { folder: folderUuid, project_membership__member: currentUserData.pk } },
					}),
				)
			: Promise.resolve(),
	]);

	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			<div className="mx-auto flex w-full max-w-[856px] flex-col gap-6 px-4 py-6">
				<div className="flex place-content-between place-items-center">
					<ProjectFolderBreadcrumbs folderUuid={folderUuid} />
				</div>

				<div className="flex flex-col gap-3">
					<ProjectFolderBadges folderUuid={folderUuid} />
					<div className="flex place-content-between place-items-center">
						<FolderHeading folderUuid={folderUuid} />
						{(folderData?.datasets_count ?? 0) > 0 && (
							<ProjectFolderMenu folderUuid={folderUuid} projectUuid={projectUuid} />
						)}
						{folderData?.datasets_count === 0 && (
							<ProjectFolderMoreMenu
								folderName={folderData?.name}
								folderUuid={folderUuid}
								isDeletable={folderData?.datasets_count === 0}
								projectUuid={projectUuid}
							/>
						)}
					</div>
					<FolderDetailsSummary folderUuid={folderUuid} />
				</div>
			</div>
			<ProjectFolderTabs folderUuid={folderUuid} projectUuid={projectUuid}>
				<div className="mx-auto w-full max-w-[856px] px-4 py-6">
					<TabPanel id="files">{files}</TabPanel>
					<TabPanel id="permissions">{permissions}</TabPanel>
					<TabPanel id="metadata-templates">{metadataTemplates}</TabPanel>
				</div>
			</ProjectFolderTabs>
		</HydrationBoundary>
	);
}
