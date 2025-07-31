'use client';

import { FileDownIcon, /* FolderArchiveIcon, */ MoreVerticalIcon, Share2Icon, SplitIcon } from 'lucide-react';
import Link from 'next/link';
import { useCopyToClipboard, useMediaQuery } from 'usehooks-ts';
import { Drawer, DrawerBody, DrawerClose, DrawerContent, DrawerTrigger } from '@/components/ui/Drawer';
import { dropdownItemStyles } from '@/components/ui/Dropdown';
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from '@/components/ui/Menu';
import { Separator } from '@/components/ui/Separator';
import { globalToastQueue, ToastType } from '@/components/ui/Toast';
import { useEnv } from '@/contexts/EnvContext';
import { cx } from '@/styles/cva';
// import { ProjectFolderFilesMoreMenuExportDialog } from './ProjectFolderFilesMoreMenuExportDialog';

export function ProjectFolderFilesMoreMenu({
	projectUuid,
	folderUuid,
	fileUuid,
	versionUuid,
	// filename,
	...props
}: {
	readonly className?: string;
	readonly fileUuid: string;
	// readonly filename: string | null | undefined;
	readonly folderUuid: string;
	readonly projectUuid: string;
	readonly versionUuid: string | undefined;
}) {
	const isMobile = useMediaQuery('(max-width: 600px)', { initializeWithValue: false });
	const env = useEnv();
	// const [isExportOpen, setIsExportOpen] = useState(false);
	const [_, copy] = useCopyToClipboard();

	const copyToClipboard = async () => {
		await copy(`${window.location.href}/${fileUuid}`);
		globalToastQueue.add(
			{ message: 'Link has been copied to clipboard.', type: ToastType.TextOnly },
			{ timeout: 2_500 },
		);
	};

	return (
		<>
			{isMobile ? (
				<div>
					<Drawer withNotch={false}>
						<DrawerTrigger aria-label="More menu" size="icon" variant="discreet">
							<MoreVerticalIcon aria-hidden size={24} strokeWidth={1.5} />
						</DrawerTrigger>
						<DrawerContent aria-label="More menu">
							<DrawerBody>
								<Link
									aria-label="Open in new tab"
									className={dropdownItemStyles({ className: 'text-base-sm flex gap-2' })}
									href={`/projects/${projectUuid}/folders/${folderUuid}/files/${fileUuid}`}
									target="_blank"
								>
									<SplitIcon aria-hidden size={18} strokeWidth={1.5} /> Open in new tab
								</Link>
								<DrawerClose
									aria-label="Share detail link"
									className={dropdownItemStyles({ className: 'text-base-sm flex place-content-start gap-2' })}
									onPress={async () => {
										await navigator.clipboard.writeText(`${window.location.href}/files/${fileUuid}`);
									}}
									variant="unset"
								>
									<Share2Icon aria-hidden size={18} strokeWidth={1.5} /> Share detail link
								</DrawerClose>
								<Separator />
								<a
									className={dropdownItemStyles({ className: 'text-base-sm flex gap-2' })}
									href={`${env.BASE_API_URL}/api/v1/uploads-version/${versionUuid}/download/?as_attachment=true`}
									rel="noreferrer noopener external"
									target="_blank"
								>
									<FileDownIcon aria-hidden size={18} strokeWidth={1.5} /> Download
								</a>
								{/* <DrawerClose
								aria-label="Export (zip)"
								className={dropdownItemStyles({ className: 'text-base-sm flex place-content-start gap-2' })}
								id="export"
								onPress={() => setIsExportOpen(true)}
								variant="unstyled"
							>
								<FolderArchiveIcon aria-hidden size={18} strokeWidth={1.5} /> Export (zip)
							</DrawerClose> */}
							</DrawerBody>
						</DrawerContent>
					</Drawer>
				</div>
			) : (
				<Menu>
					<MenuTrigger
						aria-label="More menu"
						className={cx(
							'pressed:outline-2 pressed:outline-offset-2 pressed:outline-base-lavender-400 dark:pressed:outline-base-lavender-600 hidden md:flex',
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
							href={`/projects/${projectUuid}/folders/${folderUuid}/files/${fileUuid}`}
							target="_blank"
						>
							<SplitIcon aria-hidden size={18} strokeWidth={1.5} /> Open in new tab
						</MenuItem>
						<MenuItem aria-label="Share detail link" id="share" onAction={copyToClipboard}>
							<Share2Icon aria-hidden size={18} strokeWidth={1.5} /> Share detail link
						</MenuItem>
						<MenuSeparator />
						<MenuItem
							href={`${env.BASE_API_URL}/api/v1/uploads-version/${versionUuid}/download/?as_attachment=true`}
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
			)}
			{/* <ProjectFolderFilesMoreMenuExportDialog
				filename={filename ?? ''}
				isOpen={isExportOpen}
				onOpenChange={setIsExportOpen}
				versionUuid={versionUuid ?? ''}
			/> */}
		</>
	);
}
