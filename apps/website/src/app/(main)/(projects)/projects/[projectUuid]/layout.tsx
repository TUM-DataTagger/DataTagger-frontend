import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { notFound } from 'next/navigation';
import type { PropsWithChildren, ReactNode } from 'react';
import { ProjectHeading } from '@/components/Project';
import { TabPanel } from '@/components/ui/Tabs';
import { $api, openAPIClient } from '@/util/fetch';
import { getQueryClient } from '@/util/getQueryClient';
import { ProjectBreadcrumbs } from './ProjectBreadcrumbs';
import { ProjectTabs } from './ProjectTabs';

export default async function Layout({
	details,
	members,
	folders,
	metadataTemplates,
	params,
}: PropsWithChildren<{
	readonly details: ReactNode;
	readonly folders: ReactNode;
	readonly members: ReactNode;
	readonly metadataTemplates: ReactNode;
	readonly params: Promise<{ readonly projectUuid: string }>;
}>) {
	const { projectUuid } = await params;

	const { response } = await openAPIClient.GET('/api/v1/project/{id}/', {
		params: { path: { id: projectUuid } },
	});

	if (response.status === 404) {
		notFound();
	}

	const { data: currentUserData } = await openAPIClient.GET('/api/v1/user/me/');

	const queryClient = getQueryClient();

	await Promise.all(
		[
			queryClient.prefetchQuery(
				$api.queryOptions('get', '/api/v1/project/{id}/', {
					params: { path: { id: projectUuid } },
				}),
			),
			currentUserData
				? queryClient.prefetchQuery(
						$api.queryOptions('get', '/api/v1/project-membership/', {
							params: { query: { project: projectUuid, member: currentUserData.pk } },
						}),
					)
				: null,
		].filter(Boolean),
	);

	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			<div className="mx-auto flex w-full max-w-[852px] flex-col gap-6 px-4 py-6">
				<ProjectBreadcrumbs projectUuid={projectUuid} />
				<ProjectHeading projectUuid={projectUuid} />
			</div>
			<ProjectTabs projectUuid={projectUuid}>
				<div className="mx-auto w-full max-w-[852px] px-4 py-6">
					<TabPanel id="folders">{folders}</TabPanel>
					<TabPanel id="members">{members}</TabPanel>
					<TabPanel id="metadata-templates">{metadataTemplates}</TabPanel>
					<TabPanel id="details">{details}</TabPanel>
				</div>
			</ProjectTabs>
		</HydrationBoundary>
	);
}
