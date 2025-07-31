'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { BreadcrumbItem, Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { $api } from '@/util/clientFetch';

export function ProjectFolderBreadcrumbs(props: { readonly folderUuid: string }) {
	const { data: folderData } = useSuspenseQuery(
		$api.queryOptions('get', '/api/v1/folder/{id}/', {
			params: { path: { id: props.folderUuid } },
		}),
	);

	return (
		<nav aria-label="Project folder breadcrumbs">
			<Breadcrumbs separator="slash">
				<BreadcrumbItem href="/drafts">Home</BreadcrumbItem>
				<BreadcrumbItem href={`/projects/${folderData?.project.pk}`}>
					<span className="max-w-[30ch] truncate sm:max-w-prose">{folderData?.project?.name}</span>
				</BreadcrumbItem>
				<BreadcrumbItem>
					<span className="max-w-[30ch] truncate sm:max-w-prose">{folderData?.name}</span>
				</BreadcrumbItem>
			</Breadcrumbs>
		</nav>
	);
}
