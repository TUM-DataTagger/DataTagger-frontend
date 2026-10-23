'use client';

import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { BreadcrumbsItem, Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { $api } from '@/util/clientFetch';
import { useCurrentSubfolder } from './@files/files/useCurrentSubfolder';

export function ProjectFolderBreadcrumbs(props: { readonly folderUuid: string }) {
	const [currentSubfolder] = useCurrentSubfolder();

	const { data: folderData } = useSuspenseQuery(
		$api.queryOptions('get', '/api/v1/folder/{id}/', {
			params: { path: { id: props.folderUuid } },
		}),
	);

	const { data: subfolderData } = useQuery(
		$api.queryOptions(
			'get',
			'/api/v1/subfolder/{id}/',
			{
				params: { path: { id: currentSubfolder ?? '' } },
			},
			{ enabled: Boolean(currentSubfolder) },
		),
	);

	const folderHref = `/projects/${folderData?.project.pk}/folders/${props.folderUuid}`;
	const subfolderPath = currentSubfolder ? (subfolderData?.path ?? []) : [];

	return (
		<nav aria-label="Project folder breadcrumbs">
			<Breadcrumbs separator="slash">
				<BreadcrumbsItem href="/">Home</BreadcrumbsItem>
				<BreadcrumbsItem href={`/projects/${folderData?.project.pk}`}>
					<span className="max-w-[30ch] truncate sm:max-w-prose" title={folderData?.project?.name}>
						{folderData?.project?.name}
					</span>
				</BreadcrumbsItem>
				<BreadcrumbsItem href={subfolderPath.length ? folderHref : undefined}>
					<span className="max-w-[30ch] truncate sm:max-w-prose" title={folderData?.name}>
						{folderData?.name}
					</span>
				</BreadcrumbsItem>
				{subfolderPath.map((subfolder, index) => (
					<BreadcrumbsItem
						href={index < subfolderPath.length - 1 ? `${folderHref}?subfolder=${subfolder.pk}` : undefined}
						key={subfolder.pk}
					>
						<span className="max-w-[20ch] truncate" title={subfolder.name}>
							{subfolder.name}
						</span>
					</BreadcrumbsItem>
				))}
			</Breadcrumbs>
		</nav>
	);
}
