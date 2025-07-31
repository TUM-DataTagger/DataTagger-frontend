'use client';

import { format } from '@formkit/tempo';
import { useSuspenseQueries } from '@tanstack/react-query';
import { CheckIcon, Wand2Icon } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@/components/ui/Table';
import { buttonStyles } from '@/styles/ui/button';
import { $api } from '@/util/clientFetch';
import type { components } from '@/util/openapiSchema';
import { ProjectFolderMetadataTemplatesCreateTable } from './ProjectFolderMetadataTemplatesCreateTable';
// import { ProjectFolderFilesMoreMenu } from './ProjectFolderFilesMoreMenu';

type ProjectFolderMetadataTemplate = components['schemas']['MetadataTemplate'];

export function ProjectFolderMetadataTemplatesTable(props: {
	readonly data?: ProjectFolderMetadataTemplate[] | undefined;
}) {
	const params = useParams<{ readonly folderUuid: string; readonly projectUuid: string }>();

	const [projectResult, folderResult] = useSuspenseQueries({
		queries: [
			$api.queryOptions('get', '/api/v1/project/{id}/', {
				params: { path: { id: params.projectUuid } },
			}),
			$api.queryOptions('get', '/api/v1/folder/{id}/', {
				params: { path: { id: params.folderUuid } },
			}),
		],
	});

	const projectData = projectResult.data;
	const folderData = folderResult.data;

	return (
		<div className="flex flex-col">
			<ProjectFolderMetadataTemplatesCreateTable
				className="border-base-neutral-100 dark:border-base-neutral-700 border-0 border-b"
				folderUuid={params.folderUuid}
				href={`/projects/${params.projectUuid}/folders/${params.folderUuid}/metadata-templates/create`}
			/>
			<Table aria-label="Project folder metadata templates">
				<TableHeader className="hidden">
					<TableColumn id="name" isRowHeader style={{ width: '300px' }}>
						Name
					</TableColumn>
					<TableColumn id="created_info" style={{ width: '300px' }}>
						Created by / Created at
					</TableColumn>
					<TableColumn id="checked" style={{ width: '50px' }}>
						Checked
					</TableColumn>
					<TableColumn id="actions" style={{ width: '50px' }}>
						Actions
					</TableColumn>
				</TableHeader>
				<TableBody items={props.data ?? []}>
					{(item) => (
						<TableRow href={`/metadata-templates/${item.pk}`} id={item.pk}>
							<TableCell style={{ width: '300px' }} textValue={item.name ?? 'Empty dataset'}>
								<Link
									className={buttonStyles({
										variant: 'unset',
										className: 'group-hover:text-base-lavender-600 dark:group-hover:text-base-lavender-400',
									})}
									href={`/metadata-templates/${item.pk}`}
								>
									<span className="max-w-[30ch] truncate">{item.name ?? 'Empty dataset'}</span>
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
							<TableCell
								style={{ width: '50px' }}
								textValue={
									item.pk === projectData.metadata_template?.pk || item.pk === folderData.metadata_template?.pk
										? 'Checked'
										: ''
								}
							>
								{item.pk === projectData.metadata_template?.pk || item.pk === folderData.metadata_template?.pk ? (
									<div className="bg-base-lavender-600 flex h-[18px] w-[18px] min-w-[18px] place-content-center place-items-center place-self-start rounded-full">
										<CheckIcon aria-hidden className="text-base-neutral-0" size={16} strokeWidth={3} />
									</div>
								) : null}
							</TableCell>
							<TableCell style={{ width: '50px' }} textValue="Actions">
								<div className="flex place-content-end">
									{/* <ProjectFolderFilesMoreMenu
										fileUuid={item.pk}
										filename={item.display_name}
										folderUuid={params.folderUuid}
										uuid={params.projectUuid}
										versionUuid={item.latest_version?.pk}
									/> */}
								</div>
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>
		</div>
	);
}
