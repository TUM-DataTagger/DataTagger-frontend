'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { useAtom } from 'jotai';
import {
	FileDownIcon,
	HistoryIcon,
	/* FolderArchiveIcon, */ MoreVerticalIcon,
	PanelRightOpenIcon,
	PencilIcon,
	TrashIcon,
	XIcon,
} from 'lucide-react';
import Link from 'next/link';
import { parseAsString, useQueryState } from 'nuqs';
import { useState } from 'react';
import { useMediaQuery } from 'usehooks-ts';
import { FileDeleteDialog } from '@/components/File';
import { VersionHistoryExitDialog, VersionHistoryCloseIndicator } from '@/components/VersionHistory';
import { Button } from '@/components/ui/Button';
import { Drawer, DrawerBody, DrawerClose, DrawerContent, DrawerTrigger } from '@/components/ui/Drawer';
import { dropdownItemStyles } from '@/components/ui/Dropdown';
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from '@/components/ui/Menu';
import { Separator } from '@/components/ui/Separator';
import { useSidebar } from '@/components/ui/Sidebar';
import { useEnv } from '@/contexts/EnvContext';
import { SideSheetMode, sideSheetModeAtom, sideSheetSelectedDatasetAtom } from '@/stores/sideSheet';
import { cx } from '@/styles/cva';
import { $api } from '@/util/clientFetch';
import { DraftFileMoreMenuEditFilenameDialog } from './DraftFileMoreMenuEditFilenameDialog';
// import { DraftFileMoreMenuExportDialog } from './DraftFileMoreMenuExportDialog';

export function DraftFileMoreMenu({ fileUuid, ...props }: { readonly className?: string; readonly fileUuid: string }) {
	const isMobile = useMediaQuery('(max-width: 600px)', { initializeWithValue: false });
	const env = useEnv();
	const [queryState] = useQueryState('version', parseAsString);
	const [sideSheetMode, setSideSheetMode] = useAtom(sideSheetModeAtom);
	const [sideSheetSelectedDataset, setSideSheetSelectedDataset] = useAtom(sideSheetSelectedDatasetAtom);
	const { setOpen } = useSidebar();
	const [isEditNameOpen, setIsEditNameOpen] = useState(false);
	// const [isExportOpen, setIsExportOpen] = useState(false);
	const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
	const [isVersionHistoryExitDialogOpen, setIsVersionHistoryExitDialogOpen] = useState(false);

	const isVersionHistoryModeActive = Boolean(
		sideSheetMode === SideSheetMode.VersionHistory && sideSheetSelectedDataset,
	);

	const { data: datasetData } = useSuspenseQuery(
		$api.queryOptions('get', '/api/v1/uploads-dataset/{id}/', {
			params: { path: { id: fileUuid } },
		}),
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
												setSideSheetMode(SideSheetMode.VersionHistory);
												setSideSheetSelectedDataset(fileUuid);
												setOpen(true);
											}}
											variant="unset"
										>
											<HistoryIcon aria-hidden data-slot="icon" size={18} strokeWidth={1.5} /> Show version history
										</DrawerClose>
									)}
									<Separator />
									{queryState ? null : (
										<>
											<DrawerClose
												aria-label="Edit filename"
												className={dropdownItemStyles({ className: 'text-base-sm flex place-content-start gap-2' })}
												id="edit"
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
									)}
									<a
										className={dropdownItemStyles({ className: 'text-base-sm flex gap-2' })}
										href={`${env.BASE_API_URL}/api/v1/uploads-version/${queryState ?? datasetData.latest_version?.pk}/download/?as_attachment=true`}
										rel="noreferrer noopener external"
										target="_blank"
									>
										<FileDownIcon aria-hidden size={18} strokeWidth={1.5} /> Download
									</a>
									{/* <Button
										aria-label="Export (zip)"
										className={dropdownItemStyles({ className: 'text-base-sm flex place-content-start gap-2' })}
										id="export"
										onPress={() => setIsExportOpen(true)}
										variant="unset"
									>
										<FolderArchiveIcon aria-hidden size={18} strokeWidth={1.5} /> Export (zip)
									</Button> */}
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
						variant="outline"
					>
						<MoreVerticalIcon aria-hidden size={18} strokeWidth={1.5} />
					</MenuTrigger>
					<MenuContent placement="bottom">
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
									setSideSheetMode(SideSheetMode.VersionHistory);
									setSideSheetSelectedDataset(fileUuid);
									setOpen(true);
								}}
							>
								<HistoryIcon aria-hidden size={18} strokeWidth={1.5} /> Show version history
							</MenuItem>
						)}
						<MenuSeparator />
						{queryState ? null : (
							<>
								<MenuItem aria-label="Edit filename" id="edit" onAction={() => setIsEditNameOpen(true)}>
									<PencilIcon aria-hidden size={18} strokeWidth={1.5} /> Edit filename
								</MenuItem>
								<MenuItem aria-label="Edit metadata" href={`/drafts/${fileUuid}/edit-metadata`} id="edit-metadata">
									<PencilIcon aria-hidden size={18} strokeWidth={1.5} /> Edit metadata
								</MenuItem>
							</>
						)}
						<MenuItem
							href={`${env.BASE_API_URL}/api/v1/uploads-version/${queryState ?? datasetData.latest_version?.pk}/download/?as_attachment=true`}
							rel="noreferrer noopener external"
							target="_blank"
						>
							<FileDownIcon aria-hidden size={18} strokeWidth={1.5} /> Download
						</MenuItem>
						{/* <MenuItem aria-label="Export (zip)" id="export" onAction={async () => setIsExportOpen(true)}>
							<FolderArchiveIcon aria-hidden size={18} strokeWidth={1.5} /> Export (zip)
						</MenuItem> */}
						<MenuItem aria-label="Delete" id="delete" isDestructive onAction={async () => setIsDeleteConfirmOpen(true)}>
							<TrashIcon aria-hidden size={18} strokeWidth={1.5} /> Delete item
						</MenuItem>
					</MenuContent>
				</Menu>
			) : (
				<div className="flex place-items-center gap-4">
					{isMobile ? (
						<Button onPress={() => setOpen((open) => !open)} size="icon" variant="filled">
							<PanelRightOpenIcon aria-hidden data-slot="icon" size={18} strokeWidth={1.5} />
						</Button>
					) : null}
					<VersionHistoryCloseIndicator />
				</div>
			)}
			<DraftFileMoreMenuEditFilenameDialog
				fileUuid={fileUuid}
				filename={datasetData.display_name ?? ''}
				isOpen={isEditNameOpen}
				onOpenChange={setIsEditNameOpen}
			/>
			{/* <DraftFileMoreMenuExportDialog
				filename={filename}
				isOpen={isExportOpen}
				onOpenChange={setIsExportOpen}
				versionUuid={datasetData.latest_version?.pk}
			/> */}
			<FileDeleteDialog
				fileUuid={fileUuid}
				filename={datasetData.display_name ?? ''}
				isOpen={isDeleteConfirmOpen}
				onOpenChange={setIsDeleteConfirmOpen}
				redirectUrl="/drafts"
			/>
			<VersionHistoryExitDialog
				isOpen={isVersionHistoryExitDialogOpen}
				onOpenChange={setIsVersionHistoryExitDialogOpen}
			/>
		</>
	);
}
