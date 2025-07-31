'use client';

import type { DropEvent } from '@react-types/shared';
import { useAtom, useSetAtom } from 'jotai';
import { PackageOpenIcon } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useMemo } from 'react';
import type { DropZoneProps } from 'react-aria-components';
import { folderDropZoneOpenAtom } from '@/stores/global-dropzone';
import { droppedFilesAtom, globalUploadAssistantOpenAtom } from '@/stores/upload-assistant';
import { cn } from '@/util/cn';
import type { components } from '@/util/schema';
import { DropZone } from '@/components/ui/DropZone';
import { AnimatePresence, MotionDiv } from '@/components/ui/FramerMotion';
import { ToastType, globalToastQueue } from '@/components/ui/Toast';
import { maxFilesModalOpenAtom } from './MaxFilesModal';
import { countDroppedItems, useSetPendingFiles } from './useSetPendingFiles';

export const FolderDropZone = (props: DropZoneProps & { readonly folder: components['schemas']['Folder'] }) => {
	const { folder, className, children, ...additionalProps } = props;

	const pathname = usePathname();
	const isProjectFolderFilesPage = useMemo(() => pathname.endsWith('/files'), [pathname]);
	const [folderDropZoneOpen, setFolderDropZoneOpen] = useAtom(folderDropZoneOpenAtom);
	const setGlobalUploadAssistantOpen = useSetAtom(globalUploadAssistantOpenAtom);
	const setDroppedFiles = useSetAtom(droppedFilesAtom);
	const setMaxFilesModalOpen = useSetAtom(maxFilesModalOpenAtom);
	const setPendingFiles = useSetPendingFiles({ folderId: folder.pk });

	const onDrop = useCallback(
		async (ev: DropEvent) => {
			if (!isProjectFolderFilesPage) {
				return;
			}

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
		[isProjectFolderFilesPage, setDroppedFiles, setMaxFilesModalOpen, setPendingFiles],
	);

	useEffect(() => {
		const dragEnterHandler = (ev: DragEvent) => {
			if (ev.dataTransfer?.types.includes('Files') && isProjectFolderFilesPage) {
				setFolderDropZoneOpen(true);
			}
		};

		window.addEventListener('dragenter', dragEnterHandler);

		return () => {
			window.removeEventListener('dragenter', dragEnterHandler);
		};
	}, [isProjectFolderFilesPage, setFolderDropZoneOpen]);

	return (
		<DropZone
			{...additionalProps}
			className={cn(
				'fixed inset-0 z-50 p-4 transition-all',
				folderDropZoneOpen ? 'fade-in visible opacity-100 duration-250' : 'fade-out invisible opacity-0 duration-250',
				className,
			)}
			onDrop={onDrop}
			onDropEnter={() => setGlobalUploadAssistantOpen(false)}
			onDropExit={() => setFolderDropZoneOpen(false)}
		>
			<AnimatePresence>
				{folderDropZoneOpen ? (
					<div key="folder-dropzone" className="global-dropzone-border h-full w-full rounded-xl p-px">
						<div className="bg-base-lavender-100/64 dark:bg-base-lavender-800/64 relative h-full w-full rounded-xl">
							<MotionDiv
								animate={{ opacity: 1, x: '-50%', y: 0 }}
								className="absolute bottom-6 left-1/2 -translate-x-1/2"
								exit={{ y: 50, opacity: 0 }}
								initial={false}
								key="folder-bottom-banner-outer"
								transition={{ duration: 0.25 }}
							>
								<MotionDiv
									animate={{ y: [0, -10] }}
									className="bg-base-lavender-600 text-base-md text-base-neutral-40 dark:bg-base-lavender-400 dark:text-base-neutral-900 flex items-center gap-2 rounded-lg px-6 py-5"
									key="folder-bottom-banner-inner"
									transition={{
										delay: 0.25,
										duration: 0.75,
										repeat: Number.POSITIVE_INFINITY,
										repeatType: 'reverse',
									}}
								>
									Drop files to upload them to <PackageOpenIcon aria-hidden size={18} strokeWidth={1.5} />{' '}
									<span className="text-base-label-md">{folder.name}</span>
								</MotionDiv>
							</MotionDiv>
						</div>
					</div>
				) : null}
			</AnimatePresence>
		</DropZone>
	);
};
