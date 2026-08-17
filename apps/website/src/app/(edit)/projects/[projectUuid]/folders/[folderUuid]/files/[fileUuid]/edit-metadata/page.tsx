import { FileIcon, FileWarningIcon } from 'lucide-react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { EditRouteTopBar } from '@/components/edit-route/frame/EditRouteTopBar';
import { openAPIClient } from '@/util/fetch';
import { CloseButton } from '../CloseButton';
import { ProjectFolderFileEditMetadataFooter } from './ProjectFolderFileEditMetadataFooter';
import { ProjectFolderFileEditMetadataForm } from './ProjectFolderFileEditMetadataForm';

export const metadata: Metadata = {
	title: 'Edit project folder file',
};

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

	const { data: datasetVersionData } = await openAPIClient.GET('/api/v1/uploads-version/{id}/', {
		params: { path: { id: datasetData.latest_version.pk } },
	});

	return (
		<>
			<EditRouteTopBar
				closeButton={<CloseButton fileUuid={fileUuid} folderUuid={folderUuid} projectUuid={projectUuid} />}
				title="Edit metadata"
			/>
			<div className="mx-auto flex w-full max-w-[536px] grow flex-col gap-8 px-4 py-12 md:px-0">
				<div className="flex flex-col gap-4">
					<div className="flex place-items-center gap-1">
						{datasetVersionData?.version_file ? (
							<FileIcon
								aria-hidden
								className="shrink-0 text-base-neutral-600 dark:text-base-neutral-300"
								size={18}
								strokeWidth={1.5}
							/>
						) : (
							<FileWarningIcon
								aria-hidden
								className="shrink-0 text-base-tangerine-600 dark:text-base-tangerine-400"
								size={18}
								strokeWidth={1.5}
							/>
						)}
						<span className="text-base-sm break-all text-neutral-500 dark:text-neutral-300">
							{datasetData.display_name}
						</span>
					</div>
					<div className="flex flex-col gap-2">
						<span className="text-base-sm text-neutral-500 dark:text-neutral-300">
							Project: {datasetData.folder?.project.name}
						</span>
						<span className="text-base-sm text-neutral-500 dark:text-neutral-300">
							Folder: {datasetData.folder?.name}
						</span>
					</div>
				</div>
				<ProjectFolderFileEditMetadataForm
					data={datasetData}
					fileMetadata={datasetVersionData}
					fileUuid={fileUuid}
					folderUuid={folderUuid}
					projectUuid={projectUuid}
				/>
			</div>
			<ProjectFolderFileEditMetadataFooter fileUuid={fileUuid} folderUuid={folderUuid} projectUuid={projectUuid} />
		</>
	);
}
