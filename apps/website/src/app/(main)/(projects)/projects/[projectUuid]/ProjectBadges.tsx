'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { ActiveMetadataTemplateTags } from '@/components/metadata-template/ActiveMetadataTemplateTags';
import { TagGroup } from '@/components/ui/TagGroup';
import { $api } from '@/util/clientFetch';

export function ProjectBadges(props: { readonly projectUuid: string }) {
	const { data: projectData } = useSuspenseQuery(
		$api.queryOptions('get', '/api/v1/project/{id}/', {
			params: { path: { id: props.projectUuid } },
		}),
	);

	if (!projectData.metadata_template) {
		return null;
	}

	return (
		<div className="flex place-items-center gap-1">
			<TagGroup aria-label="Active metadata templates">
				<ActiveMetadataTemplateTags templates={[projectData.metadata_template]} />
			</TagGroup>
		</div>
	);
}
