'use client';

import type { VariantProps } from 'cva';
import type { Route } from 'next';
import type { PropsWithChildren } from 'react';
import { MetadataTemplatePoolCreateTable } from '@/components/main-route/metadata-template-pool/MetadataTemplatePoolCreateTable';
import type { buttonStyles } from '@/styles/ui/button';

export function ProjectFolderMetadataTemplatesCreateTable({
	variant = 'unset',
	...props
}: PropsWithChildren<
	VariantProps<typeof buttonStyles> & {
		readonly className?: string | undefined;
		readonly folderUuid: string;
		readonly href: Route;
		readonly projectUuid: string;
	}
>) {
	return (
		<MetadataTemplatePoolCreateTable
			className={props.className}
			href={props.href}
			scope={{ kind: 'folder', folderUuid: props.folderUuid, projectUuid: props.projectUuid }}
			variant={variant}
		>
			{props.children}
		</MetadataTemplatePoolCreateTable>
	);
}
