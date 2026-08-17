import { FileIcon, FileWarningIcon } from 'lucide-react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { EditRouteTopBar } from '@/components/edit-route/frame/EditRouteTopBar';
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
			<EditRouteTopBar closeButton={<CloseButton fileUuid={fileUuid} />} title="Edit metadata" />
			<div className="mx-auto flex w-full max-w-[536px] grow flex-col gap-8 px-4 py-12 md:px-0">
				<div className="flex place-items-center gap-1">
					{datasetVersionData?.version_file ? (
						<FileIcon
							aria-hidden
							className="shrink-0 text-base-neutral-600 dark:text-base-neutral-300"
							size={18}
							strokeWidth={1.5}
						/>
					) : (
						<FileWarningIcon
							aria-hidden
							className="shrink-0 text-base-tangerine-600 dark:text-base-tangerine-400"
							size={18}
							strokeWidth={1.5}
						/>
					)}
					<span className="text-base-sm break-all text-neutral-500 dark:text-neutral-300">
						{datasetData.display_name}
					</span>
				</div>
				<DraftFileEditMetadataForm data={datasetData} fileMetadata={datasetVersionData} fileUuid={fileUuid} />
			</div>
			<DraftFileEditMetadataFooter fileUuid={fileUuid} />
		</>
	);
}
