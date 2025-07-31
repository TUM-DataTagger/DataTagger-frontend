import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import type { Metadata } from 'next';
import { $api } from '@/util/fetch';
import { getQueryClient } from '@/util/getQueryClient';
import { ProjectFoldersView } from './ProjectFoldersView';

export const metadata: Metadata = {
	title: 'Project page | Folders',
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

	await queryClient.prefetchQuery(
		$api.queryOptions('get', '/api/v1/folder/', {
			params: { query: { project: projectUuid, limit: 9_999, ordering: sort } },
		}),
	);

	return (
		<div className="flex flex-col gap-6">
			<HydrationBoundary state={dehydrate(queryClient)}>
				<ProjectFoldersView projectUuid={projectUuid} />
			</HydrationBoundary>
		</div>
	);
}
