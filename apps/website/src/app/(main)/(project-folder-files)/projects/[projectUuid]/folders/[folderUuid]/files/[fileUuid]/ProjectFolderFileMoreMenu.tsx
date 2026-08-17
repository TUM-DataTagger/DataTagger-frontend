'use client';

import { useQuery, useQueryClient, useSuspenseQueries } from '@tanstack/react-query';
import { useAtom } from 'jotai';
import {
	FileDownIcon,
	FolderArchiveIcon,
	/* FolderInputIcon, */
	HistoryIcon,
	/* FolderArchiveIcon, */
	MoreVerticalIcon,
	PanelRightOpenIcon,
	PencilIcon,
	XIcon,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { parseAsString, useQueryState } from 'nuqs';
import { useState } from 'react';
import { useMediaQuery } from 'usehooks-ts';
import { FileDownloadDialog, FileEditLockDialog, FileExportDialog } from '@/components/File';
import { FileVersionHistoryCloseIndicator, FileVersionHistoryExitDialog } from '@/components/FileVersionHistory';
import { Button } from '@/components/ui/Button';
import { Drawer, DrawerBody, DrawerClose, DrawerContent, DrawerTrigger } from '@/components/ui/Drawer';
import { dropdownItemStyles } from '@/components/ui/Dropdown';
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from '@/components/ui/Menu';
import { Separator } from '@/components/ui/Separator';
import { useSidebar } from '@/components/ui/Sidebar';
import { useWebSocketMessages } from '@/contexts/WebSocket';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { SideSheetMode, sideSheetModeAtom, sideSheetSelectedDatasetAtom } from '@/stores/sideSheet';
import { cx } from '@/styles/cva';
import { $api, openAPIClient } from '@/util/clientFetch';
import { ProjectFolderFileMoreMenuEditFilenameDialog } from './ProjectFolderFileMoreMenuEditFilenameDialog';

export function ProjectFolderFileMoreMenu(props: {
	readonly className?: string;
	readonly fileUuid: string;
	readonly folderUuid: string;
	readonly projectUuid: string;
}) {
	const [queryState] = useQueryState('version', parseAsString);
	const router = useRouter();
	const isMobile = useMediaQuery('(max-width: 600px)', { initializeWithValue: false });
	const queryClient = useQueryClient();
	const [isOpen, setIsOpen] = useState(false);
	const [sideSheetMode, setSideSheetMode] = useAtom(sideSheetModeAtom);
	const [sideSheetSelectedDataset, setSideSheetSelectedDataset] = useAtom(sideSheetSelectedDatasetAtom);
	const { setOpen } = useSidebar();
	const [isEditNameOpen, setIsEditNameOpen] = useState(false);
	const [isExportOpen, setIsExportOpen] = useState(false);
	const [isDownloadOpen, setIsDownloadOpen] = useState(false);
	const [isEditLockOpen, setIsEditLockOpen] = useState(false);
	const [isVersionHistoryExitDialogOpen, setIsVersionHistoryExitDialogOpen] = useState(false);

	const { currentUserData } = useCurrentUser();

	const messages = useWebSocketMessages();

	const [lockData, datasetData] = useSuspenseQueries({
		queries: [
			$api.queryOptions('get', '/api/v1/uploads-dataset/{id}/status/', {
				params: { path: { id: props.fileUuid } },
			}),
			$api.queryOptions('get', '/api/v1/uploads-dataset/{id}/', {
				params: { path: { id: props.fileUuid } },
			}),
		],
	});

	const { data: datasetVersionData } = useQuery(
		$api.queryOptions(
			'get',
			'/api/v1/uploads-version/{id}/',
			{
				params: { path: { id: datasetData.data.latest_version?.pk ?? '' } },
			},
			{ enabled: Boolean(datasetData.data.latest_version) },
		),
	);

	const lockMessage = messages[props.fileUuid]?.find((message) => message.type === 'lock_status_changed')?.data;
	const isFileLocked = lockMessage?.status === undefined ? Boolean(lockData.data.locked) : Boolean(lockMessage.status);

	const isVersionHistoryModeActive = Boolean(
		sideSheetMode === SideSheetMode.FileVersionHistory && sideSheetSelectedDataset,
	);

	const isLatestVersionSelected = Boolean(!queryState || queryState === datasetData.data.latest_version?.pk);

	const { data: folderPermissionData } = useQuery(
		$api.queryOptions(
			'get',
			'/api/v1/folder-permission/',
			{
				params: { query: { folder: props.folderUuid, project_membership__member: currentUserData?.pk ?? -1 } },
			},
			{ enabled: Boolean(currentUserData?.pk && isOpen) },
		),
	);

	const canEdit = folderPermissionData?.[0]?.is_folder_admin || folderPermissionData?.[0]?.can_edit;

	async function isLocked() {
		const { data } = await openAPIClient.GET('/api/v1/uploads-dataset/{id}/status/', {
			params: { path: { id: props.fileUuid } },
		});
		await queryClient.invalidateQueries({
			queryKey: $api.queryOptions('get', '/api/v1/uploads-dataset/{id}/status/', {
				params: { path: { id: props.fileUuid } },
			}).queryKey,
		});

		return data;
	}

	async function setLocked() {
		const { data } = await openAPIClient.POST('/api/v1/uploads-dataset/{id}/lock/', {
			params: { path: { id: props.fileUuid } },
		});

		return data;
	}

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
						<Drawer isOpen={isOpen} onOpenChange={setIsOpen} withNotch={false}>
							<DrawerTrigger aria-label="More menu" isDisabled={isFileLocked} size="icon" variant="filled">
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
												setSideSheetSelectedDataset(props.fileUuid);
												setOpen(true);
											}}
											variant="unset"
										>
											<HistoryIcon aria-hidden data-slot="icon" size={18} strokeWidth={1.5} /> Show version history
										</DrawerClose>
									)}
									{!isLatestVersionSelected || !canEdit ? null : (
										<>
											<Separator />
											<DrawerClose
												aria-label="Edit filename"
												className={dropdownItemStyles({ className: 'text-base-sm flex place-content-start gap-2' })}
												id="edit"
												onPress={async () => {
													const status = await isLocked();
													if (status?.locked) {
														setIsEditLockOpen(true);
													} else {
														await setLocked();
														setIsEditNameOpen(true);
													}
												}}
												variant="unset"
											>
												<PencilIcon aria-hidden size={18} strokeWidth={1.5} /> Edit filename
											</DrawerClose>
											<DrawerClose
												aria-label="Edit metadata"
												className={dropdownItemStyles({ className: 'text-base-sm flex place-content-start gap-2' })}
												id="edit-metadata"
												onPress={async () => {
													const status = await isLocked();
													if (status?.locked) {
														setIsEditLockOpen(true);
													} else {
														await setLocked();
														router.push(
															`/projects/${props.projectUuid}/folders/${props.folderUuid}/files/${props.fileUuid}/edit-metadata`,
														);
													}
												}}
												variant="unset"
											>
												<PencilIcon aria-hidden size={18} strokeWidth={1.5} /> Edit metadata
											</DrawerClose>
										</>
									)}
									<Separator />
									{/* {isLatestVersionSelected ? (
										<DrawerClose>
											<FolderInputIcon aria-hidden size={18} strokeWidth={1.5} /> Import
										</DrawerClose>
									) : null} */}
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
								</DrawerBody>
							</DrawerContent>
						</Drawer>
					</div>
				</div>
			) : isLatestVersionSelected ? (
				<Menu isOpen={isOpen} onOpenChange={setIsOpen}>
					<MenuTrigger
						aria-label="More menu"
						className={cx(
							'pressed:outline-2 pressed:outline-offset-2 pressed:outline-base-lavender-400 dark:pressed:outline-base-lavender-600',
							props.className,
						)}
						isDisabled={isFileLocked}
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
									setSideSheetSelectedDataset(props.fileUuid);
									setOpen(true);
								}}
							>
								<HistoryIcon aria-hidden size={18} strokeWidth={1.5} /> Show version history
							</MenuItem>
						)}
						{!isLatestVersionSelected || !canEdit ? null : (
							<>
								<MenuSeparator />
								<MenuItem
									aria-label="Edit filename"
									id="edit"
									onAction={async () => {
										const status = await isLocked();
										if (status?.locked) {
											setIsEditLockOpen(true);
										} else {
											await setLocked();
											setIsEditNameOpen(true);
										}
									}}
								>
									<PencilIcon aria-hidden size={18} strokeWidth={1.5} /> Edit filename
								</MenuItem>
								<MenuItem
									aria-label="Edit metadata"
									id="edit-metadata"
									onAction={async () => {
										const status = await isLocked();
										if (status?.locked) {
											setIsEditLockOpen(true);
										} else {
											await setLocked();
											router.push(
												`/projects/${props.projectUuid}/folders/${props.folderUuid}/files/${props.fileUuid}/edit-metadata`,
											);
										}
									}}
								>
									<PencilIcon aria-hidden size={18} strokeWidth={1.5} /> Edit metadata
								</MenuItem>
							</>
						)}
						<MenuSeparator />
						{/* {isLatestVersionSelected ? (
							<MenuItem>
								<FolderInputIcon aria-hidden size={18} strokeWidth={1.5} /> Import
							</MenuItem>
						) : null} */}
						<MenuItem aria-label="Export (zip)" id="export" onAction={async () => setIsExportOpen(true)}>
							<FolderArchiveIcon aria-hidden size={18} strokeWidth={1.5} /> Export
						</MenuItem>
						<MenuSeparator />
						{datasetVersionData?.version_file ? (
							<MenuItem aria-label="Download" id="download" onAction={() => setIsDownloadOpen(true)}>
								<FileDownIcon aria-hidden size={18} strokeWidth={1.5} /> Download
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
			<ProjectFolderFileMoreMenuEditFilenameDialog
				fileUuid={props.fileUuid}
				filename={datasetData.data.display_name ?? ''}
				folderUuid={props.folderUuid}
				isOpen={isEditNameOpen}
				onOpenChange={setIsEditNameOpen}
			/>
			<FileExportDialog
				filename={datasetData.data.display_name ?? ''}
				isOpen={isExportOpen}
				onOpenChange={setIsExportOpen}
				versionUuid={queryState ?? datasetData.data.latest_version?.pk ?? ''}
			/>
			<FileDownloadDialog
				filename={datasetData.data.display_name ?? ''}
				isOpen={isDownloadOpen}
				onOpenChange={setIsDownloadOpen}
				versionUuid={queryState ?? datasetData.data.latest_version?.pk ?? ''}
			/>
			<FileEditLockDialog fileUuid={props.fileUuid} isOpen={isEditLockOpen} onOpenChange={setIsEditLockOpen} />
			<FileVersionHistoryExitDialog
				isOpen={isVersionHistoryExitDialogOpen}
				onOpenChange={setIsVersionHistoryExitDialogOpen}
			/>
		</>
	);
}
