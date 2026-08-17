'use client';

import { format } from '@formkit/tempo';
import { useSuspenseQueries } from '@tanstack/react-query';
import { CheckIcon, Wand2Icon } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useQueryStates, parseAsBoolean } from 'nuqs';
import type { Selection } from 'react-aria-components';
import { getFolderMetadataTemplatePoolHref } from '@/components/main-route/metadata-template-pool/metadataTemplatePoolHref';
import { Link } from '@/components/ui/Link';
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@/components/ui/Table';
import { useMetadataTemplateAssignmentMutation } from '@/hooks/useMetadataTemplateAssignmentMutation';
import { buttonStyles } from '@/styles/ui/button';
import { $api } from '@/util/clientFetch';
import type { components } from '@/util/openapiSchema';
import { getFirstSelectionString } from '@/util/selection';
import {
	ProjectFolderMetadataTemplateSourceBadge,
	type MetadataTemplateSource,
} from './ProjectFolderMetadataTemplateSourceBadge';
import { ProjectFolderMetadataTemplatesCreateTable } from './ProjectFolderMetadataTemplatesCreateTable';
// import { ProjectFolderFilesMoreMenu } from './ProjectFolderFilesMoreMenu';

type ProjectFolderMetadataTemplateContainer = components['schemas']['MetadataTemplateContainer'];

export function ProjectFolderMetadataTemplatesTable(props: {
	readonly data?: ProjectFolderMetadataTemplateContainer[] | undefined;
}) {
	const params = useParams<{ readonly folderUuid: string; readonly projectUuid: string }>();
	const [queryStates] = useQueryStates({
		template_bulk_edit: parseAsBoolean.withDefault(false),
	});

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

	const folderQueryOptions = $api.queryOptions('get', '/api/v1/folder/{id}/', {
		params: { path: { id: params.folderUuid } },
	});

	const { mutate } = useMetadataTemplateAssignmentMutation({
		path: '/api/v1/folder/{id}/',
		params: { id: params.folderUuid },
		invalidateQueryKey: folderQueryOptions.queryKey,
		toastMessages: {
			assigned: 'Metadata template activated for folder.',
			unassigned: 'Metadata template deactivated for folder.',
		},
	});

	const handleSelectionChange = async (selectedKeys: Selection) => {
		const selectedContainerPk = getFirstSelectionString(
			selectedKeys,
			props.data?.map((item) => item.pk),
		);
		const selectedTemplatePk =
			props.data?.find((item) => item.pk === selectedContainerPk)?.latest_metadata_template?.pk ?? null;
		mutate(selectedTemplatePk ?? null);
	};

	return (
		<div className="flex flex-col">
			<ProjectFolderMetadataTemplatesCreateTable
				folderUuid={params.folderUuid}
				href={`/projects/${params.projectUuid}/folders/${params.folderUuid}/metadata-templates/create`}
				projectUuid={params.projectUuid}
			/>
			<Table
				aria-label="Project folder metadata templates"
				onSelectionChange={handleSelectionChange}
				selectedKeys={
					queryStates.template_bulk_edit && folderData.metadata_template?.metadata_template_container?.pk
						? [folderData.metadata_template.metadata_template_container.pk]
						: []
				}
				selectionMode={queryStates.template_bulk_edit ? 'single' : 'none'}
			>
				<TableHeader className="hidden">
					<TableColumn id="name" isRowHeader style={{ width: '300px' }}>
						Name
					</TableColumn>
					<TableColumn id="source" style={{ width: '200px' }}>
						Source
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
				<TableBody dependencies={[queryStates.template_bulk_edit]} items={props.data ?? []}>
					{(item) => {
						const source: MetadataTemplateSource | null =
							item.pk === folderData.metadata_template?.metadata_template_container?.pk
								? 'folder'
								: item.pk === projectData.metadata_template?.metadata_template_container?.pk
									? 'project'
									: null;
						const href = getFolderMetadataTemplatePoolHref({
							containerPk: item.pk,
							folderActiveContainerPk: folderData.metadata_template?.metadata_template_container.pk,
							folderActiveVersionPk: folderData.metadata_template?.pk,
							projectActiveContainerPk: projectData.metadata_template?.metadata_template_container.pk,
							projectActiveVersionPk: projectData.metadata_template?.pk,
						});

						return (
							<TableRow
								href={href}
								id={item.pk}
								isDisabled={
									queryStates.template_bulk_edit &&
									item.latest_metadata_template?.pk === projectData.metadata_template?.pk
								}
							>
								<TableCell style={{ width: '300px' }} textValue={item.name ?? 'Empty metadata template'}>
									<Link
										className={buttonStyles({
											variant: 'unset',
											className:
												'group-hover:text-base-lavender-600 dark:group-hover:text-base-lavender-400 group-pressed:text-base-neutral-900 dark:group-pressed:text-base-neutral-40 print:inline-flex',
										})}
										href={href}
										variant="unset"
									>
										<span className="max-w-[30ch] truncate" title={item.name ?? 'Empty metadata template'}>
											{item.name ?? 'Empty metadata template'}
										</span>
									</Link>
								</TableCell>
								<TableCell
									style={{ width: '200px' }}
									textValue={source === 'project' ? 'Project' : source === 'folder' ? 'Folder' : ''}
								>
									{source ? <ProjectFolderMetadataTemplateSourceBadge source={source} /> : null}
								</TableCell>
								<TableCell style={{ width: '300px' }} textValue={`${item.created_by.email} - ${item.creation_date}`}>
									<div className="flex h-full place-items-center gap-2 text-base-sm text-base-neutral-600 dark:text-base-neutral-300">
										<Wand2Icon aria-hidden size={18} strokeWidth={1.5} />
										<div className="flex place-items-center gap-1">
											<span title={item.created_by.email} className="inline-block max-w-[20ch] truncate">
												{item.created_by.email}
											</span>{' '}
											– <span>{format(item.creation_date, 'MMM D, YYYY hh:mm', 'en')}</span>
										</div>
									</div>
								</TableCell>
								<TableCell
									style={{ width: '50px' }}
									textValue={
										!queryStates.template_bulk_edit &&
										(item.pk === folderData.metadata_template?.metadata_template_container?.pk ||
											item.pk === projectData.metadata_template?.metadata_template_container?.pk)
											? 'Checked'
											: ''
									}
								>
									<div className="flex place-content-center place-items-center gap-2">
										{!queryStates.template_bulk_edit &&
										(item.pk === folderData.metadata_template?.metadata_template_container?.pk ||
											item.pk === projectData.metadata_template?.metadata_template_container?.pk) ? (
											<div className="flex h-4.5 w-4.5 min-w-4.5 place-content-center place-items-center place-self-start rounded-full bg-base-lavender-600">
												<CheckIcon aria-hidden className="text-base-neutral-0" size={16} strokeWidth={3} />
											</div>
										) : null}

										{item.pk === folderData.metadata_template?.metadata_template_container?.pk &&
										item.latest_metadata_template?.pk !== folderData.metadata_template?.pk ? (
											<div className="flex place-content-center place-items-center place-self-start text-base-sm text-base-tangerine-600 dark:text-base-tangerine-400">
												New version available!
											</div>
										) : null}
									</div>
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
						);
					}}
				</TableBody>
			</Table>
		</div>
	);
}
