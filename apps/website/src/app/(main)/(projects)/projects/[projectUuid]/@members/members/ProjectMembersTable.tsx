'use client';

import { HelpCircleIcon } from 'lucide-react';
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@/components/ui/Table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/Tooltip';
import type { components } from '@/util/openapiSchema';

type ProjectMembership = components['schemas']['ProjectMembership'];

export function ProjectMembersTable(props: { readonly data?: ProjectMembership[] | undefined }) {
	return (
		<Table aria-label="Project members">
			<TableHeader className="hidden">
				<TableColumn id="role" style={{ width: '100px' }}>
					Role
				</TableColumn>
				<TableColumn id="permissions" style={{ width: '100px' }}>
					Permissions
				</TableColumn>
				<TableColumn id="email" isRowHeader style={{ width: '300px' }}>
					Email
				</TableColumn>
			</TableHeader>
			<TableBody items={props.data ?? []}>
				{(item) => (
					<TableRow id={item.member.pk}>
						<TableCell style={{ width: '100px' }} textValue={item.is_project_admin ? 'Project admin' : 'Member'}>
							<div className="flex place-items-center gap-3">
								<span>{item.is_project_admin ? 'Project admin' : 'Member'}</span>
								<Tooltip delay={400}>
									<TooltipTrigger variant="tooltip">
										<HelpCircleIcon aria-hidden size={18} strokeWidth={1.5} />
									</TooltipTrigger>
									<TooltipContent showArrow={false} variant="rich">
										{item.is_project_admin
											? 'Full access to project including folders and files within'
											: 'No access to files unless defined in folders'}
									</TooltipContent>
								</Tooltip>
							</div>
						</TableCell>
						<TableCell style={{ width: '100px' }} textValue={item.can_create_folders ? 'Can create folders' : ''}>
							{item.is_project_admin ? null : (
								<span className="text-base-sm text-neutral-500 dark:text-neutral-300">
									{item.can_create_folders ? '+ Can create folders' : ''}
								</span>
							)}
						</TableCell>
						<TableCell style={{ width: '300px' }} textValue={item.member.email}>
							<span className="max-w-[30ch] truncate">{item.member.email}</span>
						</TableCell>
					</TableRow>
				)}
			</TableBody>
		</Table>
	);
}
