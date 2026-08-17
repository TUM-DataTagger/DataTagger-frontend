'use client';

import { format } from '@formkit/tempo';
import { Wand2Icon } from 'lucide-react';
import { useQueryStates } from 'nuqs';
import type { Selection } from 'react-aria-components';
import { MetadataTemplateContainerBadge } from '@/components/metadata-template/MetadataTemplateContainer';
import { GridList, GridListItem } from '@/components/ui/GridList';
import { gridCardStyles } from '@/styles/ui/gridCard';
import type { components } from '@/util/openapiSchema';
import { getSelectionStringValues } from '@/util/selection';
import { MetadataTemplatesCreateGrid } from './MetadataTemplatesCreateGrid';
import { metadataTemplateBulkQueryState } from './metadataTemplateBulkQueryState';
// import { ProjectsMoreMenu } from './ProjectsMoreMenu';

type MetadataTemplateContainer = components['schemas']['MetadataTemplateContainer'];

export function MetadataTemplatesGrid(props: { readonly data?: MetadataTemplateContainer[] | undefined }) {
	const [queryStates, setQueryStates] = useQueryStates(metadataTemplateBulkQueryState);
	const handleSelectionChange = async (selectedKeys: Selection) => {
		const newSelected = getSelectionStringValues(
			selectedKeys,
			props.data?.map((item) => item.pk),
		);
		await setQueryStates({ selected: newSelected.length ? newSelected : [] });
	};

	return (
		<div className="flex flex-wrap gap-6">
			<GridList
				aria-label="Metadata templates"
				className="overscroll-auto layout-grid:gap-4"
				dependencies={[queryStates.bulk_edit]}
				layout="grid"
				onSelectionChange={handleSelectionChange}
				selectedKeys={queryStates.selected}
				selectionMode={queryStates.bulk_edit ? 'multiple' : 'none'}
			>
				<MetadataTemplatesCreateGrid href="/metadata-templates/create" isDisabled={queryStates.bulk_edit}>
					Metadata template
				</MetadataTemplatesCreateGrid>
				{props.data?.map((item) => (
					<GridListItem
						className="cursor-pointer rounded-xl"
						classNames={{ checkbox: 'absolute top-[18px] right-[18px] z-10' }}
						hasCheckbox={queryStates.bulk_edit}
						href={queryStates.bulk_edit ? '' : `/metadata-templates/${item.pk}`}
						id={item.pk}
						key={`${item.pk}-${queryStates.bulk_edit}`}
						textValue={item.name}
					>
						<div className="relative h-[150px] w-full min-w-64 gap-6 md:max-w-64">
							<div className="absolute top-2 right-2">
								{/* <ProjectsMoreMenu isDeletable={project.is_deletable} projectName={project.name} uuid={project.pk} /> */}
							</div>
							<div
								className={gridCardStyles({
									variant: 'link',
								})}
							>
								<div className="flex grow flex-col place-content-between">
									<div className="flex flex-col gap-3">
										<span
											className="line-clamp-1 max-w-48 break-all text-ellipsis group-hover:text-base-lavender-600 group-focus-visible:text-base-lavender-600 group-pressed:text-base-neutral-900 group-hover:group-pressed:text-base-neutral-900 dark:group-hover:text-base-lavender-400 dark:group-focus-visible:text-base-lavender-400 dark:group-pressed:text-base-neutral-40 dark:group-hover:group-pressed:text-base-neutral-40"
											title={item.name}
										>
											{item.name}
										</span>
									</div>
									<MetadataTemplateContainerBadge
										className="max-w-[30ch] cursor-pointer group-hover:no-underline"
										contentType={item.assigned_to_content_type}
										name={item.assigned_to_content_object_name}
										projectUuid={item.project?.pk}
										uuid={item.assigned_to_object_id}
									/>
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
				))}
			</GridList>
		</div>
	);
}
