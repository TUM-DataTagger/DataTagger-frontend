'use client';

import { format } from '@formkit/tempo';
import { useSuspenseQueries } from '@tanstack/react-query';
import { CheckIcon, Wand2Icon } from 'lucide-react';
import { useParams } from 'next/navigation';
import { GridList, GridListItem } from '@/components/ui/GridList';
import { gridCardStyles } from '@/styles/ui/gridCard';
import { $api } from '@/util/clientFetch';
import type { components } from '@/util/openapiSchema';
import { ProjectFolderMetadataTemplatesCreateGrid } from './ProjectFolderMetadataTemplatesCreateGrid';
// import { ProjectFolderFilesMoreMenu } from './ProjectFolderFilesMoreMenu';
// import { ProjectFolderFilesUploadGrid } from './ProjectFolderFilesUploadGrid';

type ProjectFolderMetadataTemplate = components['schemas']['MetadataTemplate'];

export function ProjectFolderMetadataTemplatesGrid(props: {
	readonly data?: ProjectFolderMetadataTemplate[] | undefined;
}) {
	const params = useParams<{ readonly folderUuid: string; readonly projectUuid: string }>();

	const [projectData, folderData] = useSuspenseQueries({
		queries: [
			$api.queryOptions('get', '/api/v1/project/{id}/', {
				params: { path: { id: params.projectUuid } },
			}),
			$api.queryOptions('get', '/api/v1/folder/{id}/', {
				params: { path: { id: params.folderUuid } },
			}),
		],
	});

	return (
		<div className="flex flex-wrap gap-6">
			<GridList aria-label="Folders" className="layout-grid:gap-3.5" layout="grid">
				<ProjectFolderMetadataTemplatesCreateGrid
					folderUuid={params.folderUuid}
					href={`/projects/${params.projectUuid}/folders/${params.folderUuid}/metadata-templates/create`}
				>
					Metadata templates
				</ProjectFolderMetadataTemplatesCreateGrid>
				{props.data?.map((item) => (
					<GridListItem
						className="cursor-pointer rounded-xl"
						href={`/metadata-templates/${item.pk}`}
						id={item.pk}
						key={item.pk}
						textValue={item.name}
					>
						<div className="relative h-[150px] w-full min-w-64 gap-6 md:w-auto">
							<div className="absolute top-2 right-2">
								{item.pk === projectData.data.metadata_template?.pk ||
								item.pk === folderData.data.metadata_template?.pk ? (
									<div className="bg-base-lavender-600 absolute top-2 right-2 flex h-[18px] w-[18px] min-w-[18px] place-content-center place-items-center place-self-start rounded-full">
										<CheckIcon aria-hidden className="text-base-neutral-0" size={16} strokeWidth={3} />
									</div>
								) : null}
								{/* <ProjectFolderFilesMoreMenu
									fileUuid={dataset.pk}
									filename={dataset.display_name}
									folderUuid={params.folderUuid}
									uuid={params.uuid}
									versionUuid={dataset.latest_version?.pk}
								/>
								<ProjectFolderFilesMobileMoreMenu
									fileUuid={dataset.pk}
									filename={dataset.display_name}
									folderUuid={params.folderUuid}
									uuid={params.uuid}
									versionUuid={dataset.latest_version?.pk}
								/> */}
							</div>
							<div
								className={gridCardStyles({
									variant: 'link',
								})}
							>
								<div className="flex grow flex-col place-content-between">
									<div className="flex flex-col gap-3">
										<span className="group-active:text-base-neutral-900 group-hover:text-base-lavender-600 group-hover:group-active:text-base-neutral-900 group-focus-visible:text-base-lavender-600 dark:group-active:text-base-neutral-40 dark:group-hover:text-base-lavender-400 dark:group-hover:group-active:text-base-neutral-40 dark:group-focus-visible:text-base-lavender-400 line-clamp-2 max-w-[25ch] break-words text-ellipsis">
											{item.name ?? 'Empty metadata template'}
										</span>
									</div>

									<div className="flex flex-col gap-4">
										<span className="text-base-sm text-base-neutral-600 dark:text-base-neutral-300 inline-flex place-items-center gap-2">
											<Wand2Icon aria-hidden size={18} strokeWidth={1.5} />{' '}
											<div className="flex flex-col gap-1">
												<span>{format(item.creation_date, 'MMM D, YYYY hh:mm', 'en')}</span>
												<span>{item.created_by.email}</span>
											</div>
										</span>
									</div>
								</div>
							</div>
						</div>
					</GridListItem>
				))}
			</GridList>
		</div>
	);
}
