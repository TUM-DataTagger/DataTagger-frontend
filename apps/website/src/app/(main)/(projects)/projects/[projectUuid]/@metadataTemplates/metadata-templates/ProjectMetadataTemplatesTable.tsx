'use client';

import { format } from '@formkit/tempo';
import { useSuspenseQuery } from '@tanstack/react-query';
import { CheckIcon, Wand2Icon } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useQueryStates, parseAsBoolean } from 'nuqs';
import type { Selection } from 'react-aria-components';
import { getProjectMetadataTemplatePoolHref } from '@/components/main-route/metadata-template-pool/metadataTemplatePoolHref';
import { Link } from '@/components/ui/Link';
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@/components/ui/Table';
import { useMetadataTemplateAssignmentMutation } from '@/hooks/useMetadataTemplateAssignmentMutation';
import { buttonStyles } from '@/styles/ui/button';
import { $api } from '@/util/clientFetch';
import type { components } from '@/util/openapiSchema';
import { getFirstSelectionString } from '@/util/selection';
import { ProjectMetadataTemplatesCreateTable } from './ProjectMetadataTemplatesCreateTable';
// import { ProjectFoldersMoreMenu } from './ProjectFoldersMoreMenu';

type ProjectMetadataTemplateContainer = components['schemas']['MetadataTemplateContainer'];

export function ProjectMetadataTemplatesTable(props: {
	readonly data?: ProjectMetadataTemplateContainer[] | undefined;
}) {
	const params = useParams<{ readonly projectUuid: string }>();
	const [queryStates] = useQueryStates({
		template_bulk_edit: parseAsBoolean.withDefault(false),
	});

	const projectQueryOptions = $api.queryOptions('get', '/api/v1/project/{id}/', {
		params: { path: { id: params.projectUuid } },
	});

	const { data: projectData } = useSuspenseQuery(projectQueryOptions);

	const { mutate } = useMetadataTemplateAssignmentMutation({
		path: '/api/v1/project/{id}/',
		params: { id: params.projectUuid },
		invalidateQueryKey: projectQueryOptions.queryKey,
		toastMessages: {
			assigned: 'Metadata template activated for project.',
			unassigned: 'Metadata template deactivated for project.',
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
			<ProjectMetadataTemplatesCreateTable
				href={`/projects/${params.projectUuid}/metadata-templates/create`}
				projectUuid={params.projectUuid}
			/>
			<Table
				aria-label="Project metadata templates"
				onSelectionChange={handleSelectionChange}
				selectedKeys={
					queryStates.template_bulk_edit && projectData.metadata_template?.metadata_template_container?.pk
						? [projectData.metadata_template.metadata_template_container.pk]
						: []
				}
				selectionMode={queryStates.template_bulk_edit ? 'single' : 'none'}
			>
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
					{(item) => {
						const href = getProjectMetadataTemplatePoolHref({
							activeContainerPk: projectData.metadata_template?.metadata_template_container.pk,
							activeVersionPk: projectData.metadata_template?.pk,
							containerPk: item.pk,
						});

						return (
							<TableRow href={href} id={item.pk}>
								<TableCell style={{ width: '300px' }} textValue={item.name}>
									<Link
										className={buttonStyles({
											variant: 'unset',
											className:
												'group-hover:text-base-lavender-600 dark:group-hover:text-base-lavender-400 group-pressed:text-base-neutral-900 dark:group-pressed:text-base-neutral-40 print:inline-flex',
										})}
										href={href}
										variant="unset"
									>
										<span className="max-w-[30ch] truncate" title={item.name}>
											{item.name}
										</span>
									</Link>
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
										item.pk === projectData.metadata_template?.metadata_template_container?.pk
											? 'Checked'
											: ''
									}
								>
									<div className="flex place-content-center place-items-center gap-2">
										{!queryStates.template_bulk_edit &&
										item.pk === projectData.metadata_template?.metadata_template_container?.pk ? (
											<div className="flex h-4.5 w-4.5 min-w-4.5 place-content-center place-items-center place-self-start rounded-full bg-base-lavender-600">
												<CheckIcon className="text-base-neutral-0" size={16} strokeWidth={3} />
											</div>
										) : null}

										{item.pk === projectData.metadata_template?.metadata_template_container?.pk &&
										item.latest_metadata_template?.pk !== projectData.metadata_template?.pk ? (
											<div className="flex place-content-center place-items-center place-self-start text-base-sm text-base-tangerine-600 dark:text-base-tangerine-400">
												New version available!
											</div>
										) : null}
									</div>
								</TableCell>
								<TableCell style={{ width: '50px' }} textValue="Actions">
									<div className="flex place-content-end">
										{/* <ProjectFoldersMoreMenu
										isDeletable={item.datasets_count === 0}
										folderName={item.name}
										folderUuid={item.pk}
										uuid={params.projectUuid}
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
