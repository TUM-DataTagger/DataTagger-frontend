import { format } from '@formkit/tempo';
import { Wand2Icon } from 'lucide-react';
import type { Metadata } from 'next';
import { ShareButton } from '@/components/ShareButton';
import { Editor } from '@/components/editor/Editor';
import { Tag, TagGroup } from '@/components/ui/TagGroup';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/Tooltip';
import { openAPIClient } from '@/util/fetch';
import { ProjectDetailsMenu } from './ProjectDetailsMenu';
import { ProjectDetailsMoreMenu } from './ProjectDetailsMoreMenu';

export const metadata: Metadata = {
	title: 'Project page | Details',
};

export default async function Page({ params }: { readonly params: Promise<{ readonly projectUuid: string }> }) {
	const { projectUuid } = await params;

	const { data: projectData } = await openAPIClient.GET('/api/v1/project/{id}/', {
		params: { path: { id: projectUuid } },
	});

	const description = Object.keys(projectData?.description ?? {}).length
		? // @ts-expect-error: Really annoying to type
			projectData?.description?.content?.[0]?.content?.length
			? projectData?.description
			: null
		: null;

	const { data: metadataTemplateData } = await openAPIClient.GET('/api/v1/metadata-template/{id}/', {
		params: { path: { id: projectData?.metadata_template?.pk ?? '' } },
	});

	return (
		<div className="flex flex-col gap-6">
			<div className="flex place-content-end place-items-center">
				<div className="hidden place-items-center gap-2 md:flex">
					<ShareButton />
					{projectData?.is_deletable ? (
						<ProjectDetailsMoreMenu
							isDeletable={projectData?.is_deletable}
							projectName={projectData?.name}
							projectUuid={projectUuid}
						/>
					) : (
						<ProjectDetailsMenu projectUuid={projectUuid} />
					)}
				</div>
			</div>

			{metadataTemplateData ? (
				<div className="item grid grid-cols-[160px_minmax(0,1fr)] items-center gap-y-2">
					<div>Metadata Template</div>
					<TagGroup aria-label="Metadata Template">
						<Tag className="cursor-pointer" href={`/metadata-templates/${metadataTemplateData.pk}`} target="_blank">
							{metadataTemplateData.name}
						</Tag>
					</TagGroup>
				</div>
			) : null}

			{description ? <Editor content={description} /> : null}

			<Tooltip delay={400}>
				<TooltipTrigger
					className="text-base-sm text-base-neutral-600 dark:text-base-neutral-300 cursor-auto place-self-start print:inline-flex"
					variant="unset"
				>
					<Wand2Icon aria-hidden size={18} strokeWidth={1.5} /> {projectData?.created_by.email}
					{projectData ? ` - ${format(projectData?.creation_date, 'medium', 'en')}` : null}
				</TooltipTrigger>
				<TooltipContent variant="plain">Created by / Created at</TooltipContent>
			</Tooltip>
		</div>
	);
}
