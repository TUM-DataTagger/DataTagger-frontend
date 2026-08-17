'use client';

import type { VariantProps } from 'cva';
import type { PropsWithChildren } from 'react';
import { MetadataTemplatePoolCreateGrid } from '@/components/main-route/metadata-template-pool/MetadataTemplatePoolCreateGrid';
import type { gridCardStyles } from '@/styles/ui/gridCard';

export function ProjectMetadataTemplatesCreateGrid({
	variant = 'secondary-filled',
	...props
}: PropsWithChildren<
	VariantProps<typeof gridCardStyles> & {
		readonly className?: string | undefined;
		readonly href: string;
		readonly projectUuid: string;
	}
>) {
	return (
		<MetadataTemplatePoolCreateGrid
			className={props.className}
			href={props.href}
			scope={{ kind: 'project', projectUuid: props.projectUuid }}
			variant={variant}
		>
			{props.children}
		</MetadataTemplatePoolCreateGrid>
	);
}
