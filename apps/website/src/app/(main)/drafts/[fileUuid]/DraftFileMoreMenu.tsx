'use client';

import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { useAtom } from 'jotai';
import {
	FileDownIcon,
	FolderArchiveIcon,
	FolderInputIcon,
	HistoryIcon,
	MoreVerticalIcon,
	PanelRightOpenIcon,
	PencilIcon,
	TrashIcon,
	XIcon,
} from 'lucide-react';
import Link from 'next/link';
import { parseAsString, useQueryState } from 'nuqs';
import { useState } from 'react';
import { useMediaQuery } from 'usehooks-ts';
import { FileDeleteDialog, FileDownloadDialog, FileExportDialog, FileImportDialog } from '@/components/File';
import { FileVersionHistoryExitDialog, FileVersionHistoryCloseIndicator } from '@/components/FileVersionHistory';
import { Button } from '@/components/ui/Button';
import { Drawer, DrawerBody, DrawerClose, DrawerContent, DrawerTrigger } from '@/components/ui/Drawer';
import { dropdownItemStyles } from '@/components/ui/Dropdown';
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from '@/components/ui/Menu';
import { Separator } from '@/components/ui/Separator';
import { useSidebar } from '@/components/ui/Sidebar';
import { SideSheetMode, sideSheetModeAtom, sideSheetSelectedDatasetAtom } from '@/stores/sideSheet';
import { cx } from '@/styles/cva';
import { $api } from '@/util/clientFetch';
import { DraftFileMoreMenuEditFilenameDialog } from './DraftFileMoreMenuEditFilenameDialog';

