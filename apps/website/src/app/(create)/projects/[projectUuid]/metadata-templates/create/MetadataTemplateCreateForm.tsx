'use client';

import type { ComponentProps } from 'react';
import { MetadataTemplateCreateForm as CreateForm } from '@/components/metadata-template/create/MetadataTemplateCreateForm';

export function MetadataTemplateCreateForm({
	projectUuid,
	...props
}: ComponentProps<'form'> & { readonly projectUuid: string }) {
	return <CreateForm {...props} scope={{ kind: 'project', projectUuid }} />;
}
