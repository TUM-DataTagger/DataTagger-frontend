import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { openAPIClient } from '@/util/fetch';
import { CloseButton } from '../CloseButton';
import { DraftFileEditMetadataFooter } from './DraftFileEditMetadataFooter';
import { DraftFileEditMetadataForm } from './DraftFileEditMetadataForm';

export const metadata: Metadata = {
	title: 'Edit draft file metadata',
};

export default async function Page({ params }: { readonly params: Promise<{ readonly fileUuid: string }> }) {
	const { fileUuid } = await params;

	const { data: datasetData, response } = await openAPIClient.GET('/api/v1/uploads-dataset/{id}/', {
		params: { path: { id: fileUuid } },
	});

	if (response.status === 404 || !datasetData?.latest_version) {
		notFound();
	}

	const { data: datasetVersionData } = await openAPIClient.GET('/api/v1/uploads-version/{id}/', {
		params: { path: { id: datasetData.latest_version.pk } },
	});

	return (
		<>
			<div className="bg-base-neutral-800 text-base-xl text-base-neutral-40 dark:bg-base-neutral-100 dark:text-base-neutral-900 sticky top-0 z-10 flex h-16 place-content-between place-items-center px-4 pt-6 pb-4 md:px-[132px]">
				<span>Edit metadata</span>
				<CloseButton fileUuid={fileUuid} />
			</div>
			<div className="mx-auto flex w-full max-w-[536px] grow flex-col gap-4 px-4 py-12 md:px-0">
				<DraftFileEditMetadataForm data={datasetData} fileMetadata={datasetVersionData} fileUuid={fileUuid} />
			</div>
			<DraftFileEditMetadataFooter fileUuid={fileUuid} />
		</>
	);
}
