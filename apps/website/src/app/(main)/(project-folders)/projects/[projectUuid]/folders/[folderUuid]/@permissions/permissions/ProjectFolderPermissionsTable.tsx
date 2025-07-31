'use client';

import { HelpCircleIcon } from 'lucide-react';
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@/components/ui/Table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/Tooltip';
import type { components } from '@/util/openapiSchema';

type FolderPermission = components['schemas']['FolderPermission'];

export function ProjectFolderPermissionsTable(props: { readonly data?: FolderPermission[] | undefined }) {
	return (
		<Table aria-label="Project members">
			<TableHeader className="hidden">
				<TableColumn id="role" isRowHeader style={{ width: '100px' }}>
					Role
				</TableColumn>
				<TableColumn id="email" style={{ width: '300px' }}>
					Email
				</TableColumn>
			</TableHeader>
			<TableBody items={props.data ?? []}>
				{(item) => (
					<TableRow id={`permission-${item.project_membership.pk}`}>
						<TableCell
							style={{ width: '100px' }}
							textValue={item.is_folder_admin ? 'Admin' : item.can_edit ? 'Editor' : 'Viewer'}
						>
							<div className="flex place-items-center gap-3">
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
						</TableCell>
						<TableCell style={{ width: '300px' }} textValue={item.project_membership.member.email}>
							<span className="max-w-[30ch] truncate">{item.project_membership.member.email}</span>
						</TableCell>
					</TableRow>
				)}
			</TableBody>
		</Table>
	);
}
