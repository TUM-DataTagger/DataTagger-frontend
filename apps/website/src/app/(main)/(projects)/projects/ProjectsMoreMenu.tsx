'use client';

import { useQuery } from '@tanstack/react-query';
import { /* FolderArchiveIcon, */ MoreVerticalIcon, Share2Icon, SplitIcon, TrashIcon } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useCopyToClipboard, useMediaQuery } from 'usehooks-ts';
import { ProjectDeleteDialog } from '@/components/Project';
import { Drawer, DrawerBody, DrawerClose, DrawerContent, DrawerTrigger } from '@/components/ui/Drawer';
import { dropdownItemStyles } from '@/components/ui/Dropdown';
import { Menu, MenuContent, MenuItem /* , MenuSeparator */, MenuSeparator, MenuTrigger } from '@/components/ui/Menu';
import { Separator } from '@/components/ui/Separator';
import { globalToastQueue, ToastType } from '@/components/ui/Toast';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { cx } from '@/styles/cva';
import { $api } from '@/util/clientFetch';
// import { DraftsMoreMenuExportDialog } from './DraftsMoreMenuExportDialog';

export function ProjectsMoreMenu({
	isDeletable = false,
	...props
}: {
	readonly className?: string;
	readonly isDeletable?: boolean | undefined;
	readonly projectName: string | null | undefined;
	readonly projectUuid: string;
}) {
	const isMobile = useMediaQuery('(max-width: 600px)', { initializeWithValue: false });
	const [isOpen, setIsOpen] = useState(false);
	const [, copy] = useCopyToClipboard();
	// const [isExportOpen, setIsExportOpen] = useState(false);
	const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

	const { currentUserData } = useCurrentUser();

	const { data: projectPermissionData } = useQuery(
		$api.queryOptions(
			'get',
			'/api/v1/project-membership/',
			{
				params: { query: { project: props.projectUuid, member: currentUserData?.pk ?? -1 } },
			},
			{ enabled: Boolean(currentUserData?.pk && isOpen) },
		),
	);

	const isProjectAdmin = projectPermissionData?.[0]?.is_project_admin;

	const copyToClipboard = async () => {
		await copy(`${window.location.href}/${props.projectUuid}`);
		globalToastQueue.add(
			{ message: 'Link has been copied to clipboard.', type: ToastType.TextOnly },
			{ timeout: 2_500 },
		);
	};

	return (
		<>
			{isMobile ? (
				<div>
					<Drawer isOpen={isOpen} onOpenChange={setIsOpen} withNotch={false}>
						<DrawerTrigger aria-label="More menu" size="icon" variant="discreet">
							<MoreVerticalIcon aria-hidden size={24} strokeWidth={1.5} />
						</DrawerTrigger>
						<DrawerContent aria-label="More menu">
							<DrawerBody>
								<Link
									aria-label="Open in new tab"
									className={dropdownItemStyles({ className: 'text-base-sm flex gap-2' })}
									href={`/projects/${props.projectUuid}`}
									onClick={() => setIsOpen(false)}
									target="_blank"
								>
									<SplitIcon aria-hidden size={18} strokeWidth={1.5} /> Open in new tab
								</Link>
								<DrawerClose
									aria-label="Share detail link"
									className={dropdownItemStyles({ className: 'text-base-sm flex place-content-start gap-2' })}
									onPress={copyToClipboard}
									variant="unset"
								>
									<Share2Icon aria-hidden size={18} strokeWidth={1.5} /> Share detail link
								</DrawerClose>
								{isProjectAdmin && isDeletable ? (
									<>
										<Separator />
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
											<TrashIcon aria-hidden size={18} strokeWidth={1.5} /> Delete project
										</DrawerClose>
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
						<MenuItem aria-label="Open in new tab" href={`/projects/${props.projectUuid}`} target="_blank">
							<SplitIcon aria-hidden size={18} strokeWidth={1.5} /> Open in new tab
						</MenuItem>
						<MenuItem aria-label="Share detail link" id="share" onAction={copyToClipboard}>
							<Share2Icon aria-hidden size={18} strokeWidth={1.5} /> Share detail link
						</MenuItem>
						{isProjectAdmin && isDeletable ? (
							<>
								<MenuSeparator />
								{/* <MenuItem aria-label="Export (zip)" id="export" onAction={async () => setIsExportOpen(true)}>
									<FolderArchive aria-hidden size={18} strokeWidth={1.5} /> Export (zip)
								</MenuItem> */}
								<MenuItem
									aria-label="Delete"
									id="delete"
									isDestructive
									onAction={async () => setIsDeleteConfirmOpen(true)}
								>
									<TrashIcon aria-hidden size={18} strokeWidth={1.5} /> Delete project
								</MenuItem>
							</>
						) : null}
					</MenuContent>
				</Menu>
			)}
			{/* <ProjectsMoreMenuExportDialog
				projectName={projectName ?? ''}
				isOpen={isExportOpen}
				onOpenChange={setIsExportOpen}
				uuid={projectUuid ?? ''}
			/> */}
			<ProjectDeleteDialog
				isOpen={isDeleteConfirmOpen}
				onOpenChange={setIsDeleteConfirmOpen}
				projectName={props.projectName ?? ''}
				projectUuid={props.projectUuid}
			/>
		</>
	);
}
