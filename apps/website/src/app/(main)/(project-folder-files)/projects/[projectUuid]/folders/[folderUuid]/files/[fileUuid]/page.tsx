import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { FileIcon } from 'lucide-react';
import { notFound } from 'next/navigation';
import {
	FileCreationDates,
	FileHeading,
	FileInformation,
	FileLockAlert,
	FileMetadata,
	FileThumbnail,
	FileUpdate,
} from '@/components/File';
import { ShareButton } from '@/components/ShareButton';
import { VersionHistoryCheck } from '@/components/VersionHistory';
import { Separator } from '@/components/ui/Separator';
import { $api, openAPIClient } from '@/util/fetch';
import { getQueryClient } from '@/util/getQueryClient';
import { ProjectFolderFileBreadcrumbs } from './ProjectFolderFileBreadcrumbs';
import { ProjectFolderFileMoreMenu } from './ProjectFolderFileMoreMenu';

export default async function Page({
	params,
}: {
	readonly params: Promise<{ readonly fileUuid: string; readonly folderUuid: string; readonly projectUuid: string }>;
}) {
	const { fileUuid, folderUuid, projectUuid } = await params;

	const { data: datasetData, response } = await openAPIClient.GET('/api/v1/uploads-dataset/{id}/', {
		params: { path: { id: fileUuid } },
	});

	if (response.status === 404 || !datasetData?.latest_version) {
		notFound();
	}

	const { data: currentUserData } = await openAPIClient.GET('/api/v1/user/me/');

	const queryClient = getQueryClient();

	await Promise.all(
		[
			queryClient.prefetchQuery(
				$api.queryOptions('get', '/api/v1/uploads-dataset/{id}/status/', {
					params: { path: { id: fileUuid } },
				}),
			),
			queryClient.prefetchQuery(
				$api.queryOptions('get', '/api/v1/uploads-dataset/{id}/', {
					params: { path: { id: fileUuid } },
				}),
			),
			queryClient.prefetchQuery(
				$api.queryOptions('get', '/api/v1/uploads-version/{id}/', {
					params: { path: { id: datasetData.latest_version.pk } },
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
		<div className="flex flex-col-reverse place-content-center gap-6 2xl:flex-row">
			<HydrationBoundary state={dehydrate(queryClient)}>
				<div className="flex flex-col gap-6 2xl:grid 2xl:grid-cols-[minmax(0,396px)_816px_396px]">
					<FileLockAlert className="col-span-3" fileUuid={fileUuid} />
					<div className="flex place-content-between place-items-center 2xl:col-span-1 2xl:col-start-2">
						<ProjectFolderFileBreadcrumbs fileUuid={fileUuid} folderUuid={folderUuid} />
						<div className="flex gap-4">
							<ShareButton />
							<ProjectFolderFileMoreMenu fileUuid={fileUuid} folderUuid={folderUuid} projectUuid={projectUuid} />
						</div>
					</div>

					<div className="flex place-items-center gap-3 2xl:col-span-1 2xl:col-start-2">
						<FileIcon aria-hidden className="shrink-0" size={24} strokeWidth={1.5} />
						<FileHeading fileUuid={fileUuid} />
					</div>

					<div className="flex flex-col-reverse gap-6 2xl:col-span-2 2xl:col-start-2 2xl:inline-grid 2xl:grid-cols-[816px_396px]">
						<div className="flex flex-col gap-6">
							<FileInformation className="break-after-page" folderUuid={folderUuid} projectUuid={projectUuid} />
							<FileMetadata fileUuid={fileUuid} folderUuid={folderUuid} projectUuid={projectUuid} />
						</div>

						<div className="flex min-h-[262px] flex-col gap-6">
							<div className="flex gap-4">
								<FileThumbnail className="shrink-0" fileUuid={fileUuid} />
								<FileUpdate fileUuid={fileUuid} folderUuid={folderUuid} projectUuid={projectUuid} />
							</div>

							<div className="flex flex-col gap-6">
								<FileCreationDates fileUuid={fileUuid} />
							</div>
							<Separator className="md:hidden print:hidden" />
						</div>
					</div>
				</div>
			</HydrationBoundary>
			<VersionHistoryCheck />
		</div>
	);
}
