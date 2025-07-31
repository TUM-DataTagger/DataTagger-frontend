'use client';

import { format } from '@formkit/tempo';
import { Wand2Icon } from 'lucide-react';
import { MetadataTemplateBadge } from '@/components/MetadataTemplate';
import { GridList, GridListItem } from '@/components/ui/GridList';
import { gridCardStyles } from '@/styles/ui/gridCard';
import type { components } from '@/util/openapiSchema';
import { MetadataTemplatesCreateGrid } from './MetadataTemplatesCreateGrid';
// import { ProjectsMoreMenu } from './ProjectsMoreMenu';

type MetadataTemplate = components['schemas']['MetadataTemplate'];

export function MetadataTemplatesGrid(props: { readonly data?: MetadataTemplate[] | undefined }) {
	return (
		<div className="flex flex-wrap gap-6">
			<GridList aria-label="Projects" className="layout-grid:gap-3.5" layout="grid">
				<MetadataTemplatesCreateGrid href="/metadata-templates/create">Metadata template</MetadataTemplatesCreateGrid>
				{props.data?.map((item) => (
					<GridListItem
						className="cursor-pointer rounded-xl"
						href={`/metadata-templates/${item.pk}`}
						id={item.pk}
						key={item.pk}
						textValue={item.name}
					>
						<div className="relative h-[150px] w-full min-w-64 gap-6 md:max-w-64">
							<div className="absolute top-2 right-2">
								{/* <ProjectsMoreMenu isDeletable={project.is_deletable} projectName={project.name} uuid={project.pk} /> */}
							</div>
							<div
								className={gridCardStyles({
									variant: 'link',
								})}
							>
								<div className="flex grow flex-col place-content-between">
									<div className="flex flex-col gap-3">
										<span className="group-active:text-base-neutral-900 group-hover:text-base-lavender-600 group-hover:group-active:text-base-neutral-900 group-focus-visible:text-base-lavender-600 dark:group-active:text-base-neutral-40 dark:group-hover:text-base-lavender-400 dark:group-hover:group-active:text-base-neutral-40 dark:group-focus-visible:text-base-lavender-400 line-clamp-1 max-w-48 break-all text-ellipsis">
											{item.name}
										</span>
									</div>
									<MetadataTemplateBadge
										className="max-w-[30ch] cursor-pointer group-hover:no-underline"
										contentType={item.assigned_to_content_type}
										name={item.assigned_to_content_object_name}
										projectUuid={item.project?.pk}
										uuid={item.assigned_to_object_id}
									/>
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
