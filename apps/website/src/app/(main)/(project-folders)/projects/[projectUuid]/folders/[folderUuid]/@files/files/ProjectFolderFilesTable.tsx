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
import { Link } from '@/components/ui/Link';
import { useSidebar } from '@/components/ui/Sidebar';
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@/components/ui/Table';
import { globalUploadAssistantOpenAtom } from '@/stores/globalUploadAssistant';
import { sideSheetSelectedDatasetAtom } from '@/stores/sideSheet';
import { buttonStyles } from '@/styles/ui/button';
import { convertDataRateLog } from '@/util/convertDataRate';
import type { components } from '@/util/openapiSchema';
import { getSelectionStringValues } from '@/util/selection';
import { ProjectFolderFilesMoreMenu } from './ProjectFolderFilesMoreMenu';
import { ProjectFolderFilesUploadTable } from './ProjectFolderFilesUploadTable';

type ProjectFolderFile = components['schemas']['UploadsDatasetList'];

export function ProjectFolderFilesTable(props: {
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

	const handleOpenSidesheet = (item: ProjectFolderFile) => {
		setSidebarOpen(true);
		setSideSheetSelectedDataset(item.pk);
		if (!isLarge) {
			setIsGlobalUploadAssistantOpen(false);
		}
	};

	const handleSelectionChange = async (selectedKeys: Selection) => {
		const newSelected = getSelectionStringValues(
			selectedKeys,
			props.data?.map((item) => item.pk),
		);
		await setQueryStates({ selected: newSelected.length ? newSelected : null });
	};

	return (
		<div className="flex flex-col">
			<ProjectFolderFilesUploadTable folderUuid={params.folderUuid} isDisabled={effectiveBulkEdit} />
			<Table
				aria-label="Project folder files"
				onSelectionChange={handleSelectionChange}
				selectedKeys={queryStates.selected}
				selectionMode={effectiveBulkEdit ? 'multiple' : 'none'}
			>
				<TableHeader className="hidden">
					<TableColumn id="name" isRowHeader style={{ width: '300px' }}>
						Name
					</TableColumn>
					<TableColumn id="size" style={{ width: '100px' }}>
						Size
					</TableColumn>
					<TableColumn id="email" style={{ width: '200px' }}>
						Email
					</TableColumn>
					<TableColumn id="missing-metadata" style={{ width: '200px' }}>
						Missing metadata
					</TableColumn>
					<TableColumn id="sidesheet" style={{ width: '50px' }}>
						Open in sidesheet
					</TableColumn>
					<TableColumn id="actions" style={{ width: '50px' }}>
						Actions
					</TableColumn>
				</TableHeader>
				<TableBody items={props.data ?? []}>
					{(item) => {
						const isMetadataUpgradeError = item.metadata_upgrade_status === 'ERROR';
						const shouldShowUpgradeIcon = Boolean(item.has_upgradeable_metadata_templates) || isMetadataUpgradeError;

						return (
							<TableRow
								href={`/projects/${params.projectUuid}/folders/${params.folderUuid}/files/${item.pk}`}
								id={item.pk}
							>
								<TableCell style={{ width: '300px' }} textValue={item.display_name ?? 'Empty dataset'}>
									<Link
										className={buttonStyles({
											variant: 'unset',
											className:
												'gap-2 group-hover:text-base-lavender-600 dark:group-hover:text-base-lavender-400 group-pressed:text-base-neutral-900 dark:group-pressed:text-base-neutral-40 print:inline-flex',
										})}
										href={`/projects/${params.projectUuid}/folders/${params.folderUuid}/files/${item.pk}`}
										variant="unset"
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
										<span className="max-w-[30ch] truncate" title={item.display_name ?? 'Empty dataset'}>
											{item.display_name ?? 'Empty dataset'}
										</span>
									</Link>
								</TableCell>
								<TableCell style={{ width: '100px' }} textValue="Size">
									<div className="text-center">
										{convertDataRateLog(
											item?.latest_version?.version_file?.metadata?.find(
												(metadata) => metadata.custom_key === 'FILE_SIZE',
											)?.value as number | undefined,
										) ?? '...'}
									</div>
								</TableCell>
								<TableCell style={{ width: '200px' }} textValue={item.created_by.email}>
									<span className="inline-flex h-full place-items-center gap-2 text-base-sm text-base-neutral-600 dark:text-base-neutral-300">
										<Wand2Icon aria-hidden size={18} strokeWidth={1.5} />
										<span title={item.created_by.email} className="max-w-[20ch] truncate">
											{item.created_by.email}
										</span>
									</span>
								</TableCell>
								<TableCell style={{ width: '200px' }} textValue="Missing metadata">
									{item?.latest_version?.metadata_is_complete ? null : <FileMissingMetadataBadge />}
								</TableCell>
								<TableCell style={{ width: '50px' }} textValue="Open in sidesheet">
									<div className="flex place-content-end">
										<Button
											aria-label="Open sidesheet"
											className="rounded-full"
											onPress={() => handleOpenSidesheet(item)}
											variant="unset"
										>
											<InfoIcon aria-hidden size={18} strokeWidth={1.5} />
										</Button>
									</div>
								</TableCell>
								<TableCell style={{ width: '50px' }} textValue="Actions">
									<div className="flex place-content-end">
										<ProjectFolderFilesMoreMenu
											canMove={props.canBulkEdit}
											fileUuid={item.pk}
											filename={item.display_name}
											folderUuid={params.folderUuid}
											projectUuid={params.projectUuid}
											versionUuid={item.latest_version?.pk}
										/>
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
