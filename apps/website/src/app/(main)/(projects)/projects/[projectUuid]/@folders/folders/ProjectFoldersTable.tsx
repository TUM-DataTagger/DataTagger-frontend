'use client';

import { Package2Icon, FileIcon } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@/components/ui/Table';
import { buttonStyles } from '@/styles/ui/button';
import type { components } from '@/util/openapiSchema';
import { ProjectFoldersCreateTable } from './ProjectFoldersCreateTable';
import { ProjectFoldersMoreMenu } from './ProjectFoldersMoreMenu';

type ProjectFolder = components['schemas']['FolderList'];

export function ProjectFoldersTable(props: { readonly data?: ProjectFolder[] | undefined }) {
	const params = useParams<{ readonly projectUuid: string }>();

	return (
		<div className="flex flex-col">
			<ProjectFoldersCreateTable
				className="border-base-neutral-100 dark:border-base-neutral-700 border-0 border-b"
				href={`/projects/${params.projectUuid}/folders/create`}
				projectUuid={params.projectUuid}
			/>
			<Table aria-label="Project folders">
				<TableHeader className="hidden">
					<TableColumn id="name" isRowHeader style={{ width: '300px' }}>
						Name
					</TableColumn>
					<TableColumn id="storage" style={{ width: '100px' }}>
						Storage
					</TableColumn>
					<TableColumn id="datasets_count" style={{ width: '50px' }}>
						Datasets
					</TableColumn>
					<TableColumn id="actions" style={{ width: '50px' }}>
						Actions
					</TableColumn>
				</TableHeader>
				<TableBody items={props.data ?? []}>
					{(item) => (
						<TableRow href={`/projects/${params.projectUuid}/folders/${item.pk}`} id={item.pk}>
							<TableCell style={{ width: '300px' }} textValue={item.name}>
								<Link
									className={buttonStyles({
										variant: 'unset',
										className:
											'group-hover:text-base-lavender-600 dark:group-hover:text-base-lavender-400 print:inline-flex',
									})}
									href={`/projects/${params.projectUuid}/folders/${item.pk}`}
								>
									<span className="max-w-[30ch] truncate">{item.name}</span>
								</Link>
							</TableCell>
							<TableCell style={{ width: '100px' }} textValue={item.storage?.name ?? 'DSS'}>
								<div className="flex place-items-center gap-2">
									<span
										aria-label="Storage"
										className="text-base-sm flex place-items-center gap-2 place-self-start text-neutral-500 dark:text-neutral-300"
									>
										<Package2Icon aria-hidden size={18} strokeWidth={1.5} />
										{item.storage?.name ?? 'DSS'}
									</span>
								</div>
							</TableCell>
							<TableCell style={{ width: '50px' }} textValue={(item.datasets_count ?? 0).toString()}>
								<div className="flex place-content-end">
									<span
										aria-label="Files"
										className="bg-base-neutral-700 text-base-sm text-base-neutral-40 dark:bg-base-neutral-100 dark:text-base-neutral-900 flex place-items-center gap-1 place-self-start rounded-sm px-2 py-1"
									>
										<FileIcon aria-hidden size={18} strokeWidth={1.5} /> {item.datasets_count ?? 0}
									</span>
								</div>
							</TableCell>
							<TableCell style={{ width: '50px' }} textValue="Actions">
								<div className="flex place-content-end">
									<ProjectFoldersMoreMenu
										folderName={item.name}
										folderUuid={item.pk}
										isDeletable={(item.datasets_count ?? 0) === 0}
										projectUuid={params.projectUuid}
									/>
								</div>
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>
		</div>
	);
}
