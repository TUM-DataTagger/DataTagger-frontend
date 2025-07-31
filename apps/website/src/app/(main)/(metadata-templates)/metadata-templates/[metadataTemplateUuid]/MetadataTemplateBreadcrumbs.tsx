'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { BreadcrumbItem, Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { $api } from '@/util/clientFetch';

export function MetadataTemplateBreadcrumbs(props: { readonly metadataTemplateUuid: string }) {
	const { data: metadataTemplateData } = useSuspenseQuery(
		$api.queryOptions('get', '/api/v1/metadata-template/{id}/', {
			params: { path: { id: props.metadataTemplateUuid } },
		}),
	);

	return (
		<nav aria-label="Metadata template breadcrumbs">
			<Breadcrumbs separator="slash">
				<BreadcrumbItem href="/drafts">Home</BreadcrumbItem>
				<BreadcrumbItem>
					<span className="max-w-[30ch] truncate sm:max-w-prose">{metadataTemplateData.name}</span>
				</BreadcrumbItem>
			</Breadcrumbs>
		</nav>
	);
}
