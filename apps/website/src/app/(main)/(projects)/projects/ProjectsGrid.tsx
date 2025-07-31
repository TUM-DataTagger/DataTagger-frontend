'use client';

import { format } from '@formkit/tempo';
import { Wand2Icon } from 'lucide-react';
import { GridList, GridListItem } from '@/components/ui/GridList';
import { gridCardStyles } from '@/styles/ui/gridCard';
import type { components } from '@/util/openapiSchema';
import { ProjectsCreateGrid } from './ProjectsCreateGrid';
import { ProjectsMoreMenu } from './ProjectsMoreMenu';

type Project = components['schemas']['Project'];

export function ProjectsGrid(props: { readonly data?: Project[] | undefined }) {
	return (
		<div className="flex flex-wrap gap-6">
			<GridList aria-label="Projects" className="layout-grid:gap-3.5" layout="grid">
				<ProjectsCreateGrid href="/projects/create/1">Project</ProjectsCreateGrid>
				{props.data?.map((item) => (
					<GridListItem
						className="cursor-pointer rounded-xl"
						href={`/projects/${item.pk}`}
						id={item.pk}
						key={item.pk}
						textValue={item.name}
					>
						<div className="relative h-[132px] w-full min-w-64 gap-6 md:w-auto">
							<div className="absolute top-2 right-2">
								<ProjectsMoreMenu isDeletable={item.is_deletable} projectName={item.name} projectUuid={item.pk} />
							</div>
							<div
								className={gridCardStyles({
									variant: 'link',
								})}
							>
								<div className="flex grow flex-col place-content-between">
									<div className="flex flex-col gap-3">
										<span className="group-active:text-base-neutral-900 group-hover:text-base-lavender-600 group-hover:group-active:text-base-neutral-900 group-focus-visible:text-base-lavender-600 dark:group-active:text-base-neutral-40 dark:group-hover:text-base-lavender-400 dark:group-hover:group-active:text-base-neutral-40 dark:group-focus-visible:text-base-lavender-400 line-clamp-2 max-w-[25ch] break-words text-ellipsis">
											{item.name}
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
