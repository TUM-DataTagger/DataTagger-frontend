'use client';

import type { ComponentProps } from 'react';
import { MetadataTemplateCreateForm as CreateForm } from '@/components/metadata-template/create/MetadataTemplateCreateForm';

export function MetadataTemplateCreateForm(props: ComponentProps<'form'>) {
	return <CreateForm {...props} scope={{ kind: 'global' }} />;
}
