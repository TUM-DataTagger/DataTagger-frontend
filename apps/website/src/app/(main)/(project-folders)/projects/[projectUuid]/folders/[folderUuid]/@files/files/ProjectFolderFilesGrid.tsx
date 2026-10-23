'use client';

import { useSetAtom } from 'jotai';
import { InfoIcon, Wand2Icon } from 'lucide-react';
import { useParams } from 'next/navigation';
import { parseAsArrayOf, parseAsBoolean, parseAsString, useQueryStates } from 'nuqs';
import type { Selection } from 'react-aria-components';
import { useMediaQuery } from 'usehooks-ts';
import { FileUpgradeMetadataAvailableIcon } from '@/components/File';
import { FileMissingMetadataBadge } from '@/components/file-metadata/FileMetadataIndicators';
import { Button } from '@/components/ui/Button';
import { GridList, GridListItem } from '@/components/ui/GridList';
import { useSidebar } from '@/components/ui/Sidebar';
import { globalUploadAssistantOpenAtom } from '@/stores/globalUploadAssistant';
import { sideSheetSelectedDatasetAtom } from '@/stores/sideSheet';
import { cx } from '@/styles/cva';
import { gridCardStyles } from '@/styles/ui/gridCard';
import { convertDataRateLog } from '@/util/convertDataRate';
import type { components } from '@/util/openapiSchema';
import { getSelectionStringValues } from '@/util/selection';
import { ProjectFolderFilesMoreMenu } from './ProjectFolderFilesMoreMenu';
import { ProjectFolderFilesUploadGrid } from './ProjectFolderFilesUploadGrid';

type ProjectFolderFile = components['schemas']['UploadsDatasetList'];

export function ProjectFolderFilesGrid(props: {
	readonly canBulkEdit: boolean;
	readonly data?: ProjectFolderFile[] | undefined;
}) {
	const params = useParams<{ readonly folderUuid: string; readonly projectUuid: string }>();
	const [queryStates, setQueryStates] = useQueryStates({
		bulk_edit: parseAsBoolean.withDefault(false),
		selected: parseAsArrayOf(parseAsString).withDefault([]),
	});
	const isLarge = useMediaQuery('(min-width: 1024px)', { initializeWithValue: false });
	const { setOpen: setSidebarOpen } = useSidebar();
	const setIsGlobalUploadAssistantOpen = useSetAtom(globalUploadAssistantOpenAtom);
	const setSideSheetSelectedDataset = useSetAtom(sideSheetSelectedDatasetAtom);

	const effectiveBulkEdit = queryStates.bulk_edit && props.canBulkEdit;

	const handleSelectionChange = async (selectedKeys: Selection) => {
		const newSelected = getSelectionStringValues(
			selectedKeys,
			props.data?.map((item) => item.pk),
		);
		await setQueryStates({ selected: newSelected.length ? newSelected : null });
	};

	return (
		<div className="flex flex-wrap gap-6">
			<GridList
				aria-label="Files"
				className="overscroll-auto layout-grid:gap-4"
				dependencies={[effectiveBulkEdit]}
				layout="grid"
				onSelectionChange={handleSelectionChange}
				selectedKeys={queryStates.selected}
				selectionMode={effectiveBulkEdit ? 'multiple' : 'none'}
			>
				<ProjectFolderFilesUploadGrid folderUuid={params.folderUuid} isDisabled={effectiveBulkEdit} />
				{props.data?.map((item) => {
					const isMetadataUpgradeError = item.metadata_upgrade_status === 'ERROR';
					const shouldShowUpgradeIcon = Boolean(item.has_upgradeable_metadata_templates) || isMetadataUpgradeError;

					return (
						<GridListItem
							className="cursor-pointer rounded-xl"
							classNames={{ checkbox: 'absolute top-[18px] right-[18px] z-10' }}
							hasCheckbox={effectiveBulkEdit}
							href={
								effectiveBulkEdit ? '' : `/projects/${params.projectUuid}/folders/${params.folderUuid}/files/${item.pk}`
							}
							id={item.pk}
							key={`${item.pk}-${effectiveBulkEdit}`}
							textValue={item.display_name ?? 'Empty dataset'}
						>
							<div className="relative h-[182px] w-full min-w-64 gap-6 md:max-w-64">
								{effectiveBulkEdit ? null : (
									<div className="absolute top-2 right-2">
										<ProjectFolderFilesMoreMenu
											canMove={props.canBulkEdit}
											fileUuid={item.pk}
											filename={item.display_name}
											folderUuid={params.folderUuid}
											projectUuid={params.projectUuid}
											versionUuid={item.latest_version?.pk}
										/>
									</div>
								)}
								<div className="absolute right-4 bottom-3 z-10">
									<Button
										aria-label="Open sidesheet"
										className="rounded-full"
										onPress={() => {
											setSidebarOpen(true);
											setSideSheetSelectedDataset(item.pk);
											if (!isLarge) {
												setIsGlobalUploadAssistantOpen(false);
											}
										}}
										size="icon-xs"
										variant="unset"
									>
										<InfoIcon aria-hidden size={18} strokeWidth={1.5} />
									</Button>
								</div>
								<div
									className={gridCardStyles({
										variant: 'link',
										className: 'pb-3',
									})}
								>
									<div className="flex grow flex-col place-content-between">
										<div className="flex flex-col gap-3">
											<span
												className="line-clamp-2 inline-flex max-w-[25ch] place-items-center gap-2 wrap-break-word text-ellipsis group-hover:text-base-lavender-600 group-focus-visible:text-base-lavender-600 group-pressed:text-base-neutral-900 group-hover:group-pressed:text-base-neutral-900 dark:group-hover:text-base-lavender-400 dark:group-focus-visible:text-base-lavender-400 dark:group-pressed:text-base-neutral-40 dark:group-hover:group-pressed:text-base-neutral-40"
												title={item.display_name ?? 'Empty dataset'}
											>
												{shouldShowUpgradeIcon ? (
													<FileUpgradeMetadataAvailableIcon
														size="icon-xxs"
														className={
															isMetadataUpgradeError
																? 'bg-base-sunset-300 dark:bg-base-sunset-700'
																: 'bg-base-crystal-300 dark:bg-base-crystal-700'
														}
														tooltipContent={
															isMetadataUpgradeError
																? 'Metadata template upgrade has conflicts that need resolution'
																: 'Metadata template upgrade available'
														}
													/>
												) : null}
												{item.display_name ?? 'Empty dataset'}
											</span>
											<span className="flex gap-1">
												{/* <FileIcon aria-hidden className="shrink-0" height={18} width={18} /> */}
												{convertDataRateLog(
													item?.latest_version?.version_file?.metadata?.find(
														(metadata) => metadata.custom_key === 'FILE_SIZE',
													)?.value as number | undefined,
												) ?? '...'}
											</span>
										</div>
										<div className="mb-0 flex flex-col gap-3">
											<span
												className={cx(
													'inline-flex place-items-center gap-2 text-base-sm text-base-neutral-600 dark:text-base-neutral-300',
													item?.latest_version?.metadata_is_complete ? 'mb-1' : '',
												)}
												title={item?.created_by.email}
											>
												<Wand2Icon aria-hidden size={18} strokeWidth={1.5} />
												<span className="max-w-[25ch] truncate" title={item?.created_by.email}>
													{item?.created_by.email}
												</span>
											</span>
											{item?.latest_version?.metadata_is_complete ? null : <FileMissingMetadataBadge />}
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
