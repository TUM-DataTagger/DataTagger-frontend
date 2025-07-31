import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
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
	readonly params: Promise<{ readonly metadataTemplateUuid: string }>;
}) {
	const { metadataTemplateUuid } = await params;

	const { data: metadataTemplateData, response } = await openAPIClient.GET('/api/v1/metadata-template/{id}/', {
		params: { path: { id: metadataTemplateUuid } },
	});

	if (response.status === 404) {
		notFound();
	}

	const { data: metadataTemplateFieldsData } = await openAPIClient.GET('/api/v1/metadata-template-field/', {
		params: { query: { metadata_template: metadataTemplateUuid } },
	});

	return (
		<>
			<div className="bg-base-neutral-800 text-base-xl text-base-neutral-40 dark:bg-base-neutral-100 dark:text-base-neutral-900 sticky top-0 z-10 flex h-16 place-content-between place-items-center px-4 pt-6 pb-4 md:px-[132px]">
				<span>Edit metadata fields</span>
				<CloseButton metadataTemplateUuid={metadataTemplateUuid} />
			</div>
			<div className="mx-auto flex w-full max-w-[536px] grow flex-col gap-4 px-4 py-12 md:px-0">
				<MetadataTemplateEditMetadataFieldsForm
					data={metadataTemplateData!}
					metadataTemplateFieldsData={metadataTemplateFieldsData?.results}
					metadataTemplateUuid={metadataTemplateUuid}
				/>
			</div>
			<MetadataTemplateEditMetadataFieldsFooter metadataTemplateUuid={metadataTemplateUuid} />
		</>
	);
}
