'use client';

import { format } from '@formkit/tempo';
import { useSuspenseQueries } from '@tanstack/react-query';
import { CheckIcon, Wand2Icon } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useQueryStates, parseAsBoolean } from 'nuqs';
import type { Selection } from 'react-aria-components';
import { getFolderMetadataTemplatePoolHref } from '@/components/main-route/metadata-template-pool/metadataTemplatePoolHref';
import { GridList, GridListItem } from '@/components/ui/GridList';
import { useMetadataTemplateAssignmentMutation } from '@/hooks/useMetadataTemplateAssignmentMutation';
import { gridCardStyles } from '@/styles/ui/gridCard';
import { $api } from '@/util/clientFetch';
import type { components } from '@/util/openapiSchema';
import { getFirstSelectionString } from '@/util/selection';
import {
	ProjectFolderMetadataTemplateSourceBadge,
	type MetadataTemplateSource,
} from './ProjectFolderMetadataTemplateSourceBadge';
import { ProjectFolderMetadataTemplatesCreateGrid } from './ProjectFolderMetadataTemplatesCreateGrid';
// import { ProjectFolderFilesMoreMenu } from './ProjectFolderFilesMoreMenu';
// import { ProjectFolderFilesUploadGrid } from './ProjectFolderFilesUploadGrid';

type ProjectFolderMetadataTemplateContainer = components['schemas']['MetadataTemplateContainer'];

export function ProjectFolderMetadataTemplatesGrid(props: {
	readonly data?: ProjectFolderMetadataTemplateContainer[] | undefined;
}) {
	const params = useParams<{ readonly folderUuid: string; readonly projectUuid: string }>();
	const [queryStates] = useQueryStates({
		template_bulk_edit: parseAsBoolean.withDefault(false),
	});

	const [projectData, folderData] = useSuspenseQueries({
		queries: [
			$api.queryOptions('get', '/api/v1/project/{id}/', {
				params: { path: { id: params.projectUuid } },
			}),
			$api.queryOptions('get', '/api/v1/folder/{id}/', {
				params: { path: { id: params.folderUuid } },
			}),
		],
	});

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
		<div className="flex flex-wrap gap-6">
			<GridList
				aria-label="Metadata template containers"
				className="overscroll-auto layout-grid:gap-4"
				dependencies={[queryStates.template_bulk_edit]}
				layout="grid"
				onSelectionChange={handleSelectionChange}
				selectedKeys={
					queryStates.template_bulk_edit && folderData.data.metadata_template?.metadata_template_container?.pk
						? [folderData.data.metadata_template.metadata_template_container.pk]
						: []
				}
				selectionMode={queryStates.template_bulk_edit ? 'single' : 'none'}
			>
				<ProjectFolderMetadataTemplatesCreateGrid
					folderUuid={params.folderUuid}
					href={`/projects/${params.projectUuid}/folders/${params.folderUuid}/metadata-templates/create`}
					projectUuid={params.projectUuid}
				/>
				{props.data?.map((item) => {
					const source: MetadataTemplateSource | null =
						item.pk === folderData.data.metadata_template?.metadata_template_container?.pk
							? 'folder'
							: item.pk === projectData.data.metadata_template?.metadata_template_container?.pk
								? 'project'
								: null;
					const href = getFolderMetadataTemplatePoolHref({
						containerPk: item.pk,
						folderActiveContainerPk: folderData.data.metadata_template?.metadata_template_container.pk,
						folderActiveVersionPk: folderData.data.metadata_template?.pk,
						projectActiveContainerPk: projectData.data.metadata_template?.metadata_template_container.pk,
						projectActiveVersionPk: projectData.data.metadata_template?.pk,
					});

					return (
						<GridListItem
							className="cursor-pointer rounded-xl"
							classNames={{ checkbox: 'absolute top-[18px] right-[18px] z-10' }}
							hasCheckbox={queryStates.template_bulk_edit}
							href={queryStates.template_bulk_edit ? '' : href}
							id={item.pk}
							isDisabled={
								queryStates.template_bulk_edit &&
								item.latest_metadata_template?.pk === projectData.data.metadata_template?.pk
							}
							key={`${item.pk}-${queryStates.template_bulk_edit}`}
							textValue={item.name}
						>
							<div className="relative h-[150px] w-full min-w-64 gap-6 md:max-w-64">
								<div className="absolute top-2 right-2">
									{!queryStates.template_bulk_edit &&
									(item.pk === folderData.data.metadata_template?.metadata_template_container?.pk ||
										item.pk === projectData.data.metadata_template?.metadata_template_container?.pk) ? (
										<div className="absolute top-2 right-1 flex h-4.5 w-4.5 min-w-4.5 place-content-center place-items-center place-self-start rounded-full bg-base-lavender-600">
											<CheckIcon aria-hidden className="text-base-neutral-0" size={16} strokeWidth={3} />
										</div>
									) : null}
									{/* <ProjectFolderFilesMoreMenu
									fileUuid={dataset.pk}
									filename={dataset.display_name}
									folderUuid={params.folderUuid}
									uuid={params.uuid}
									versionUuid={dataset.latest_version?.pk}
								/>
								<ProjectFolderFilesMobileMoreMenu
									fileUuid={dataset.pk}
									filename={dataset.display_name}
									folderUuid={params.folderUuid}
									uuid={params.uuid}
									versionUuid={dataset.latest_version?.pk}
								/> */}
								</div>
								<div
									className={gridCardStyles({
										variant: 'link',
									})}
								>
									<div className="flex grow flex-col place-content-between">
										<div className="flex flex-col gap-3">
											<span
												className="line-clamp-2 max-w-[25ch] wrap-break-word text-ellipsis group-hover:text-base-lavender-600 group-focus-visible:text-base-lavender-600 group-pressed:text-base-neutral-900 group-hover:group-pressed:text-base-neutral-900 dark:group-hover:text-base-lavender-400 dark:group-focus-visible:text-base-lavender-400 dark:group-pressed:text-base-neutral-40 dark:group-hover:group-pressed:text-base-neutral-40"
												title={item.name ?? 'Empty metadata template'}
											>
												{item.name ?? 'Empty metadata template'}
											</span>

											{item.pk === folderData.data.metadata_template?.metadata_template_container?.pk &&
											item.latest_metadata_template?.pk !== folderData.data.metadata_template?.pk ? (
												<div className="flex place-content-center place-items-center place-self-start text-base-sm text-base-tangerine-600 dark:text-base-tangerine-400">
													New version available!
												</div>
											) : null}
										</div>
										{source ? <ProjectFolderMetadataTemplateSourceBadge source={source} /> : null}

										<div className="flex flex-col gap-4">
											<span className="inline-flex place-items-center gap-2 text-base-sm text-base-neutral-600 dark:text-base-neutral-300">
												<Wand2Icon aria-hidden size={18} strokeWidth={1.5} />{' '}
												<div className="flex flex-col gap-1">
													<span>{format(item.creation_date, 'MMM D, YYYY hh:mm', 'en')}</span>
													<span title={item.created_by.email} className="max-w-[25ch] truncate">
														{item.created_by.email}
													</span>
												</div>
											</span>
										</div>
									</div>
								</div>
							</div>
						</GridListItem>
					);
				})}
			</GridList>
		</div>
	);
}
