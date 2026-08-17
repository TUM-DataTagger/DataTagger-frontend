import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import type { Metadata } from 'next';
import { $api } from '@/util/fetch';
import { getQueryClient } from '@/util/getQueryClient';
import { ProjectMetadataTemplatesView } from './ProjectMetadataTemplatesView';

export const metadata: Metadata = {
	title: 'Project page | Metadata templates',
};

const limit = 12;

export default async function Page({ params }: { readonly params: Promise<{ readonly projectUuid: string }> }) {
	const { projectUuid } = await params;

	const queryClient = getQueryClient();

	await Promise.all([
		queryClient.prefetchQuery(
			$api.queryOptions('get', '/api/v1/project/{id}/', {
				params: { path: { id: projectUuid } },
			}),
		),
		queryClient.prefetchQuery(
			$api.queryOptions('get', '/api/v1/project/{id}/metadata-template-container-pool/', {
				params: { path: { id: projectUuid } },
			}),
		),
	]);

	return (
		<div className="flex flex-col gap-6">
			<HydrationBoundary state={dehydrate(queryClient)}>
				<ProjectMetadataTemplatesView limit={limit} projectUuid={projectUuid} />
			</HydrationBoundary>
		</div>
	);
}
