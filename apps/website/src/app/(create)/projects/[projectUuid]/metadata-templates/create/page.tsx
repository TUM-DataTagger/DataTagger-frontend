import { openAPIClient } from '@/util/fetch';
import { MetadataTemplateCreateFooter } from './MetadataTemplateCreateFooter';
import { MetadataTemplateCreateForm } from './MetadataTemplateCreateForm';
import { MetadataTemplateCreateHeader } from './MetadataTemplateCreateHeader';

export default async function Page({ params }: { readonly params: Promise<{ readonly projectUuid: string }> }) {
	const { projectUuid } = await params;

	const { data: projectData } = await openAPIClient.GET('/api/v1/project/{id}/', {
		params: { path: { id: projectUuid } },
	});

	return (
		<>
			<MetadataTemplateCreateHeader>
				<h1 className="text-base-heading-md dark:text-base-neutral-40 text-center">
					Set up your first metadata template
				</h1>
				<p className="text-base-md text-base-neutral-600 dark:text-base-neutral-300 max-w-[536px] place-self-center text-center">
					Use metadata templates to create a reusable template for your metadata.
				</p>
			</MetadataTemplateCreateHeader>
			<div className="mx-auto flex w-full max-w-[536px] grow flex-col gap-4 px-4 py-12 md:px-0">
				<span className="text-base-sm text-base-neutral-600 dark:text-base-neutral-300">
					Project: {projectData?.name}
				</span>
				<MetadataTemplateCreateForm projectUuid={projectUuid} />
			</div>
			<MetadataTemplateCreateFooter />
		</>
	);
}
