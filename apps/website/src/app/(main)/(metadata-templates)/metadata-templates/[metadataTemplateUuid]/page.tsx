import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { notFound } from 'next/navigation';
import { MetadataTemplateBadge, MetadataTemplateHeading } from '@/components/MetadataTemplate';
import { $api, openAPIClient } from '@/util/fetch';
import { getQueryClient } from '@/util/getQueryClient';
import { MetadataTemplateBreadcrumbs } from './MetadataTemplateBreadcrumbs';
import { MetadataTemplateMetadata } from './MetadataTemplateMetadata';
import { MetadataTemplateMoreMenu } from './MetadataTemplateMoreMenu';

export default async function Page({
	params,
}: {
	readonly params: Promise<{ readonly metadataTemplateUuid: string }>;
}) {
	const { metadataTemplateUuid } = await params;

	const { data, response } = await openAPIClient.GET('/api/v1/metadata-template/{id}/', {
		params: { path: { id: metadataTemplateUuid } },
	});

	if (response.status === 404) {
		notFound();
	}

	const queryClient = getQueryClient();

	await Promise.all([
		queryClient.prefetchQuery(
			$api.queryOptions('get', '/api/v1/metadata-template/{id}/', {
				params: { path: { id: metadataTemplateUuid } },
			}),
		),
		queryClient.prefetchQuery(
			$api.queryOptions('get', '/api/v1/metadata-template-field/', {
				params: { query: { metadata_template: metadataTemplateUuid } },
			}),
		),
	]);

	return (
		<div className="flex flex-col-reverse place-content-center gap-6">
			<HydrationBoundary state={dehydrate(queryClient)}>
				<div className="flex flex-col gap-6">
					<div className="flex place-content-between place-items-center">
						<MetadataTemplateBreadcrumbs metadataTemplateUuid={metadataTemplateUuid} />
						<MetadataTemplateMoreMenu metadataTemplateUuid={metadataTemplateUuid} />
					</div>

					<MetadataTemplateBadge
						contentType={data?.assigned_to_content_type}
						isLink
						name={data?.assigned_to_content_object_name}
						projectUuid={data?.project?.pk}
						uuid={data?.assigned_to_object_id}
					/>

					<div className="flex place-items-center gap-3">
						<MetadataTemplateHeading metadataTemplateUuid={metadataTemplateUuid} />
					</div>

					<div className="flex flex-col gap-6">
						<div className="flex flex-col gap-6">
							<MetadataTemplateMetadata metadataTemplateUuid={metadataTemplateUuid} />
						</div>
					</div>
				</div>
			</HydrationBoundary>
		</div>
	);
}
