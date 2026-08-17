import { MetadataTemplateCreateHeader } from '@/components/metadata-template/create/MetadataTemplateCreateHeader';
import { openAPIClient } from '@/util/fetch';
import { MetadataTemplateCreateFooter } from './MetadataTemplateCreateFooter';
import { MetadataTemplateCreateForm } from './MetadataTemplateCreateForm';

export default async function Page({
	params,
}: {
	readonly params: Promise<{ readonly folderUuid: string; readonly projectUuid: string }>;
}) {
	const { folderUuid, projectUuid } = await params;

	const { data: folderData } = await openAPIClient.GET('/api/v1/folder/{id}/', {
		params: { path: { id: folderUuid } },
	});

	return (
		<>
			<MetadataTemplateCreateHeader>
				<h1 className="text-center text-base-heading-md dark:text-base-neutral-40">
					Set up your first metadata template
				</h1>
				<p className="max-w-[536px] place-self-center text-center text-base-md text-base-neutral-600 dark:text-base-neutral-300">
					Use metadata templates to create a reusable template for your metadata.
				</p>
			</MetadataTemplateCreateHeader>
			<div className="mx-auto flex w-full max-w-[536px] grow flex-col gap-4 px-4 py-12 md:px-0">
				<span className="text-base-sm text-base-neutral-600 dark:text-base-neutral-300">
					Folder: {folderData?.name}
				</span>
				<MetadataTemplateCreateForm folderUuid={folderUuid} projectUuid={projectUuid} />
			</div>
			<MetadataTemplateCreateFooter />
		</>
	);
}
