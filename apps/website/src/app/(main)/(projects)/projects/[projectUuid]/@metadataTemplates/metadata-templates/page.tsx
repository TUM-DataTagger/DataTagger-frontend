import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import type { Metadata } from 'next';
import { $api } from '@/util/fetch';
import { getQueryClient } from '@/util/getQueryClient';
import { ProjectMetadataTemplatesView } from './ProjectMetadataTemplatesView';

export const metadata: Metadata = {
	title: 'Project page | Metadata templates',
};

export default async function Page({
	params,
	searchParams,
}: {
	readonly params: Promise<{ readonly projectUuid: string }>;
	readonly searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
	const { projectUuid } = await params;
	const { sort: searchParamsSort } = await searchParams;

	const sort = searchParamsSort ?? 'name';

	const queryClient = getQueryClient();

	await Promise.all([
		queryClient.prefetchQuery(
			$api.queryOptions('get', '/api/v1/project/{id}/', {
				params: { path: { id: projectUuid } },
			}),
		),
		queryClient.prefetchQuery(
			$api.queryOptions('get', '/api/v1/metadata-template/', {
				params: { query: { assigned_to_object_id: projectUuid, limit: 9_999, ordering: sort } },
			}),
		),
	]);

	return (
		<div className="flex flex-col gap-6">
			<HydrationBoundary state={dehydrate(queryClient)}>
				<ProjectMetadataTemplatesView projectUuid={projectUuid} />
			</HydrationBoundary>
		</div>
	);
}
