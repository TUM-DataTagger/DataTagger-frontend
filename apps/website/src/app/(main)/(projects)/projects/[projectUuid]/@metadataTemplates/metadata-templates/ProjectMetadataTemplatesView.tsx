'use client';

import { MetadataTemplatePoolViewFrame } from '@/components/main-route/metadata-template-pool/MetadataTemplatePoolViewFrame';
import { ProjectMetadataTemplatesGrid } from './ProjectMetadataTemplatesGrid';
import { ProjectMetadataTemplatesTable } from './ProjectMetadataTemplatesTable';
import { ProjectMetadataTemplatesViewEmpty } from './ProjectMetadataTemplatesViewEmpty';

export function ProjectMetadataTemplatesView(props: { readonly limit: number; readonly projectUuid: string }) {
	return (
		<MetadataTemplatePoolViewFrame
			limit={props.limit}
			renderEmpty={() => <ProjectMetadataTemplatesViewEmpty projectUuid={props.projectUuid} />}
			renderGrid={(data) => <ProjectMetadataTemplatesGrid data={[...data]} />}
			renderTable={(data) => <ProjectMetadataTemplatesTable data={[...data]} />}
			scope={{ kind: 'project', projectUuid: props.projectUuid }}
		/>
	);
}
