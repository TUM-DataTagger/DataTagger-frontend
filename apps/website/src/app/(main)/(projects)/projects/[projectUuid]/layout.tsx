import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { notFound } from 'next/navigation';
import type { PropsWithChildren, ReactNode } from 'react';
import { ProjectDetailsSummary, ProjectHeading } from '@/components/Project';
import { TabPanel } from '@/components/ui/Tabs';
import { $api, openAPIClient } from '@/util/fetch';
import { getQueryClient } from '@/util/getQueryClient';
import { ProjectBadges } from './ProjectBadges';
import { ProjectBreadcrumbs } from './ProjectBreadcrumbs';
import { ProjectMenu } from './ProjectMenu';
import { ProjectMoreMenu } from './ProjectMoreMenu';
import { ProjectTabs } from './ProjectTabs';

export default async function Layout({
	members,
	folders,
	metadataTemplates,
	params,
}: PropsWithChildren<{
	readonly folders: ReactNode;
	readonly members: ReactNode;
	readonly metadataTemplates: ReactNode;
	readonly params: Promise<{ readonly projectUuid: string }>;
}>) {
	const { projectUuid } = await params;

	const { data: projectData, response } = await openAPIClient.GET('/api/v1/project/{id}/', {
		params: { path: { id: projectUuid } },
	});

	if (response.status === 404) {
		notFound();
	}

	const { data: currentUserData } = await openAPIClient.GET('/api/v1/user/me/');

	const queryClient = getQueryClient();
	const projectQueryOptions = $api.queryOptions('get', '/api/v1/project/{id}/', {
		params: { path: { id: projectUuid } },
	});

	if (projectData) {
		queryClient.setQueryData(projectQueryOptions.queryKey, projectData);
	}

	if (currentUserData) {
		await queryClient.prefetchQuery(
			$api.queryOptions('get', '/api/v1/project-membership/', {
				params: { query: { project: projectUuid, member: currentUserData.pk } },
			}),
		);
	}

	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			<div className="mx-auto flex w-full max-w-[856px] flex-col gap-6 px-4 py-6">
				<div className="flex place-content-between place-items-center">
					<ProjectBreadcrumbs projectUuid={projectUuid} />
				</div>

				<div className="flex flex-col gap-3">
					<ProjectBadges projectUuid={projectUuid} />
					<div className="flex place-content-between place-items-center">
						<ProjectHeading projectUuid={projectUuid} />
						{projectData?.is_deletable ? (
							<ProjectMoreMenu
								isDeletable={projectData?.is_deletable}
								projectName={projectData?.name}
								projectUuid={projectUuid}
							/>
						) : (
							<ProjectMenu projectUuid={projectUuid} />
						)}
					</div>
					<ProjectDetailsSummary projectUuid={projectUuid} />
				</div>
			</div>
			<ProjectTabs projectUuid={projectUuid}>
				<div className="mx-auto w-full max-w-[856px] px-4 py-6">
					<TabPanel id="folders">{folders}</TabPanel>
					<TabPanel id="members">{members}</TabPanel>
					<TabPanel id="metadata-templates">{metadataTemplates}</TabPanel>
				</div>
			</ProjectTabs>
		</HydrationBoundary>
	);
}
