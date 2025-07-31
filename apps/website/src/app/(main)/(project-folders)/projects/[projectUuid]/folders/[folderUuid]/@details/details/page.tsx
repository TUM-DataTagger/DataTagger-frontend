import { format } from '@formkit/tempo';
import { Wand2Icon } from 'lucide-react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ShareButton } from '@/components/ShareButton';
import { Editor } from '@/components/editor/Editor';
import { Tag, TagGroup } from '@/components/ui/TagGroup';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/Tooltip';
import { openAPIClient } from '@/util/fetch';
import { ProjectFolderDetailsMenu } from './ProjectFolderDetailsMenu';
import { ProjectFolderDetailsMoreMenu } from './ProjectFolderDetailsMoreMenu';

export const metadata: Metadata = {
	title: 'Folder page | Details',
};

export default async function Page({
	params,
}: {
	readonly params: Promise<{ readonly folderUuid: string; readonly projectUuid: string }>;
}) {
	const { folderUuid, projectUuid } = await params;

	const { data: folderData, response } = await openAPIClient.GET('/api/v1/folder/{id}/', {
		params: { path: { id: folderUuid } },
	});

	if (response.status === 404) {
		notFound();
	}

	const { data: projectData } = await openAPIClient.GET('/api/v1/project/{id}/', {
		params: { path: { id: projectUuid } },
	});

	const description = Object.keys(folderData?.description ?? {}).length
		? // @ts-expect-error: Really annoying to type
			folderData?.description?.content?.[0]?.content?.length
			? folderData?.description
			: null
		: null;

	const { data: metadataTemplate } = await openAPIClient.GET('/api/v1/metadata-template/{id}/', {
		params: { path: { id: folderData?.metadata_template?.pk ?? '' } },
	});

	return (
		<div className="flex flex-col gap-6">
			<div className="flex place-content-end place-items-center">
				<div className="hidden place-items-center gap-2 md:flex">
					<ShareButton />
					{(folderData?.datasets_count ?? 0) > 0 && (
						<ProjectFolderDetailsMenu folderUuid={folderUuid} projectUuid={projectUuid} />
					)}
					{folderData?.datasets_count === 0 && (
						<ProjectFolderDetailsMoreMenu
							folderName={folderData?.name}
							folderUuid={folderUuid}
							isDeletable={folderData?.datasets_count === 0}
							projectUuid={projectUuid}
						/>
					)}
				</div>
			</div>

			<div className="item grid grid-cols-[160px_minmax(0,1fr)] items-center gap-y-2">
				{projectData ? (
					<>
						<div>Project</div>
						<TagGroup aria-label="Project">
							<Tag className="cursor-pointer" href={`/projects/${projectData.pk}`} target="_blank">
								{projectData.name}
							</Tag>
						</TagGroup>
					</>
				) : null}
				{metadataTemplate ? (
					<>
						<div>Metadata Template</div>
						<TagGroup aria-label="Metadata Template">
							<Tag className="cursor-pointer" href={`/metadata-templates/${metadataTemplate.pk}`} target="_blank">
								{metadataTemplate.name}
							</Tag>
						</TagGroup>
					</>
				) : null}
				<div>Storage</div>
				<div>DSS</div>
			</div>

			{description ? <Editor content={description} /> : null}

			<Tooltip delay={400}>
				<TooltipTrigger
					className="text-base-sm text-base-neutral-600 dark:text-base-neutral-300 cursor-auto place-self-start print:inline-flex"
					variant="unset"
				>
					<Wand2Icon aria-hidden size={18} strokeWidth={1.5} /> {folderData?.created_by.email} -{' '}
					{format(folderData?.creation_date ?? new Date(), 'medium', 'en')}
				</TooltipTrigger>
				<TooltipContent variant="plain">Created by / Created at</TooltipContent>
			</Tooltip>
		</div>
	);
}
