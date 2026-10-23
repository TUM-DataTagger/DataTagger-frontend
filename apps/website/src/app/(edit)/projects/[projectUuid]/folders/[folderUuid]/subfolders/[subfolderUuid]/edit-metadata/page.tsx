import { FolderIcon } from 'lucide-react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { EditRouteCancelButton } from '@/components/edit-route/frame/EditRouteCancelButton';
import { EditRouteCloseButton } from '@/components/edit-route/frame/EditRouteCloseButton';
import { EditRouteSaveFooter } from '@/components/edit-route/frame/EditRouteSaveFooter';
import { EditRouteTopBar } from '@/components/edit-route/frame/EditRouteTopBar';
import {
	SUBFOLDER_METADATA_FORM_ID,
	SubfolderMetadataEditForm,
} from '@/components/edit-route/subfolder-metadata/SubfolderMetadataEditForm';
import { openAPIClient } from '@/util/fetch';

export const metadata: Metadata = {
	title: 'Edit subfolder metadata',
};

export default async function Page({
	params,
}: {
	readonly params: Promise<{
		readonly folderUuid: string;
		readonly projectUuid: string;
		readonly subfolderUuid: string;
	}>;
}) {
	const { folderUuid, projectUuid, subfolderUuid } = await params;

	const [{ data: subfolderData, response }, { data: folderData }] = await Promise.all([
		openAPIClient.GET('/api/v1/subfolder/{id}/', { params: { path: { id: subfolderUuid } } }),
		openAPIClient.GET('/api/v1/folder/{id}/', { params: { path: { id: folderUuid } } }),
	]);

	if (response.status === 404 || !subfolderData || subfolderData.folder !== folderUuid) {
		notFound();
	}

	const subfolderHref = `/projects/${projectUuid}/folders/${folderUuid}?subfolder=${subfolderUuid}`;

	return (
		<>
			<EditRouteTopBar closeButton={<EditRouteCloseButton href={subfolderHref} />} title="Edit metadata" />
			<div className="mx-auto flex w-full max-w-[536px] grow flex-col gap-8 px-4 py-12 md:px-0">
				<div className="flex flex-col gap-4">
					<div className="flex place-items-center gap-1">
						<FolderIcon
							aria-hidden
							className="shrink-0 text-base-neutral-600 dark:text-base-neutral-300"
							size={18}
							strokeWidth={1.5}
						/>
						<span className="text-base-sm break-all text-neutral-500 dark:text-neutral-300">{subfolderData.name}</span>
					</div>
					<div className="flex flex-col gap-2">
						<span className="text-base-sm text-neutral-500 dark:text-neutral-300">
							Project: {folderData?.project.name}
						</span>
						<span className="text-base-sm text-neutral-500 dark:text-neutral-300">
							Folder: {[folderData?.name, ...subfolderData.path.map((item) => item.name)].join(' / ')}
						</span>
					</div>
				</div>
				<SubfolderMetadataEditForm redirectPath={subfolderHref} subfolder={subfolderData} />
			</div>
			<EditRouteSaveFooter
				cancelButton={<EditRouteCancelButton href={subfolderHref} />}
				form={SUBFOLDER_METADATA_FORM_ID}
			/>
		</>
	);
}
