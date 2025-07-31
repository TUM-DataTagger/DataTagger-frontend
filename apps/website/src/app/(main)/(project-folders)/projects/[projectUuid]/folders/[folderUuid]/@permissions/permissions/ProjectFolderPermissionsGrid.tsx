'use client';

import { HelpCircleIcon } from 'lucide-react';
import { GridList, GridListItem } from '@/components/ui/GridList';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/Tooltip';
import { gridCardStyles } from '@/styles/ui/gridCard';
import type { components } from '@/util/openapiSchema';

type FolderPermission = components['schemas']['FolderPermission'];

export function ProjectFolderPermissionsGrid(props: { readonly data?: FolderPermission[] }) {
	return (
		<div className="flex flex-wrap gap-6">
			<GridList aria-label="Folder permissions" className="layout-grid:gap-3.5" items={props.data ?? []} layout="grid">
				{(item) => (
					<GridListItem
						className="rounded-xl"
						id={item.pk}
						key={item.pk}
						textValue={item.project_membership.member.email}
					>
						<div className={gridCardStyles({ className: 'h-[128px] w-full min-w-64 gap-6 md:max-w-64' })}>
							<div className="flex flex-col gap-3">
								<div className="flex place-items-center gap-2">
									<span>{item.is_folder_admin ? 'Admin' : item.can_edit ? 'Editor' : 'Viewer'}</span>
									<Tooltip delay={400}>
										<TooltipTrigger variant="tooltip">
											<HelpCircleIcon aria-hidden size={18} strokeWidth={1.5} />
										</TooltipTrigger>
										<TooltipContent showArrow={false} variant="rich">
											{item.is_folder_admin
												? 'Full access to folder, files, and metadata within'
												: item.can_edit
													? 'Assigns files to a folder and edits metadata of a file'
													: 'Views and downloads files and their metadata'}
										</TooltipContent>
									</Tooltip>
								</div>
							</div>
							<span className="max-w-[25ch] truncate">{item.project_membership.member.email}</span>
						</div>
					</GridListItem>
				)}
			</GridList>
		</div>
	);
}
