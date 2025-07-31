'use client';

import { useQuery, useQueryClient, useSuspenseQueries } from '@tanstack/react-query';
import { useAtom } from 'jotai';
import {
	FileDownIcon,
	HistoryIcon,
	/* FolderArchiveIcon, */ MoreVerticalIcon,
	PanelRightOpenIcon,
	PencilIcon,
	XIcon,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { parseAsString, useQueryState } from 'nuqs';
import { useState } from 'react';
import { useMediaQuery } from 'usehooks-ts';
import { FileEditLockDialog } from '@/components/File';
import { VersionHistoryCloseIndicator, VersionHistoryExitDialog } from '@/components/VersionHistory';
import { Button } from '@/components/ui/Button';
import { Drawer, DrawerBody, DrawerClose, DrawerContent, DrawerTrigger } from '@/components/ui/Drawer';
import { dropdownItemStyles } from '@/components/ui/Dropdown';
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from '@/components/ui/Menu';
import { Separator } from '@/components/ui/Separator';
import { useSidebar } from '@/components/ui/Sidebar';
import { useEnv } from '@/contexts/EnvContext';
import { useWebSocket } from '@/contexts/WebSocket';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { SideSheetMode, sideSheetModeAtom, sideSheetSelectedDatasetAtom } from '@/stores/sideSheet';
import { cx } from '@/styles/cva';
import { $api, openAPIClient } from '@/util/clientFetch';
import { ProjectFolderFileMoreMenuEditFilenameDialog } from './ProjectFolderFileMoreMenuEditFilenameDialog';
// import { ProjectFolderFileMoreMenuExportDialog } from './ProjectFolderFileMoreMenuExportDialog';

export function ProjectFolderFileMoreMenu(props: {
	readonly className?: string;
	readonly fileUuid: string;
	readonly folderUuid: string;
	readonly projectUuid: string;
}) {
	const [queryState] = useQueryState('version', parseAsString);
	const router = useRouter();
	const isMobile = useMediaQuery('(max-width: 600px)', { initializeWithValue: false });
	const env = useEnv();
	const queryClient = useQueryClient();
	const [isOpen, setIsOpen] = useState(false);
	const [sideSheetMode, setSideSheetMode] = useAtom(sideSheetModeAtom);
	const [sideSheetSelectedDataset, setSideSheetSelectedDataset] = useAtom(sideSheetSelectedDatasetAtom);
	const { setOpen } = useSidebar();
	const [isEditNameOpen, setIsEditNameOpen] = useState(false);
	// const [isExportOpen, setIsExportOpen] = useState(false);
	const [isEditLockOpen, setIsEditLockOpen] = useState(false);
	const [isVersionHistoryExitDialogOpen, setIsVersionHistoryExitDialogOpen] = useState(false);

	const { currentUserData } = useCurrentUser();

	const { messages } = useWebSocket();

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

	const lockMessage = messages[props.fileUuid]?.find((message) => message.type === 'lock_status_changed')?.data;
	const isFileLocked = lockMessage?.status === undefined ? Boolean(lockData.data.locked) : Boolean(lockMessage.status);

	const isVersionHistoryModeActive = Boolean(
		sideSheetMode === SideSheetMode.VersionHistory && sideSheetSelectedDataset,
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
												setSideSheetSelectedDataset(props.fileUuid);
												setOpen(true);
											}}
											variant="unset"
										>
											<HistoryIcon aria-hidden data-slot="icon" size={18} strokeWidth={1.5} /> Show version history
										</DrawerClose>
									)}
									<Separator />
									{queryState || !canEdit ? null : (
										<>
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
									<a
										className={dropdownItemStyles({ className: 'text-base-sm flex gap-2' })}
										href={`${env.BASE_API_URL}/api/v1/uploads-version/${queryState ?? datasetData.data.latest_version?.pk}/download/?as_attachment=true`}
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
									setSideSheetSelectedDataset(props.fileUuid);
									setOpen(true);
								}}
							>
								<HistoryIcon aria-hidden size={18} strokeWidth={1.5} /> Show version history
							</MenuItem>
						)}
						<MenuSeparator />
						{queryState || !canEdit ? null : (
							<>
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
						<MenuItem
							href={`${env.BASE_API_URL}/api/v1/uploads-version/${queryState ?? datasetData.data.latest_version?.pk}/download/?as_attachment=true`}
							rel="noreferrer noopener external"
							target="_blank"
						>
							<FileDownIcon aria-hidden size={18} strokeWidth={1.5} /> Download
						</MenuItem>
						{/* <MenuItem aria-label="Export (zip)" id="export" onAction={async () => setIsExportOpen(true)}>
							<FolderArchiveIcon aria-hidden size={18} strokeWidth={1.5} /> Export (zip)
						</MenuItem> */}
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
			<ProjectFolderFileMoreMenuEditFilenameDialog
				fileUuid={props.fileUuid}
				filename={datasetData.data.display_name ?? ''}
				folderUuid={props.folderUuid}
				isOpen={isEditNameOpen}
				onOpenChange={setIsEditNameOpen}
			/>
			{/* <ProjectFolderFileMoreMenuExportDialog
				filename={filename}
				isOpen={isExportOpen}
				onOpenChange={setIsExportOpen}
				versionUuid={versionUuid}
			/> */}
			<FileEditLockDialog fileUuid={props.fileUuid} isOpen={isEditLockOpen} onOpenChange={setIsEditLockOpen} />
			<VersionHistoryExitDialog
				isOpen={isVersionHistoryExitDialogOpen}
				onOpenChange={setIsVersionHistoryExitDialogOpen}
			/>
		</>
	);
}
