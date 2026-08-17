import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import type { Metadata } from 'next';
import { $api } from '@/util/fetch';
import { getQueryClient } from '@/util/getQueryClient';
import { ProjectMembersView } from './ProjectMembersView';

export const metadata: Metadata = {
	title: 'Project page | Members',
};

const limit = 12;

export default async function Page({ params }: { readonly params: Promise<{ readonly projectUuid: string }> }) {
	const { projectUuid } = await params;

	const queryClient = getQueryClient();

	await queryClient.prefetchQuery(
		$api.queryOptions('get', '/api/v1/project-membership/', {
			params: { query: { project: projectUuid, ordering: '-is_project_admin,member__email' } },
		}),
	);

	return (
		<div className="flex flex-col gap-6">
			<HydrationBoundary state={dehydrate(queryClient)}>
				<ProjectMembersView limit={limit} projectUuid={projectUuid} />
			</HydrationBoundary>
		</div>
	);
}
