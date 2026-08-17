'use client';

import { MetadataTemplatePoolViewFrame } from '@/components/main-route/metadata-template-pool/MetadataTemplatePoolViewFrame';
import { ProjectFolderMetadataTemplatesGrid } from './ProjectFolderMetadataTemplatesGrid';
import { ProjectFolderMetadataTemplatesTable } from './ProjectFolderMetadataTemplatesTable';
import { ProjectFolderMetadataTemplatesViewEmpty } from './ProjectFolderMetadataTemplatesViewEmpty';

export function ProjectFolderMetadataTemplatesView(props: {
	readonly folderUuid: string;
	readonly limit: number;
	readonly projectUuid: string;
}) {
	return (
		<MetadataTemplatePoolViewFrame
			limit={props.limit}
			renderEmpty={() => (
				<ProjectFolderMetadataTemplatesViewEmpty folderUuid={props.folderUuid} projectUuid={props.projectUuid} />
			)}
			renderGrid={(data) => <ProjectFolderMetadataTemplatesGrid data={[...data]} />}
			renderTable={(data) => <ProjectFolderMetadataTemplatesTable data={[...data]} />}
			scope={{ kind: 'folder', folderUuid: props.folderUuid, projectUuid: props.projectUuid }}
		/>
	);
}
