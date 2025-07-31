'use client';

import type { DropEvent } from '@react-types/shared';
import { useQueryClient } from '@tanstack/react-query';
import { useSetAtom } from 'jotai';
import { FileIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { parseAsString, useQueryState } from 'nuqs';
import { useState, type ReactNode } from 'react';
import { DropZone, type DropZoneProps } from 'react-aria-components';
import { useTus } from 'use-tus';
import { useEnv } from '@/contexts/EnvContext';
import {
	globalUploadAssistantOpenAtom,
	globalUploadAssistantTabAtom,
	uploadsQueueAtom,
} from '@/stores/globalUploadAssistant';
import { cx } from '@/styles/cva';
import { $api } from '@/util/clientFetch';
import { processDropItem } from '@/util/processDropItem';

export function UpdateUploadDropZone({
	fileName,
	fileUuid,
	folderName,
	folderUuid,
	projectUuid,
	...props
}: DropZoneProps & {
	readonly className?: string;
	readonly fileName?: string | null | undefined;
	readonly fileUuid: string;
	readonly folderName?: string | undefined;
	readonly folderUuid?: string | undefined;
	readonly projectUuid?: string | undefined;
}) {
	const env = useEnv();
	const [, setQueryState] = useQueryState('version', parseAsString);
	const [isDropZoneOpen, setIsDropZoneOpen] = useState(false);
	const setIsGlobalUploadAssistantOpen = useSetAtom(globalUploadAssistantOpenAtom);
	const setGlobalUploadAssistantTab = useSetAtom(globalUploadAssistantTabAtom);
	const setUploadsQueue = useSetAtom(uploadsQueueAtom);
	const { setUpload } = useTus({ autoStart: true, autoAbort: false });
	const queryClient = useQueryClient();

	const onDrop = async (ev: DropEvent) => {
		if (!ev.items.length) {
			return;
		}

		const processedFiles = (await Promise.all(ev.items.map(async (file) => processDropItem(file)))).flat();

		setGlobalUploadAssistantTab(folderUuid ? 'folders' : 'drafts');
		setIsGlobalUploadAssistantOpen(true);

		for (const file of processedFiles) {
			const uuid = crypto.randomUUID();
			const startTime = performance.now();

			setUpload(await file.item.getFile(), {
				endpoint: `${env.BASE_API_URL ?? ''}/api/v1/uploads-dataset/${fileUuid}/tus/`,
				removeFingerprintOnSuccess: true,
				chunkSize: 50_000_000,
				parallelUploads: 1,
				metadata: {
					filename: file.item.name,
					filetype: file.item.type,
					filepath: file.directory ?? '',
				},
				onBeforeRequest: (req) => {
					const xhr = req.getUnderlyingObject();
					xhr.withCredentials = true;
				},
				onUploadUrlAvailable() {
					setUploadsQueue((draft) => {
						draft.push({
							uuid,
							filename: file.item.name,
							datasetUuid: fileUuid,
							folderUuid,
							folderName,
							projectUuid,
							directory: file.directory,
							finished: false,
							percentComplete: 0,
							uploadSpeed: 0,
						});
					});
				},

				onProgress(bytesSent, bytesTotal) {
					const percentComplete = (bytesSent / bytesTotal) * 100;
					const currentTime = performance.now();
					// Convert to seconds
					const elapsedTime = (currentTime - startTime) / 1_000;
					// Calculate upload speed in bytes per second
					const uploadSpeed = bytesSent / elapsedTime;

					setUploadsQueue((draft) => {
						const upload = draft.find((up) => up.uuid === uuid);
						if (upload) {
							upload.percentComplete = percentComplete;
							upload.uploadSpeed = uploadSpeed;
						}
					});
				},
				async onSuccess() {
					setUploadsQueue((draft) => {
						const upload = draft.find((up) => up.uuid === uuid);
						if (upload) {
							upload.finished = true;
							upload.percentComplete = 100;
							upload.uploadSpeed = 0;
						}
					});

					await setQueryState(null);
					await queryClient.invalidateQueries({
						queryKey: $api.queryOptions('get', '/api/v1/uploads-dataset/{id}/', {
							params: { path: { id: fileUuid } },
						}).queryKey,
					});

					if (folderUuid) {
						await queryClient.invalidateQueries({
							queryKey: $api.queryOptions('get', '/api/v1/uploads-dataset/', {
								params: { query: { folder: folderUuid } },
							}).queryKey,
						});
					} else {
						await queryClient.invalidateQueries({
							queryKey: $api.queryOptions('get', '/api/v1/uploads-dataset/').queryKey,
						});
					}
				},
			});
		}
	};

	return (
		<DropZone
			{...props}
			className={cx('group', props.className)}
			onDrop={onDrop}
			onDropEnter={() => {
				setIsDropZoneOpen(true);
				setIsGlobalUploadAssistantOpen(false);
			}}
			onDropExit={() => setIsDropZoneOpen(false)}
		>
			{props.children as ReactNode}
			<AnimatePresence>
				{isDropZoneOpen ? (
					<div
						className={cx(
							'fixed inset-0 z-50 p-4 transition-all select-none',
							isDropZoneOpen ? 'fade-in visible opacity-100 duration-250' : 'fade-out invisible opacity-0 duration-250',
						)}
					>
						<div className="global-dropzone-border h-full w-full rounded-xl p-px" key="dropzone">
							<div className="bg-base-lavender-100/64 dark:bg-base-lavender-800/64 relative h-full w-full rounded-xl">
								<motion.div
									animate={{ opacity: 1, x: '-50%', y: 0 }}
									className="absolute bottom-6 left-1/2 -translate-x-1/2"
									exit={{ y: 50, opacity: 0 }}
									initial={false}
									key="global-bottom-banner-outer"
									transition={{ duration: 0.25 }}
								>
									<motion.div
										animate={{ y: [0, -10] }}
										className="bg-base-lavender-600 text-base-md text-base-neutral-40 dark:bg-base-lavender-400 dark:text-base-neutral-900 flex items-center gap-2 rounded-lg px-6 py-5"
										key="global-bottom-banner-inner"
										transition={{
											delay: 0.25,
											duration: 0.75,
											repeat: Number.POSITIVE_INFINITY,
											repeatType: 'reverse',
										}}
									>
										Drop file to update <FileIcon aria-hidden className="shrink-0" size={18} strokeWidth={1.5} />{' '}
										<span className="text-base-label-md">{fileName}</span>
									</motion.div>
								</motion.div>
							</div>
						</div>
					</div>
				) : null}
			</AnimatePresence>
		</DropZone>
	);
}
