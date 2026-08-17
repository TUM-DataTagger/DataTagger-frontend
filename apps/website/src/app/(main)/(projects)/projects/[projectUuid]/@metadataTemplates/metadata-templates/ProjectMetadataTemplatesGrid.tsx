'use client';

import { format } from '@formkit/tempo';
import { useSuspenseQuery } from '@tanstack/react-query';
import { CheckIcon, Wand2Icon } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useQueryStates, parseAsBoolean } from 'nuqs';
import type { Selection } from 'react-aria-components';
import { getProjectMetadataTemplatePoolHref } from '@/components/main-route/metadata-template-pool/metadataTemplatePoolHref';
import { GridList, GridListItem } from '@/components/ui/GridList';
import { useMetadataTemplateAssignmentMutation } from '@/hooks/useMetadataTemplateAssignmentMutation';
import { gridCardStyles } from '@/styles/ui/gridCard';
import { $api } from '@/util/clientFetch';
import type { components } from '@/util/openapiSchema';
import { getFirstSelectionString } from '@/util/selection';
import { ProjectMetadataTemplatesCreateGrid } from './ProjectMetadataTemplatesCreateGrid';
// import { ProjectFoldersMoreMenu } from './ProjectFoldersMoreMenu';

type ProjectMetadataTemplateContainer = components['schemas']['MetadataTemplateContainer'];

export function ProjectMetadataTemplatesGrid(props: {
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
		<div className="flex flex-wrap gap-6">
			<GridList
				aria-label="Metadata template containers"
				className="overscroll-auto layout-grid:gap-4"
				dependencies={[queryStates.template_bulk_edit]}
				layout="grid"
				onSelectionChange={handleSelectionChange}
				selectedKeys={
					queryStates.template_bulk_edit && projectData.metadata_template?.metadata_template_container?.pk
						? [projectData.metadata_template.metadata_template_container.pk]
						: []
				}
				selectionMode={queryStates.template_bulk_edit ? 'single' : 'none'}
			>
				<ProjectMetadataTemplatesCreateGrid
					href={`/projects/${params.projectUuid}/metadata-templates/create`}
					projectUuid={params.projectUuid}
				/>
				{props.data?.map((item) => {
					const href = getProjectMetadataTemplatePoolHref({
						activeContainerPk: projectData.metadata_template?.metadata_template_container.pk,
						activeVersionPk: projectData.metadata_template?.pk,
						containerPk: item.pk,
					});

					return (
						<GridListItem
							className="cursor-pointer rounded-xl"
							classNames={{ checkbox: 'absolute top-[18px] right-[18px] z-10' }}
							hasCheckbox={queryStates.template_bulk_edit}
							href={queryStates.template_bulk_edit ? '' : href}
							id={item.pk}
							key={`${item.pk}-${queryStates.template_bulk_edit}`}
							textValue={item.name}
						>
							<div className="relative h-[150px] w-full min-w-64 gap-6 md:max-w-64">
								<div className="absolute top-2 right-2">
									{!queryStates.template_bulk_edit &&
									item.pk === projectData.metadata_template?.metadata_template_container?.pk ? (
										<div className="absolute top-2 right-1 flex h-4.5 w-4.5 min-w-4.5 place-content-center place-items-center place-self-start rounded-full bg-base-lavender-600">
											<CheckIcon className="text-base-neutral-0" size={16} strokeWidth={3} />
										</div>
									) : null}
									{/* <ProjectFoldersMoreMenu
									datasetsCount={folder.datasets_count}
									folderName={folder.name}
									folderUuid={folder.pk}
									uuid={params.uuid}
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
												title={item.name ?? 'Empty metadata template container'}
											>
												{item.name ?? 'Empty metadata template container'}
											</span>

											{item.pk === projectData.metadata_template?.metadata_template_container?.pk &&
											item.latest_metadata_template?.pk !== projectData.metadata_template?.pk ? (
												<div className="flex place-content-center place-items-center place-self-start text-base-sm text-base-tangerine-600 dark:text-base-tangerine-400">
													New version available!
												</div>
											) : null}
										</div>

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
