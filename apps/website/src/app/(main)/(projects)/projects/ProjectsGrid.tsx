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
			<GridList aria-label="Projects" className="overscroll-auto layout-grid:gap-4" layout="grid">
				<ProjectsCreateGrid href="/projects/create/1">Project</ProjectsCreateGrid>
				{props.data?.map((item) => (
					<GridListItem
						className="cursor-pointer rounded-xl"
						href={`/projects/${item.pk}`}
						id={item.pk}
						key={item.pk}
						textValue={item.name}
					>
						<div className="relative h-[132px] w-full min-w-64 gap-6 md:max-w-64">
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
										<span
											className="line-clamp-2 max-w-[25ch] wrap-break-word text-ellipsis group-hover:text-base-lavender-600 group-focus-visible:text-base-lavender-600 group-pressed:text-base-neutral-900 group-hover:group-pressed:text-base-neutral-900 dark:group-hover:text-base-lavender-400 dark:group-focus-visible:text-base-lavender-400 dark:group-pressed:text-base-neutral-40 dark:group-hover:group-pressed:text-base-neutral-40"
											title={item.name}
										>
											{item.name}
										</span>
									</div>
									<div className="flex flex-col gap-4">
										<span className="inline-flex place-items-center gap-2 text-base-sm text-base-neutral-600 dark:text-base-neutral-300">
											<Wand2Icon aria-hidden size={18} strokeWidth={1.5} />{' '}
											<div className="flex flex-col gap-1">
												<span>{format(item.creation_date, 'MMM D, YYYY hh:mm', 'en')}</span>
												<span title={item.created_by.email} className="max-w-[25ch] truncate">
													{item.created_by.email}
												</span>
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
