import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { FileIcon } from 'lucide-react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { FileCreationDates, FileHeading, FileMetadata, FileThumbnail, FileUpdate } from '@/components/File';
import { VersionHistoryCheck } from '@/components/VersionHistory';
import { Separator } from '@/components/ui/Separator';
import { $api, openAPIClient } from '@/util/fetch';
import { getQueryClient } from '@/util/getQueryClient';
import { DraftBadges } from './DraftBadges';
import { DraftBreadcrumbs } from './DraftBreadcrumbs';
import { DraftFileMoreMenu } from './DraftFileMoreMenu';

export const metadata: Metadata = {
	title: 'Draft file',
};

export default async function Page({ params }: { readonly params: Promise<{ readonly fileUuid: string }> }) {
	const { fileUuid } = await params;

	const { data: datasetData, response } = await openAPIClient.GET('/api/v1/uploads-dataset/{id}/', {
		params: { path: { id: fileUuid } },
	});

	if (response.status === 404 || !datasetData?.latest_version) {
		notFound();
	}

	const queryClient = getQueryClient();

	await Promise.all([
		queryClient.prefetchQuery(
			$api.queryOptions('get', '/api/v1/uploads-dataset/{id}/', {
				params: { path: { id: fileUuid } },
			}),
		),
		queryClient.prefetchQuery(
			$api.queryOptions('get', '/api/v1/uploads-version/{id}/', {
				params: { path: { id: datasetData.latest_version.pk } },
			}),
		),
	]);

	return (
		<div className="flex flex-col-reverse place-content-center gap-6 2xl:flex-row">
			<HydrationBoundary state={dehydrate(queryClient)}>
				<div className="flex flex-col gap-6 2xl:grid 2xl:grid-cols-[minmax(0,396px)_816px_396px]">
					<div className="flex place-content-between place-items-center 2xl:col-span-1 2xl:col-start-2">
						<DraftBreadcrumbs fileUuid={fileUuid} />
						<DraftFileMoreMenu fileUuid={fileUuid} />
					</div>

					<div className="flex flex-col gap-3 2xl:col-span-1 2xl:col-start-2">
						<DraftBadges fileUuid={fileUuid} />
						<div className="flex place-items-center gap-3">
							<FileIcon aria-hidden className="shrink-0" size={24} strokeWidth={1.5} />
							<FileHeading fileUuid={fileUuid} />
						</div>
					</div>

					<div className="flex flex-col-reverse gap-6 2xl:col-span-2 2xl:col-start-2 2xl:inline-grid 2xl:grid-cols-[816px_396px]">
						<div className="flex flex-col gap-6">
							<FileMetadata fileUuid={fileUuid} isDraft />
						</div>

						<div className="flex min-h-[262px] flex-col gap-6">
							<div className="flex gap-4">
								<FileThumbnail className="shrink-0" fileUuid={fileUuid} />
								<FileUpdate fileUuid={fileUuid} isDraft />
							</div>

							<div className="flex break-after-page flex-col gap-6">
								<FileCreationDates fileUuid={fileUuid} />
							</div>
							<Separator className="md:hidden print:hidden" />
						</div>
					</div>
				</div>
			</HydrationBoundary>
			<VersionHistoryCheck />
		</div>
	);
}
