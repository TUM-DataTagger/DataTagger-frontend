import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { PackageOpenIcon, HelpCircleIcon } from 'lucide-react';
import type { Metadata } from 'next/types';
import { Tag, TagGroup } from '@/components/ui/TagGroup';
import { TooltipTrigger, TooltipContent, Tooltip } from '@/components/ui/Tooltip';
import { $api } from '@/util/fetch';
import { getQueryClient } from '@/util/getQueryClient';
import { DraftsView } from './DraftsView';

export const metadata: Metadata = {
	title: 'My draft files',
};

export default async function Page({
	searchParams,
}: {
	readonly searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
	const { page: searchParamsPage, sort: searchParamsSort } = await searchParams;

	const page = searchParamsPage ? Number(searchParamsPage) : 1;
	const limit = 12;
	const offset = (page - 1) * limit;
	const sort = searchParamsSort ?? '-creation_date';

	const queryClient = getQueryClient();

	await queryClient.prefetchQuery(
		$api.queryOptions('get', '/api/v1/uploads-dataset/', {
			params: { query: { limit, offset, ordering: sort } },
		}),
	);

	return (
		<div className="mx-auto flex w-full max-w-[852px] grow flex-col gap-6 px-4 py-12 print:max-w-none">
			<div className="flex flex-col gap-6">
				<TagGroup aria-label="Home">
					<Tag color="neutral">Welcome to TUM DataTagger</Tag>
				</TagGroup>
				<div className="flex flex-col gap-4">
					<h1 className="text-base-heading-md flex place-items-center gap-3">
						<PackageOpenIcon aria-hidden size={40} strokeWidth={1} /> My draft files
					</h1>
					<div className="flex place-items-center gap-1">
						<span className="text-base-neutral-600 dark:text-base-neutral-300">
							Temporary space to prepare files before assigning them to a folder.
						</span>
						<Tooltip delay={400}>
							<TooltipTrigger variant="tooltip">
								<HelpCircleIcon aria-hidden size={18} strokeWidth={1.5} />
							</TooltipTrigger>
							<TooltipContent showArrow={false} variant="rich">
								30 days after being uploaded to the "My draft files", a listed item will be automatically deleted.
								<br />
								<br />
								To permanently store and share files, go to "Projects".
							</TooltipContent>
						</Tooltip>
					</div>
				</div>
			</div>
			<div className="border-base-neutral-200 dark:border-base-neutral-600 border-b" />

			<HydrationBoundary state={dehydrate(queryClient)}>
				<DraftsView limit={limit} />
			</HydrationBoundary>
		</div>
	);
}
