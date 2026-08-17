import { BlocksIcon } from 'lucide-react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { EditRouteTopBar } from '@/components/edit-route/frame/EditRouteTopBar';
import { openAPIClient } from '@/util/fetch';
import { CloseButton } from '../CloseButton';
import { MetadataTemplateEditMetadataFieldsFooter } from './MetadataTemplateEditMetadataFieldsFooter';
import { MetadataTemplateEditMetadataFieldsForm } from './MetadataTemplateEditMetadataFieldsForm';

export const metadata: Metadata = {
	title: 'Edit metadata template',
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

	if (response.status === 404) {
		notFound();
	}

	const { data: metadataTemplateFieldsData } = await openAPIClient.GET('/api/v1/metadata-template-field/', {
		params: { query: { metadata_template: metadataTemplateContainerData?.latest_metadata_template?.pk ?? '' } },
	});

	return (
		<>
			<EditRouteTopBar
				closeButton={<CloseButton metadataTemplateContainerUuid={metadataTemplateContainerUuid} />}
				title="Edit metadata fields"
			/>
			<div className="mx-auto flex w-full max-w-[536px] grow flex-col gap-8 px-4 py-12 md:px-0">
				<div className="flex place-items-center gap-1">
					<BlocksIcon
						aria-hidden
						className="shrink-0 text-base-neutral-600 dark:text-base-neutral-300"
						size={18}
						strokeWidth={1.5}
					/>
					<span className="text-base-sm text-neutral-500 dark:text-neutral-300">
						{metadataTemplateContainerData?.name}
					</span>
				</div>
				<MetadataTemplateEditMetadataFieldsForm
					data={metadataTemplateContainerData!}
					metadataTemplateContainerUuid={metadataTemplateContainerUuid}
					metadataTemplateFieldsData={metadataTemplateFieldsData?.results}
				/>
			</div>
			<MetadataTemplateEditMetadataFieldsFooter metadataTemplateContainerUuid={metadataTemplateContainerUuid} />
		</>
	);
}
