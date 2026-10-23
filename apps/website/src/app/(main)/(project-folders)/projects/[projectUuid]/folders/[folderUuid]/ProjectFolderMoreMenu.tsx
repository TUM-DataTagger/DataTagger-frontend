'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FolderArchiveIcon, MoreVerticalIcon, PencilIcon, Share2Icon, TrashIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useMediaQuery } from 'usehooks-ts';
import { ExportJobDialog } from '@/components/ExportJobDialog';
import { FolderDeleteDialog, FolderEditLockDialog } from '@/components/Folder';
import { Drawer, DrawerBody, DrawerClose, DrawerContent, DrawerTrigger } from '@/components/ui/Drawer';
import { dropdownItemStyles } from '@/components/ui/Dropdown';
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from '@/components/ui/Menu';
import { Separator } from '@/components/ui/Separator';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { cx } from '@/styles/cva';
import { $api, openAPIClient } from '@/util/clientFetch';
import { EXPORT_TYPES } from '@/util/exportJobs';
import { ProjectFolderEdit } from './ProjectFolderEdit';

export function ProjectFolderMoreMenu({
	isDeletable = false,
	...props
}: {
	readonly className?: string;
	readonly folderName?: string | undefined;
	readonly folderUuid: string;
	readonly isDeletable?: boolean | undefined;
	readonly projectUuid: string;
}) {
	const router = useRouter();
	const isMobile = useMediaQuery('(max-width: 600px)', { initializeWithValue: false });
	const queryClient = useQueryClient();
	const [isOpen, setIsOpen] = useState(false);
	const [isExportOpen, setIsExportOpen] = useState(false);
	const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
	const [isEditLockOpen, setIsEditLockOpen] = useState(false);

	const { currentUserData } = useCurrentUser();

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
		const { data } = await openAPIClient.GET('/api/v1/folder/{id}/status/', {
			params: { path: { id: props.folderUuid } },
		});
		await queryClient.invalidateQueries({
			queryKey: $api.queryOptions('get', '/api/v1/folder/{id}/status/', {
				params: { path: { id: props.folderUuid } },
			}).queryKey,
		});

		return data;
	}

	async function setLocked() {
		const { data } = await openAPIClient.POST('/api/v1/folder/{id}/lock/', {
			params: { path: { id: props.folderUuid } },
		});

		return data;
	}

	return (
		<>
			{isMobile ? (
				<div>
					<Drawer isOpen={isOpen} onOpenChange={setIsOpen} withNotch={false}>
						<DrawerTrigger aria-label="More menu" size="icon" variant="filled">
							<MoreVerticalIcon aria-hidden size={24} strokeWidth={1.5} />
						</DrawerTrigger>
						<DrawerContent aria-label="More menu">
							<DrawerBody>
								<DrawerClose
									aria-label="Share detail link"
									className={dropdownItemStyles({ className: 'text-base-sm flex place-content-start gap-2' })}
									onPress={async () => {
										await navigator.share({ url: window.location.href });
									}}
									variant="unset"
								>
									<Share2Icon aria-hidden size={18} strokeWidth={1.5} /> Share link
								</DrawerClose>
								<Separator />
								<DrawerClose
									aria-label="Export (zip)"
									className={dropdownItemStyles({ className: 'text-base-sm flex place-content-start gap-2' })}
									id="export"
									onPress={() => setIsExportOpen(true)}
									variant="unset"
								>
									<FolderArchiveIcon aria-hidden size={18} strokeWidth={1.5} /> Export
								</DrawerClose>
								{canEdit ? (
									<>
										<Separator />
										<ProjectFolderEdit
											aria-label="Edit basic information"
											className={dropdownItemStyles({ className: 'text-base-sm flex place-content-start gap-2' })}
											folderUuid={props.folderUuid}
											href={`/projects/${props.projectUuid}/folders/${props.folderUuid}/details/edit`}
											onClick={(isLocked) => {
												setIsOpen(false);
												setIsEditLockOpen(Boolean(isLocked));
											}}
											size="default"
											variant="unset"
										>
											Edit basic information
										</ProjectFolderEdit>
										{isDeletable ? (
											<DrawerClose
												aria-label="Delete folder"
												className={dropdownItemStyles({ className: 'text-base-sm flex place-content-start gap-2' })}
												data-destructive="true"
												id="delete"
												onPress={() => setIsDeleteConfirmOpen(true)}
												variant="unset"
											>
												<TrashIcon aria-hidden size={18} strokeWidth={1.5} />
												Delete folder
											</DrawerClose>
										) : null}
									</>
								) : null}
							</DrawerBody>
						</DrawerContent>
					</Drawer>
				</div>
			) : (
				<Menu isOpen={isOpen} onOpenChange={setIsOpen}>
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
					<MenuContent placement="bottom" popover={{ arrow: false }}>
						<MenuItem aria-label="Export (zip)" id="export" onAction={async () => setIsExportOpen(true)}>
							<FolderArchiveIcon aria-hidden size={18} strokeWidth={1.5} /> Export
						</MenuItem>
						{canEdit ? (
							<>
								<MenuSeparator />
								<MenuItem
									aria-label="Edit basic information"
									id="edit"
									onAction={async () => {
										const status = await isLocked();
										if (status?.locked) {
											setIsEditLockOpen(true);
										} else {
											await setLocked();
											router.push(`/projects/${props.projectUuid}/folders/${props.folderUuid}/details/edit`);
										}
									}}
								>
									<PencilIcon aria-hidden size={18} strokeWidth={1.5} /> Edit basic information
								</MenuItem>
								{isDeletable ? (
									<MenuItem
										aria-label="Delete folder"
										id="delete"
										isDestructive
										onAction={async () => setIsDeleteConfirmOpen(true)}
									>
										<TrashIcon aria-hidden size={18} strokeWidth={1.5} />
										Delete folder
									</MenuItem>
								) : null}
							</>
						) : null}
					</MenuContent>
				</Menu>
			)}
			<ExportJobDialog
				description={
					<>
						Export available data from <span className="text-base-label-md">
							{props.folderName ?? 'this folder'}
						</span>{' '}
						to a zip file. Without metadata, the zip keeps the original subfolder structure.
					</>
				}
				exportType={EXPORT_TYPES.Folder}
				isOpen={isExportOpen}
				onOpenChange={setIsExportOpen}
				title="Export folder"
				uuids={[props.folderUuid]}
			/>
			<FolderDeleteDialog
				folderName={props.folderName ?? ''}
				folderUuid={props.folderUuid}
				isOpen={isDeleteConfirmOpen}
				onOpenChange={setIsDeleteConfirmOpen}
				projectUuid={props.projectUuid}
			/>
			<FolderEditLockDialog folderUuid={props.folderUuid} isOpen={isEditLockOpen} onOpenChange={setIsEditLockOpen} />
		</>
	);
}
