'use client';

import { MetadataTemplatePoolEmptyState } from '@/components/main-route/metadata-template-pool/MetadataTemplatePoolEmptyState';

export function ProjectMetadataTemplatesViewEmpty(props: { readonly projectUuid: string }) {
	return <MetadataTemplatePoolEmptyState scope={{ kind: 'project', projectUuid: props.projectUuid }} />;
}
