'use client';

import type { ComponentProps } from 'react';
import { FileMetadataEditForm } from '@/components/edit-route/file-metadata/FileMetadataEditForm';
import type { components } from '@/util/openapiSchema';

export function ProjectFolderFileEditMetadataForm({
	fileMetadata,
	fileUuid,
	projectUuid,
	folderUuid,
	data,
	...props
}: ComponentProps<'form'> & {
	readonly data: components['schemas']['UploadsDataset'];
	readonly fileMetadata?: components['schemas']['UploadsVersion'] | undefined;
	readonly fileUuid: string;
	readonly folderUuid: string;
	readonly projectUuid: string;
}) {
	return (
		<FileMetadataEditForm
			{...props}
			data={data}
			fileMetadata={fileMetadata}
			fileUuid={fileUuid}
			mode={{ kind: 'project-folder-file', folderUuid, projectUuid }}
		/>
	);
}
