'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { BreadcrumbsItem, Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { $api } from '@/util/clientFetch';

export function ProjectBreadcrumbs(props: { readonly projectUuid: string }) {
	const { data: projectData } = useSuspenseQuery(
		$api.queryOptions('get', '/api/v1/project/{id}/', {
			params: { path: { id: props.projectUuid } },
		}),
	);

	return (
		<nav aria-label="Project breadcrumbs">
			<Breadcrumbs separator="slash">
				<BreadcrumbsItem href="/">Home</BreadcrumbsItem>
				<BreadcrumbsItem>
					<span className="max-w-[30ch] truncate sm:max-w-prose" title={projectData?.name}>
						{projectData?.name}
					</span>
				</BreadcrumbsItem>
			</Breadcrumbs>
		</nav>
	);
}
