'use client';

import { MetadataTemplatePoolEmptyState } from '@/components/main-route/metadata-template-pool/MetadataTemplatePoolEmptyState';

export function ProjectFolderMetadataTemplatesViewEmpty(props: {
	readonly folderUuid: string;
	readonly projectUuid: string;
}) {
	return (
		<MetadataTemplatePoolEmptyState
			scope={{ kind: 'folder', folderUuid: props.folderUuid, projectUuid: props.projectUuid }}
		/>
	);
}
