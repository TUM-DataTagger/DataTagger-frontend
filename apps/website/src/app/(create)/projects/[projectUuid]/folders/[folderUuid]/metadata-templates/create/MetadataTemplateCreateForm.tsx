'use client';

import type { ComponentProps } from 'react';
import { MetadataTemplateCreateForm as CreateForm } from '@/components/metadata-template/create/MetadataTemplateCreateForm';

export function MetadataTemplateCreateForm({
	projectUuid,
	folderUuid,
	...props
}: ComponentProps<'form'> & { readonly folderUuid: string; readonly projectUuid: string }) {
	return <CreateForm {...props} scope={{ kind: 'folder', folderUuid, projectUuid }} />;
}
