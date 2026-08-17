'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { BreadcrumbsItem, Breadcrumbs } from '@/components/ui/Breadcrumbs';
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
				<BreadcrumbsItem href="/">Home</BreadcrumbsItem>
				<BreadcrumbsItem href={`/projects/${folderData?.project.pk}`}>
					<span className="max-w-[30ch] truncate sm:max-w-prose" title={folderData?.project?.name}>
						{folderData?.project?.name}
					</span>
				</BreadcrumbsItem>
				<BreadcrumbsItem>
					<span className="max-w-[30ch] truncate sm:max-w-prose" title={folderData?.name}>
						{folderData?.name}
					</span>
				</BreadcrumbsItem>
			</Breadcrumbs>
		</nav>
	);
}
