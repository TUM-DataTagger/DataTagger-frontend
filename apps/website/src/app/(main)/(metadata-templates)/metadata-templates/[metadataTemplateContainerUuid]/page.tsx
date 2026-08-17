import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
	MetadataTemplateContainerBadgeLink,
	MetadataTemplateContainerHeading,
	MetadataTemplateContainerLockAlert,
} from '@/components/metadata-template/MetadataTemplateContainer';
import { MetadataTemplateVersionHistoryCheck } from '@/components/metadata-template/MetadataTemplateVersionHistory';
import { $api, openAPIClient } from '@/util/fetch';
import { getQueryClient } from '@/util/getQueryClient';
import { MetadataTemplateContainerBreadcrumbs } from './MetadataTemplateContainerBreadcrumbs';
import { MetadataTemplateContainerMetadata } from './MetadataTemplateContainerMetadata';
import { MetadataTemplateContainerMoreMenu } from './MetadataTemplateContainerMoreMenu';

export const metadata: Metadata = {
	title: 'Metadata template',
};

export default async function Page({
	params,
}: {
	readonly params: Promise<{ readonly metadataTemplateContainerUuid: string }>;
}) {
	const { metadataTemplateContainerUuid } = await params;

	const { data: metadataTemplateContainerData, response } = await openAPIClient.GET(
		'/api/v1/metadata-template-container/{id}/',
		{
			params: { path: { id: metadataTemplateContainerUuid } },
		},
	);

	if (response.status === 404 || !metadataTemplateContainerData?.latest_metadata_template) {
		notFound();
	}

	const latestMetadataTemplatePk = metadataTemplateContainerData.latest_metadata_template.pk;

	const queryClient = getQueryClient();

	await Promise.all([
		queryClient.prefetchQuery(
			$api.queryOptions('get', '/api/v1/metadata-template/{id}/', {
				params: { path: { id: latestMetadataTemplatePk } },
			}),
		),
		queryClient.prefetchQuery(
			$api.queryOptions('get', '/api/v1/metadata-template-field/', {
				params: { query: { metadata_template: latestMetadataTemplatePk } },
			}),
		),
	]);

	return (
		<div className="flex flex-col-reverse place-content-center gap-6">
			<HydrationBoundary state={dehydrate(queryClient)}>
				<div className="flex flex-col gap-6">
					<MetadataTemplateContainerLockAlert metadataTemplateContainerUuid={metadataTemplateContainerUuid} />
					<div className="flex place-content-between place-items-center">
						<MetadataTemplateContainerBreadcrumbs metadataTemplateContainerUuid={metadataTemplateContainerUuid} />
						<MetadataTemplateContainerMoreMenu metadataTemplateContainerUuid={metadataTemplateContainerUuid} />
					</div>

					<div className="flex flex-col gap-3">
						<MetadataTemplateContainerBadgeLink
							contentType={metadataTemplateContainerData?.assigned_to_content_type}
							name={metadataTemplateContainerData?.assigned_to_content_object_name}
							projectUuid={metadataTemplateContainerData?.project?.pk}
							uuid={metadataTemplateContainerData?.assigned_to_object_id}
						/>
						<MetadataTemplateContainerHeading metadataTemplateContainerUuid={metadataTemplateContainerUuid} />
					</div>

					<div className="flex flex-col gap-6">
						<div className="flex flex-col gap-6">
							<MetadataTemplateContainerMetadata metadataTemplateContainerUuid={metadataTemplateContainerUuid} />
						</div>
					</div>
				</div>
			</HydrationBoundary>
			<MetadataTemplateVersionHistoryCheck />
		</div>
	);
}
