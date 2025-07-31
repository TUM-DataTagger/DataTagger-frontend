import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { HelpCircleIcon, PackageIcon } from 'lucide-react';
import type { Metadata } from 'next/types';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/Tooltip';
import { $api } from '@/util/fetch';
import { getQueryClient } from '@/util/getQueryClient';
import { ProjectsView } from './ProjectsView';

export const metadata: Metadata = {
	title: 'Projects',
};

export default async function Page({
	searchParams,
}: {
	readonly searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
	const {
		page: searchParamsPage,
		sort: searchParamsSort,
		created_by: searchParamsCreatedBy,
		my_permissions: searchParamsMyPermissions,
	} = await searchParams;

	const page = searchParamsPage ? Number(searchParamsPage) : 1;
	const limit = 12;
	const offset = (page - 1) * limit;
	const sort = searchParamsSort ?? 'name';
	const created_by = searchParamsCreatedBy;
	const my_permissions = searchParamsMyPermissions;

	const queryClient = getQueryClient();

	await queryClient.prefetchQuery(
		$api.queryOptions('get', '/api/v1/project/', {
			params: {
				query: {
					limit,
					offset,
					ordering: sort,
					created_by: created_by as 'me' | 'others',
					membership: my_permissions as 'admin' | 'member',
				},
			},
		}),
	);

	return (
		<div className="mx-auto flex w-full max-w-[852px] grow flex-col gap-6 px-4 py-12 print:max-w-none">
			<div className="flex flex-col gap-6">
				<div className="flex flex-col gap-4">
					<h1 className="text-base-heading-md flex place-items-center gap-3">
						<PackageIcon aria-hidden size={40} strokeWidth={1} /> Projects
					</h1>
					<div className="flex place-items-center gap-1">
						<span className="text-base-neutral-600 dark:text-base-neutral-300">
							Projects as collaborative container for research data.
						</span>
						<Tooltip delay={400}>
							<TooltipTrigger variant="tooltip">
								<HelpCircleIcon aria-hidden size={18} strokeWidth={1.5} />
							</TooltipTrigger>
							<TooltipContent showArrow={false} variant="rich">
								Within a project, you can organize your data with folders, manage access, and annotate with metadata.
							</TooltipContent>
						</Tooltip>
					</div>
				</div>
			</div>
			<div className="border-base-neutral-200 dark:border-base-neutral-600 border-b" />

			<HydrationBoundary state={dehydrate(queryClient)}>
				<ProjectsView limit={limit} />
			</HydrationBoundary>
		</div>
	);
}
