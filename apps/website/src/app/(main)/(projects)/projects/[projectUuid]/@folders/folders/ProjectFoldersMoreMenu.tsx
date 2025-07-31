'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MoreVerticalIcon, PencilIcon, Share2Icon, SplitIcon, TrashIcon } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useCopyToClipboard, useMediaQuery } from 'usehooks-ts';
import { FolderDeleteDialog, FolderEditLockDialog } from '@/components/Folder';
import { Button } from '@/components/ui/Button';
import { Drawer, DrawerBody, DrawerClose, DrawerContent, DrawerTrigger } from '@/components/ui/Drawer';
import { dropdownItemStyles } from '@/components/ui/Dropdown';
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from '@/components/ui/Menu';
import { Separator } from '@/components/ui/Separator';
import { globalToastQueue, ToastType } from '@/components/ui/Toast';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { cx } from '@/styles/cva';
import { $api, openAPIClient } from '@/util/clientFetch';
import { ProjectFoldersMoreMenuEditNameDialog } from './ProjectFoldersMoreMenuEditNameDialog';

export function ProjectFoldersMoreMenu({
	isDeletable = false,
	...props
}: {
	readonly className?: string;
	readonly folderName: string;
	readonly folderUuid: string;
	readonly isDeletable?: boolean | undefined;
	readonly projectUuid: string;
}) {
	const isMobile = useMediaQuery('(max-width: 600px)', { initializeWithValue: false });
	const queryClient = useQueryClient();
	const [isOpen, setIsOpen] = useState(false);
	const [_, copy] = useCopyToClipboard();
	const [isEditNameOpen, setIsEditNameOpen] = useState(false);
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

	const copyToClipboard = async () => {
		await copy(`${window.location.href}/folders/${props.folderUuid}`);
		globalToastQueue.add(
			{ message: 'Link has been copied to clipboard.', type: ToastType.TextOnly },
			{ timeout: 2_500 },
		);
	};

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
				<div className="md:hidden">
					<Drawer isOpen={isOpen} onOpenChange={setIsOpen} withNotch={false}>
						<DrawerTrigger aria-label="More menu" size="icon" variant="discreet">
							<MoreVerticalIcon aria-hidden size={24} strokeWidth={1.5} />
						</DrawerTrigger>
						<DrawerContent aria-label="More menu">
							<DrawerBody>
								<Link
									aria-label="Open in new tab"
									className={dropdownItemStyles({ className: 'text-base-sm flex gap-2' })}
									href={`/projects/${props.projectUuid}/folders/${props.folderUuid}`}
									onClick={() => setIsOpen(false)}
									target="_blank"
								>
									<SplitIcon aria-hidden size={18} strokeWidth={1.5} /> Open in new tab
								</Link>
								<DrawerClose
									aria-label="Share detail link"
									className={dropdownItemStyles({ className: 'text-base-sm flex place-content-start gap-2' })}
									onPress={async () => {
										await navigator.share({ url: `${window.location.href}/folders/${props.folderUuid}` });
									}}
									variant="unset"
								>
									<Share2Icon aria-hidden size={18} strokeWidth={1.5} /> Share detail link
								</DrawerClose>
								{canEdit ? (
									<>
										<Separator />
										<Button
											aria-label="Edit name"
											className={dropdownItemStyles({ className: 'text-base-sm flex place-content-start gap-2' })}
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
											<PencilIcon aria-hidden size={18} strokeWidth={1.5} /> Edit name
										</Button>
										{isDeletable ? (
											<DrawerClose
												aria-label="Delete folder"
												className={dropdownItemStyles({ className: 'text-base-sm flex place-content-start gap-2' })}
												data-destructive="true"
												id="delete"
												onPress={() => setIsDeleteConfirmOpen(true)}
												variant="unset"
											>
												<TrashIcon aria-hidden size={18} strokeWidth={1.5} /> Delete folder
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
						size="icon-sm"
						variant="discreet"
					>
						<MoreVerticalIcon aria-hidden size={18} strokeWidth={1.5} />
					</MenuTrigger>
					<MenuContent placement="bottom">
						<MenuItem
							aria-label="Open in new tab"
							href={`/projects/${props.projectUuid}/folders/${props.folderUuid}`}
							target="_blank"
						>
							<SplitIcon aria-hidden size={18} strokeWidth={1.5} /> Open in new tab
						</MenuItem>
						<MenuItem aria-label="Share detail link" id="share" onAction={copyToClipboard}>
							<Share2Icon aria-hidden size={18} strokeWidth={1.5} /> Share detail link
						</MenuItem>
						{canEdit ? (
							<>
								<MenuSeparator />
								<MenuItem
									aria-label="Edit name"
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
									<PencilIcon aria-hidden size={18} strokeWidth={1.5} /> Edit name
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
			<ProjectFoldersMoreMenuEditNameDialog
				folderName={props.folderName}
				folderUuid={props.folderUuid}
				isOpen={isEditNameOpen}
				onOpenChange={setIsEditNameOpen}
				projectUuid={props.projectUuid}
			/>
			<FolderDeleteDialog
				folderName={props.folderName}
				folderUuid={props.folderUuid}
				isOpen={isDeleteConfirmOpen}
				onOpenChange={setIsDeleteConfirmOpen}
				projectUuid={props.projectUuid}
			/>
			<FolderEditLockDialog folderUuid={props.folderUuid} isOpen={isEditLockOpen} onOpenChange={setIsEditLockOpen} />
		</>
	);
}
