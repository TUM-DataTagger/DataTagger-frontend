'use client';

import { format } from '@formkit/tempo';
import { Wand2Icon } from 'lucide-react';
import Link from 'next/link';
import { MetadataTemplateBadge } from '@/components/MetadataTemplate';
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@/components/ui/Table';
import { buttonStyles } from '@/styles/ui/button';
import type { components } from '@/util/openapiSchema';
import { MetadataTemplatesCreateTable } from './MetadataTemplatesCreateTable';
// import { ProjectsMoreMenu } from './ProjectsMoreMenu';

type MetadataTemplate = components['schemas']['MetadataTemplate'];

export function MetadataTemplatesTable(props: { readonly data?: MetadataTemplate[] | undefined }) {
	return (
		<div className="flex flex-col">
			<MetadataTemplatesCreateTable
				className="border-base-neutral-100 dark:border-base-neutral-700 border-0 border-b"
				href="/metadata-templates/create"
			/>
			<Table aria-label="Metadata templates">
				<TableHeader className="hidden">
					<TableColumn id="name" isRowHeader style={{ width: '300px' }}>
						Name
					</TableColumn>
					<TableColumn id="badge" style={{ width: '200px' }}>
						Badge
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
						<TableRow href={`/metadata-templates/${item.pk}`} id={item.pk}>
							<TableCell style={{ width: '300px' }} textValue={item.name}>
								<Link
									className={buttonStyles({
										variant: 'unset',
										className: 'group-hover:text-base-lavender-600 dark:group-hover:text-base-lavender-400',
									})}
									href={`/metadata-templates/${item.pk}`}
								>
									<span className="max-w-[30ch] truncate">{item.name}</span>
								</Link>
							</TableCell>
							<TableCell style={{ width: '200px' }} textValue={item.assigned_to_content_object_name ?? ''}>
								<MetadataTemplateBadge
									className="max-w-[30ch] cursor-pointer group-hover:no-underline"
									contentType={item.assigned_to_content_type}
									name={item.assigned_to_content_object_name}
									projectUuid={item.project?.pk}
									uuid={item.assigned_to_object_id}
								/>
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
									{/* <ProjectsMoreMenu projectName={item.name} uuid={item.pk} /> */}
								</div>
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>
		</div>
	);
}
