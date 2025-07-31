'use client';

import { format } from '@formkit/tempo';
import { Wand2Icon } from 'lucide-react';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@/components/ui/Table';
import { buttonStyles } from '@/styles/ui/button';
import type { components } from '@/util/openapiSchema';
import { ProjectsCreateTable } from './ProjectsCreateTable';
import { ProjectsMoreMenu } from './ProjectsMoreMenu';

type Project = components['schemas']['Project'];

export function ProjectsTable(props: { readonly data?: Project[] | undefined }) {
	return (
		<div className="flex flex-col">
			<ProjectsCreateTable
				className="border-base-neutral-100 dark:border-base-neutral-700 border-0 border-b"
				href="/projects/create/1"
			/>
			<Table aria-label="Projects">
				<TableHeader className="hidden">
					<TableColumn id="name" isRowHeader style={{ width: '300px' }}>
						Name
					</TableColumn>
					<TableColumn id="created_info" style={{ width: '300px' }}>
						Created by / Created at
					</TableColumn>
					<TableColumn id="actions" style={{ width: '50px' }}>
						Actions
					</TableColumn>
				</TableHeader>
				<TableBody items={props.data ?? []}>
					{(item) => (
						<TableRow href={`/projects/${item.pk}`} id={item.pk}>
							<TableCell style={{ width: '300px' }} textValue={item.name}>
								<Link
									className={buttonStyles({
										variant: 'unset',
										className:
											'group-hover:text-base-lavender-600 dark:group-hover:text-base-lavender-400 print:inline-flex',
									})}
									href={`/projects/${item.pk}`}
								>
									<span className="max-w-[30ch] truncate">{item.name}</span>
								</Link>
							</TableCell>
							<TableCell style={{ width: '300px' }} textValue={`${item.created_by.email} - ${item.creation_date}`}>
								<div className="text-base-sm text-base-neutral-600 dark:text-base-neutral-300 flex h-full place-items-center gap-2">
									<Wand2Icon aria-hidden size={18} strokeWidth={1.5} />
									<div>
										<span>{item.created_by.email}</span> –{' '}
										<span>{format(item.creation_date, 'MMM D, YYYY hh:mm', 'en')}</span>
									</div>
								</div>
							</TableCell>
							<TableCell style={{ width: '50px' }} textValue="Actions">
								<div className="flex place-content-end">
									<ProjectsMoreMenu projectName={item.name} projectUuid={item.pk} />
								</div>
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>
		</div>
	);
}
