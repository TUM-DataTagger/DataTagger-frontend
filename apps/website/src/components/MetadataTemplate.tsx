'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { BlocksIcon, FolderIcon, PackageIcon } from 'lucide-react';
import { useMediaQuery } from 'usehooks-ts';
import { Tag, TagGroup } from '@/components/ui/TagGroup';
import { cx } from '@/styles/cva';
import { $api } from '@/util/clientFetch';

export function MetadataTemplateBadge(props: {
	readonly className?: string | undefined;
	readonly contentType?: string | undefined;
	readonly isLink?: boolean | undefined;
	readonly name?: string | null | undefined;
	readonly projectUuid?: string | undefined;
	readonly uuid?: string | null | undefined;
}) {
	const isMobile = useMediaQuery('(max-width: 600px)', { initializeWithValue: false });

	return (
		<TagGroup aria-label={props.name ?? 'Global'}>
			<Tag
				className={cx(
					'max-w-[100ch]',
					isMobile && 'max-w-[30ch]',
					props.isLink ? 'cursor-pointer' : 'select-none',
					props.className,
				)}
				color={props.isLink && props.contentType ? 'lavender' : 'neutral'}
				href={
					props.isLink && props.contentType === 'projects.project'
						? `/projects/${props.projectUuid}`
						: props.contentType === 'folders.folder'
							? `/projects/${props.projectUuid}/folders/${props.uuid}`
							: undefined!
				}
				target={props.contentType ? '_blank' : '_self'}
				textValue={props.name ?? 'Global'}
			>
				{props.contentType === 'projects.project' ? (
					<PackageIcon aria-hidden className="shrink-0" size={18} strokeWidth={1.5} />
				) : props.contentType === 'folders.folder' ? (
					<FolderIcon aria-hidden className="shrink-0" size={18} strokeWidth={1.5} />
				) : null}
				<span className="truncate">{props.name ?? 'Global'}</span>
			</Tag>
		</TagGroup>
	);
}

export function MetadataTemplateHeading(props: { readonly metadataTemplateUuid: string }) {
	const { data: metadataTemplateData } = useSuspenseQuery(
		$api.queryOptions('get', '/api/v1/metadata-template/{id}/', {
			params: { path: { id: props.metadataTemplateUuid } },
		}),
	);

	return (
		<h1 className="text-base-heading-xs flex place-items-center gap-3">
			<BlocksIcon aria-hidden className="shrink-0" size={24} strokeWidth={1.5} />
			{metadataTemplateData.name}
		</h1>
	);
}
