'use client';

import { HelpCircleIcon } from 'lucide-react';
import { GridList, GridListItem } from '@/components/ui/GridList';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/Tooltip';
import { gridCardStyles } from '@/styles/ui/gridCard';
import type { components } from '@/util/openapiSchema';

type ProjectMemberships = components['schemas']['ProjectMembership'];

export function ProjectMembersGrid(props: { readonly data?: ProjectMemberships[] | undefined }) {
	return (
		<div className="flex flex-wrap gap-6">
			<GridList
				aria-label="Project members"
				className="overscroll-auto layout-grid:gap-4"
				items={props.data ?? []}
				layout="grid"
			>
				{(item) => (
					<GridListItem className="rounded-xl" id={item.pk} key={item.pk} textValue={item.member.email}>
						<div className={gridCardStyles({ className: 'h-[150px] w-full min-w-64 gap-6 md:max-w-64' })}>
							<div className="flex flex-col gap-3">
								<div className="flex place-items-center gap-2">
									<span>{item.is_project_admin ? 'Project admin' : 'Member'}</span>
									<Tooltip delay={400}>
										<TooltipTrigger variant="tooltip">
											<HelpCircleIcon aria-hidden size={18} strokeWidth={1.5} />
										</TooltipTrigger>
										<TooltipContent arrow={false} variant="rich">
											{item.is_project_admin
												? 'Full access to project including folders and files within'
												: 'No access to files unless defined in folders'}
										</TooltipContent>
									</Tooltip>
								</div>
								{item.is_project_admin ? null : (
									<div className="flex flex-col gap-1">
										{item.can_create_folders ? (
											<span className="text-base-sm text-neutral-500 dark:text-neutral-300">+ Can create folders</span>
										) : null}
										{item.is_metadata_template_admin ? (
											<span className="text-base-sm text-neutral-500 dark:text-neutral-300">
												+ Can create metadata templates
											</span>
										) : null}
									</div>
								)}
							</div>
							<span className="max-w-[25ch] truncate" title={item.member.email}>
								{item.member.email}
							</span>
						</div>
					</GridListItem>
				)}
			</GridList>
		</div>
	);
}
