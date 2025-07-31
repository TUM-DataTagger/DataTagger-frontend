'use client';

import { format } from '@formkit/tempo';
import { useSuspenseQuery } from '@tanstack/react-query';
import { CheckIcon, Wand2Icon } from 'lucide-react';
import { useParams } from 'next/navigation';
import { GridList, GridListItem } from '@/components/ui/GridList';
import { gridCardStyles } from '@/styles/ui/gridCard';
import { $api } from '@/util/clientFetch';
import type { components } from '@/util/openapiSchema';
import { ProjectMetadataTemplatesCreateGrid } from './ProjectMetadataTemplatesCreateGrid';
// import { ProjectFoldersMoreMenu } from './ProjectFoldersMoreMenu';

type ProjectMetadataTemplate = components['schemas']['MetadataTemplate'];

export function ProjectMetadataTemplatesGrid(props: { readonly data?: ProjectMetadataTemplate[] | undefined }) {
	const params = useParams<{ readonly projectUuid: string }>();

	const { data: projectData } = useSuspenseQuery(
		$api.queryOptions('get', '/api/v1/project/{id}/', {
			params: { path: { id: params.projectUuid } },
		}),
	);

	return (
		<div className="flex flex-wrap gap-6">
			<GridList aria-label="Folders" className="layout-grid:gap-3.5" layout="grid">
				<ProjectMetadataTemplatesCreateGrid
					href={`/projects/${params.projectUuid}/metadata-templates/create`}
					projectUuid={params.projectUuid}
				>
					Metadata template
				</ProjectMetadataTemplatesCreateGrid>
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
								{item.pk === projectData.metadata_template?.pk ? (
									<div className="bg-base-lavender-600 absolute top-2 right-2 flex h-[18px] w-[18px] min-w-[18px] place-content-center place-items-center place-self-start rounded-full">
										<CheckIcon className="text-base-neutral-0" size={16} strokeWidth={3} />
									</div>
								) : null}
								{/* <ProjectFoldersMoreMenu
									datasetsCount={folder.datasets_count}
									folderName={folder.name}
									folderUuid={folder.pk}
									uuid={params.uuid}
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
