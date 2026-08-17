'use client';

import { BlocksIcon } from 'lucide-react';
import { Tag } from '@/components/ui/TagGroup';
import type { components } from '@/util/openapiSchema';

type ActiveMetadataTemplate = components['schemas']['MetadataTemplate'] | null | undefined;

export function getEffectiveActiveMetadataTemplates(
	templates: readonly ActiveMetadataTemplate[],
): components['schemas']['MetadataTemplate'][] {
	const seenContainerPks = new Set<string>();
	const effectiveTemplates: components['schemas']['MetadataTemplate'][] = [];

	for (const template of templates) {
		const containerPk = template?.metadata_template_container.pk;

		if (!template || !containerPk || seenContainerPks.has(containerPk)) {
			continue;
		}

		seenContainerPks.add(containerPk);
		effectiveTemplates.push(template);
	}

	return effectiveTemplates;
}

export function ActiveMetadataTemplateTags(props: { readonly templates: readonly ActiveMetadataTemplate[] }) {
	const effectiveTemplates = getEffectiveActiveMetadataTemplates(props.templates);

	return effectiveTemplates.map((template) => (
		<Tag
			className="cursor-pointer"
			color="lavender"
			href={`/metadata-templates/${template.metadata_template_container.pk}`}
			key={template.metadata_template_container.pk}
			target="_blank"
			textValue={template.metadata_template_container.name}
		>
			<BlocksIcon aria-hidden className="shrink-0" size={18} strokeWidth={1.5} />
			<span className="truncate" title={template.metadata_template_container.name}>
				{template.metadata_template_container.name}
			</span>
		</Tag>
	));
}
