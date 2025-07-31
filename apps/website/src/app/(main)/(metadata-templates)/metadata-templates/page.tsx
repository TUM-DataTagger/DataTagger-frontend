import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { BlocksIcon, HelpCircleIcon } from 'lucide-react';
import type { Metadata } from 'next/types';
import { TooltipContent, TooltipTrigger, Tooltip } from '@/components/ui/Tooltip';
import { $api } from '@/util/fetch';
import { getQueryClient } from '@/util/getQueryClient';
import { MetadataTemplatesView } from './MetadataTemplatesView';

export const metadata: Metadata = {
	title: 'Metadata templates',
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
	const sort = searchParamsSort ?? 'name';

	const queryClient = getQueryClient();

	await queryClient.prefetchQuery(
		$api.queryOptions('get', '/api/v1/metadata-template/', {
			params: { query: { limit, offset, ordering: sort } },
		}),
	);

	return (
		<div className="mx-auto flex w-full max-w-[852px] grow flex-col gap-6 px-4 py-12 print:max-w-none">
			<div className="flex flex-col gap-6">
				<div className="flex flex-col gap-4">
					<h1 className="text-base-heading-md flex place-items-center gap-3">
						<BlocksIcon aria-hidden size={40} strokeWidth={1.5} /> Metadata templates
					</h1>
					<div className="flex place-items-center gap-1">
						<span className="text-base-neutral-600 dark:text-base-neutral-300">
							Metadata templates are user-defined collections of metadata fields.
						</span>
						<Tooltip delay={400}>
							<TooltipTrigger variant="tooltip">
								<HelpCircleIcon aria-hidden size={18} strokeWidth={1.5} />
							</TooltipTrigger>
							<TooltipContent showArrow={false} variant="rich">
								Templates can be created and activated in projects and folders.
							</TooltipContent>
						</Tooltip>
					</div>
				</div>
			</div>
			<div className="border-base-neutral-200 dark:border-base-neutral-600 border-b" />

			<HydrationBoundary state={dehydrate(queryClient)}>
				<MetadataTemplatesView limit={limit} />
			</HydrationBoundary>
		</div>
	);
}