export function DraftFileMoreMenu({ fileUuid, ...props }: { readonly className?: string; readonly fileUuid: string }) {
	const isMobile = useMediaQuery('(max-width: 600px)', { initializeWithValue: false });
	const [queryState] = useQueryState('version', parseAsString);
	const [sideSheetMode, setSideSheetMode] = useAtom(sideSheetModeAtom);
	const [sideSheetSelectedDataset, setSideSheetSelectedDataset] = useAtom(sideSheetSelectedDatasetAtom);
	const { setOpen } = useSidebar();
	const [isEditNameOpen, setIsEditNameOpen] = useState(false);
	const [isImportOpen, setIsImportOpen] = useState(false);
	const [isExportOpen, setIsExportOpen] = useState(false);
	const [isDownloadOpen, setIsDownloadOpen] = useState(false);
	const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
	const [isVersionHistoryExitDialogOpen, setIsVersionHistoryExitDialogOpen] = useState(false);

	const isVersionHistoryModeActive = Boolean(
		sideSheetMode === SideSheetMode.FileVersionHistory && sideSheetSelectedDataset,
	);

	const { data: datasetData } = useSuspenseQuery(
		$api.queryOptions('get', '/api/v1/uploads-dataset/{id}/', {
			params: { path: { id: fileUuid } },
		}),
	);

	const { data: datasetVersionData } = useQuery(
		$api.queryOptions(
			'get',
			'/api/v1/uploads-version/{id}/',
			{
				params: { path: { id: datasetData.latest_version?.pk ?? '' } },
			},
			{ enabled: Boolean(datasetData.latest_version) },
		),
	);

	const isLatestVersionSelected = Boolean(!queryState || queryState === datasetData.latest_version?.pk);

	return (
		<>
			{isLatestVersionSelected && isMobile ? (
				<div className="flex place-items-center gap-4">
					{isVersionHistoryModeActive ? (
						<Button onPress={() => setOpen((open) => !open)} size="icon" variant="filled">
							<PanelRightOpenIcon aria-hidden data-slot="icon" size={18} strokeWidth={1.5} />
						</Button>
					) : null}
					<div>
						<Drawer withNotch={false}>
							<DrawerTrigger aria-label="More menu" size="icon" variant="filled">
								<MoreVerticalIcon aria-hidden size={24} strokeWidth={1.5} />
							</DrawerTrigger>
							<DrawerContent aria-label="More menu">
								<DrawerBody>
									{isVersionHistoryModeActive ? (
										<DrawerClose
											aria-label="Exit version history"
											className={dropdownItemStyles({ className: 'text-base-sm flex place-content-start gap-2' })}
											id="exit-version-history"
											onPress={() => setIsVersionHistoryExitDialogOpen(true)}
											variant="unset"
										>
											<XIcon aria-hidden data-slot="icon" size={18} strokeWidth={1.5} /> Exit version history
										</DrawerClose>
									) : (
										<DrawerClose
											aria-label="Show version history"
											className={dropdownItemStyles({ className: 'text-base-sm flex place-content-start gap-2' })}
											id="show-version-history"
											onPress={() => {
												setSideSheetMode(SideSheetMode.FileVersionHistory);
												setSideSheetSelectedDataset(fileUuid);
												setOpen(true);
											}}
											variant="unset"
										>
											<HistoryIcon aria-hidden data-slot="icon" size={18} strokeWidth={1.5} /> Show version history
										</DrawerClose>
									)}
									<Separator />
									{isLatestVersionSelected ? (
										<>
											<DrawerClose
												aria-label="Edit filename"
												className={dropdownItemStyles({ className: 'text-base-sm flex place-content-start gap-2' })}
												id="edit-filename"
												onPress={() => setIsEditNameOpen(true)}
												variant="unset"
											>
												<PencilIcon aria-hidden size={18} strokeWidth={1.5} /> Edit filename
											</DrawerClose>
											<Link
												aria-label="Edit metadata"
												className={dropdownItemStyles({ className: 'text-base-sm flex gap-2' })}
												href={`/drafts/${fileUuid}/edit-metadata`}
												id="edit-metadata"
											>
												<PencilIcon aria-hidden size={18} strokeWidth={1.5} /> Edit metadata
											</Link>
										</>
									) : null}
									<Separator />
									{isLatestVersionSelected ? (
										<DrawerClose
											aria-label="Import file metadata"
											className={dropdownItemStyles({ className: 'text-base-sm flex place-content-start gap-2' })}
											id="import"
											onPress={() => setIsImportOpen(true)}
											variant="unset"
										>
											<FolderInputIcon aria-hidden size={18} strokeWidth={1.5} /> Import
										</DrawerClose>
									) : null}
									<DrawerClose
										aria-label="Export (zip)"
										className={dropdownItemStyles({ className: 'text-base-sm flex place-content-start gap-2' })}
										id="export"
										onPress={() => setIsExportOpen(true)}
										variant="unset"
									>
										<FolderArchiveIcon aria-hidden size={18} strokeWidth={1.5} /> Export
									</DrawerClose>
									<Separator />
									{datasetVersionData?.version_file ? (
										<DrawerClose
											aria-label="Download"
											className={dropdownItemStyles({ className: 'text-base-sm flex place-content-start gap-2' })}
											id="download"
											onPress={() => setIsDownloadOpen(true)}
											variant="unset"
										>
											<FileDownIcon aria-hidden size={18} strokeWidth={1.5} /> Download
										</DrawerClose>
									) : null}
									{isLatestVersionSelected ? (
										<DrawerClose
											aria-label="Delete"
											className={dropdownItemStyles({ className: 'text-base-sm flex place-content-start gap-2' })}
											data-destructive="true"
											id="delete"
											onPress={() => setIsDeleteConfirmOpen(true)}
											variant="unset"
										>
											<TrashIcon aria-hidden size={18} strokeWidth={1.5} /> Delete item
										</DrawerClose>
									) : null}
								</DrawerBody>
							</DrawerContent>
						</Drawer>
					</div>
				</div>
			) : isLatestVersionSelected ? (
				<Menu>
					<MenuTrigger
						aria-label="More menu"
						className={cx(
							'pressed:outline-2 pressed:outline-offset-2 pressed:outline-base-lavender-400 dark:pressed:outline-base-lavender-600',
							props.className,
						)}
						size="icon"
						variant="filled"
					>
						<MoreVerticalIcon aria-hidden size={18} strokeWidth={1.5} />
					</MenuTrigger>
					<MenuContent popover={{ arrow: false }}>
						{isVersionHistoryModeActive ? (
							<MenuItem
								aria-label="Exit version history"
								id="exit-version-history"
								key="exit-version-history"
								onAction={() => {
									setIsVersionHistoryExitDialogOpen(true);
								}}
							>
								<XIcon aria-hidden size={18} strokeWidth={1.5} /> Exit version history
							</MenuItem>
						) : (
							<MenuItem
								aria-label="Show version history"
								id="show-version-history"
								key="show-version-history"
								onAction={() => {
									setSideSheetMode(SideSheetMode.FileVersionHistory);
									setSideSheetSelectedDataset(fileUuid);
									setOpen(true);
								}}
							>
								<HistoryIcon aria-hidden size={18} strokeWidth={1.5} /> Show version history
							</MenuItem>
						)}
						<MenuSeparator />
						{isLatestVersionSelected ? (
							<>
								<MenuItem aria-label="Edit filename" id="edit-filename" onAction={() => setIsEditNameOpen(true)}>
									<PencilIcon aria-hidden size={18} strokeWidth={1.5} /> Edit filename
								</MenuItem>
								<MenuItem aria-label="Edit metadata" href={`/drafts/${fileUuid}/edit-metadata`} id="edit-metadata">
									<PencilIcon aria-hidden size={18} strokeWidth={1.5} /> Edit metadata
								</MenuItem>
							</>
						) : null}
						<MenuSeparator />
						{isLatestVersionSelected ? (
							<MenuItem aria-label="Import file metadata" id="import" onAction={() => setIsImportOpen(true)}>
								<FolderInputIcon aria-hidden size={18} strokeWidth={1.5} /> Import
							</MenuItem>
						) : null}
						<MenuItem aria-label="Export (zip)" id="export" onAction={async () => setIsExportOpen(true)}>
							<FolderArchiveIcon aria-hidden size={18} strokeWidth={1.5} /> Export
						</MenuItem>
						<MenuSeparator />
						{datasetVersionData?.version_file ? (
							<MenuItem aria-label="Download" id="download" onAction={() => setIsDownloadOpen(true)}>
								<FileDownIcon aria-hidden size={18} strokeWidth={1.5} /> Download
							</MenuItem>
						) : null}
						{isLatestVersionSelected ? (
							<MenuItem
								aria-label="Delete"
								id="delete"
								isDestructive
								onAction={async () => setIsDeleteConfirmOpen(true)}
							>
								<TrashIcon aria-hidden size={18} strokeWidth={1.5} /> Delete item
							</MenuItem>
						) : null}
					</MenuContent>
				</Menu>
			) : (
				<div className="flex place-items-center gap-4">
					{isMobile ? (
						<Button onPress={() => setOpen((open) => !open)} size="icon" variant="filled">
							<PanelRightOpenIcon aria-hidden data-slot="icon" size={18} strokeWidth={1.5} />
						</Button>
					) : null}
					<FileVersionHistoryCloseIndicator />
				</div>
			)}
			<DraftFileMoreMenuEditFilenameDialog
				fileUuid={fileUuid}
				filename={datasetData.display_name ?? ''}
				isOpen={isEditNameOpen}
				onOpenChange={setIsEditNameOpen}
			/>
			<FileImportDialog fileUuid={fileUuid} isOpen={isImportOpen} onOpenChange={setIsImportOpen} />
			<FileExportDialog
				filename={datasetData.display_name ?? ''}
				isOpen={isExportOpen}
				onOpenChange={setIsExportOpen}
				versionUuid={queryState ?? datasetData.latest_version?.pk ?? ''}
			/>
			<FileDownloadDialog
				filename={datasetData.display_name ?? ''}
				isOpen={isDownloadOpen}
				onOpenChange={setIsDownloadOpen}
				versionUuid={queryState ?? datasetData.latest_version?.pk ?? ''}
			/>
			<FileDeleteDialog
				fileUuid={fileUuid}
				filename={datasetData.display_name ?? ''}
				isOpen={isDeleteConfirmOpen}
				onOpenChange={setIsDeleteConfirmOpen}
				redirectUrl="/drafts"
			/>
			<FileVersionHistoryExitDialog
				isOpen={isVersionHistoryExitDialogOpen}
				onOpenChange={setIsVersionHistoryExitDialogOpen}
			/>
		</>
	);
}
