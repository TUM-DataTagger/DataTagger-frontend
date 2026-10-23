'use client';

import {
	FileDownIcon,
	FolderArchiveIcon,
	FolderInputIcon,
	MoreVerticalIcon,
	Share2Icon,
	SplitIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useCopyToClipboard, useMediaQuery } from 'usehooks-ts';
import { ExportJobDialog } from '@/components/ExportJobDialog';
import { FileDownloadDialog } from '@/components/File';
import { Drawer, DrawerBody, DrawerClose, DrawerContent, DrawerTrigger } from '@/components/ui/Drawer';
import { dropdownItemStyles } from '@/components/ui/Dropdown';
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from '@/components/ui/Menu';
import { Separator } from '@/components/ui/Separator';
import { globalToastQueue, ToastType } from '@/components/ui/Toast';
import { cx } from '@/styles/cva';
import { EXPORT_TYPES } from '@/util/exportJobs';
import { MoveToSubfolderDialog } from './ProjectFolderSubfolders';

export function ProjectFolderFilesMoreMenu({
	canMove = false,
	projectUuid,
	folderUuid,
	fileUuid,
	versionUuid,
	filename,
	...props
}: {
	readonly canMove?: boolean;
	readonly className?: string;
	readonly fileUuid: string;
	readonly filename?: string | null | undefined;
	readonly folderUuid: string;
	readonly projectUuid: string;
	readonly versionUuid: string | undefined;
}) {
	const isMobile = useMediaQuery('(max-width: 600px)', { initializeWithValue: false });
	const [isExportOpen, setIsExportOpen] = useState(false);
	const [isDownloadOpen, setIsDownloadOpen] = useState(false);
	const [isMoveOpen, setIsMoveOpen] = useState(false);
	const [_, copy] = useCopyToClipboard();

	const copyToClipboard = async () => {
		await copy(`${window.location.href}/${fileUuid}`);
		globalToastQueue.add(
			{ message: 'Link has been copied to clipboard.', type: ToastType.TextOnly },
			{ timeout: 2_500 },
		);
	};

	const handleOpenDownload = () => {
		if (!versionUuid) {
			return;
		}

		setIsDownloadOpen(true);
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
									id="share"
									onPress={async () => {
										await navigator.clipboard.writeText(`${window.location.href}/files/${fileUuid}`);
									}}
									variant="unset"
								>
									<Share2Icon aria-hidden size={18} strokeWidth={1.5} /> Share detail link
								</DrawerClose>
								<Separator />
								<DrawerClose
									aria-label="Download"
									className={dropdownItemStyles({ className: 'text-base-sm flex place-content-start gap-2' })}
									id="download"
									onPress={handleOpenDownload}
									variant="unset"
								>
									<FileDownIcon aria-hidden size={18} strokeWidth={1.5} /> Download
								</DrawerClose>
								<DrawerClose
									aria-label="Export (zip)"
									className={dropdownItemStyles({ className: 'text-base-sm flex place-content-start gap-2' })}
									id="export"
									onPress={() => setIsExportOpen(true)}
									variant="unset"
								>
									<FolderArchiveIcon aria-hidden size={18} strokeWidth={1.5} /> Export
								</DrawerClose>
								{canMove ? (
									<DrawerClose
										aria-label="Move to subfolder"
										className={dropdownItemStyles({ className: 'text-base-sm flex place-content-start gap-2' })}
										id="move"
										onPress={() => setIsMoveOpen(true)}
										variant="unset"
									>
										<FolderInputIcon aria-hidden size={18} strokeWidth={1.5} /> Move to subfolder
									</DrawerClose>
								) : null}
							</DrawerBody>
						</DrawerContent>
					</Drawer>
				</div>
			) : (
				<Menu>
					<MenuTrigger
						aria-label="More menu"
						className={cx(
							'hidden md:flex pressed:outline-2 pressed:outline-offset-2 pressed:outline-base-lavender-400 dark:pressed:outline-base-lavender-600',
							props.className,
						)}
						size="icon-sm"
						variant="discreet"
					>
						<MoreVerticalIcon aria-hidden size={18} strokeWidth={1.5} />
					</MenuTrigger>
					<MenuContent placement="bottom" popover={{ arrow: false }}>
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
						<MenuItem aria-label="Download" id="download" onAction={handleOpenDownload}>
							<FileDownIcon aria-hidden size={18} strokeWidth={1.5} /> Download
						</MenuItem>
						<MenuItem aria-label="Export (zip)" id="export" onAction={async () => setIsExportOpen(true)}>
							<FolderArchiveIcon aria-hidden size={18} strokeWidth={1.5} /> Export
						</MenuItem>
						{canMove ? (
							<MenuItem aria-label="Move to subfolder" id="move" onAction={() => setIsMoveOpen(true)}>
								<FolderInputIcon aria-hidden size={18} strokeWidth={1.5} /> Move to subfolder
							</MenuItem>
						) : null}
					</MenuContent>
				</Menu>
			)}
			<ExportJobDialog
				description={
					<>
						Export available data from <span className="text-base-label-md">{filename ?? 'this dataset'}</span> to a zip
						file.
					</>
				}
				exportType={EXPORT_TYPES.UploadsDataset}
				isOpen={isExportOpen}
				onOpenChange={setIsExportOpen}
				title="Export dataset"
				uuids={[fileUuid]}
			/>
			{isMoveOpen ? (
				<MoveToSubfolderDialog
					folderUuid={folderUuid}
					isOpen={isMoveOpen}
					onOpenChange={setIsMoveOpen}
					target={{ kind: 'file', fileUuid, filename: filename ?? 'file' }}
				/>
			) : null}
			<FileDownloadDialog
				filename={filename ?? 'file'}
				isOpen={isDownloadOpen}
				onOpenChange={setIsDownloadOpen}
				versionUuid={versionUuid ?? ''}
			/>
		</>
	);
}
