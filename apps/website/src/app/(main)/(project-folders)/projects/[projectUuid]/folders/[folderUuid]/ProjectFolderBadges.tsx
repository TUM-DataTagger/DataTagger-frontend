'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { DatabaseIcon, PackageIcon } from 'lucide-react';
import { ActiveMetadataTemplateTags } from '@/components/metadata-template/ActiveMetadataTemplateTags';
import { TagGroup, Tag } from '@/components/ui/TagGroup';
import { $api } from '@/util/clientFetch';

export function ProjectFolderBadges(props: { readonly folderUuid: string }) {
	const { data: folderData } = useSuspenseQuery(
		$api.queryOptions('get', '/api/v1/folder/{id}/', {
			params: { path: { id: props.folderUuid } },
		}),
	);
	const { data: projectData } = useSuspenseQuery(
		$api.queryOptions('get', '/api/v1/project/{id}/', {
			params: { path: { id: folderData.project.pk } },
		}),
	);

	return (
		<div className="flex place-items-center gap-1">
			<TagGroup aria-label={folderData.project.name}>
				<Tag
					className="cursor-pointer"
					href={`/projects/${folderData.project.pk}`}
					target="_blank"
					textValue={folderData.project.name}
				>
					<PackageIcon aria-hidden size={18} strokeWidth={1.5} /> {folderData.project.name}
				</Tag>
				<Tag color="neutral-lighter" textValue={folderData.storage?.name ?? 'DSS'}>
					<DatabaseIcon aria-hidden size={18} strokeWidth={1.5} /> {folderData.storage?.name ?? 'DSS'}
				</Tag>
				<ActiveMetadataTemplateTags templates={[projectData.metadata_template, folderData.metadata_template]} />
			</TagGroup>
		</div>
	);
}
