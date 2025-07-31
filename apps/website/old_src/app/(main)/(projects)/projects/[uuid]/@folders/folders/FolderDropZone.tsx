'use client';

import { useSetAtom } from 'jotai';
import { PackageOpenIcon } from 'lucide-react';
import { useCallback, useState } from 'react';
import type { DropEvent } from 'react-aria';
import type { DropZoneProps } from 'react-aria-components';
import { maxFilesModalOpenAtom } from '@/components/dropzone/MaxFilesModal';
import { countDroppedItems, useSetPendingFiles } from '@/components/dropzone/useSetPendingFiles';
import { DropZone } from '@/components/ui/DropZone';
import { MotionDiv } from '@/components/ui/FramerMotion';
import { ToastType, globalToastQueue } from '@/components/ui/Toast';
import { droppedFilesAtom, globalUploadAssistantOpenAtom } from '@/stores/upload-assistant';
import { cn } from '@/util/cn';
import type { components } from '@/util/schema';

export const FolderDropZone = (
	props: DropZoneProps & { readonly folder: components['schemas']['FolderProjectAction'] },
) => {
	const { folder, className, children, ...additionalProps } = props;

	const [folderDropZoneOpen, setFolderDropZoneOpen] = useState(false);
	const setGlobalUploadAssistantOpen = useSetAtom(globalUploadAssistantOpenAtom);
	const setDroppedFiles = useSetAtom(droppedFilesAtom);
	const setMaxFilesModalOpen = useSetAtom(maxFilesModalOpenAtom);
	const setPendingFiles = useSetPendingFiles({ folderId: folder.pk });

	const onDrop = useCallback(
		async (ev: DropEvent) => {
			const counts = await Promise.all(ev.items.map(async (item) => countDroppedItems(item)));
			const count = counts.reduce((acc, val) => acc + val, 0);

			if (count > 500) {
				globalToastQueue.add(
					{ message: 'You can only process up to 500 files at the same time.', type: ToastType.Error },
					{ timeout: 5_000 },
				);
				return;
			}

			setDroppedFiles(ev.items);

			if (count > 25) {
				setMaxFilesModalOpen(true);
			} else {
				await setPendingFiles(ev.items);
			}
		},
		[setDroppedFiles, setMaxFilesModalOpen, setPendingFiles],
	);

	return (
		<DropZone
			{...additionalProps}
			className="relative"
			onDrop={onDrop}
			onDropEnter={() => {
				setFolderDropZoneOpen(true);
				setGlobalUploadAssistantOpen(false);
			}}
			onDropExit={() => {
				setFolderDropZoneOpen(false);
			}}
		>
			<>
				<div
					className={cn(
						'absolute inset-0 z-50 p-2 transition-all',
						folderDropZoneOpen
							? 'fade-in visible opacity-100 duration-250'
							: 'fade-out invisible opacity-0 duration-250',
					)}
				>
					<div className="global-dropzone-border h-full w-full rounded-xl p-px">
						<div className="bg-base-lavender-100/64 dark:bg-base-lavender-800/64 relative h-full w-full rounded-xl">
							<MotionDiv
								animate={{ opacity: 1, y: 0 }}
								className="absolute bottom-6 left-0 w-full px-4"
								// exit={{ y: 50, opacity: 0 }}
								// initial={{ y: 50, opacity: 0 }}
								key="bottom-banner-outer"
								transition={{ duration: 0.25 }}
							>
								<MotionDiv
									animate={{ y: [0, -10] }}
									className="bg-base-lavender-600 text-base-sm text-base-neutral-40 dark:bg-base-lavender-400 dark:text-base-neutral-900 flex flex-col place-items-center gap-2 rounded-lg px-4 py-3"
									key="bottom-banner-inner"
									transition={{
										delay: 0.25,
										duration: 0.75,
										repeat: Number.POSITIVE_INFINITY,
										repeatType: 'reverse',
									}}
								>
									<span className="text-center">Drop files to upload them to</span>
									<div className="flex place-items-center gap-1">
										<PackageOpenIcon aria-hidden size={18} strokeWidth={1.5} />
										<span className="text-base-label-sm">{folder.name}</span>
									</div>
								</MotionDiv>
							</MotionDiv>
						</div>
					</div>
				</div>
				{children}
			</>
		</DropZone>
	);
};
