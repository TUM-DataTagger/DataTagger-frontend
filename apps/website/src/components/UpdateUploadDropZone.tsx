'use client';

import type { DropEvent } from '@react-types/shared';
import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { useSetAtom } from 'jotai';
import { FileIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState, type ReactNode } from 'react';
import { DropZone, type DropZoneProps } from 'react-aria-components';
import { globalUploadAssistantOpenAtom } from '@/stores/globalUploadAssistant';
import { cx } from '@/styles/cva';
import { useUploadIntent } from '@/uploads/useUploadIntent';
import { $api } from '@/util/clientFetch';

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
	const [isDropZoneOpen, setIsDropZoneOpen] = useState(false);
	const setIsGlobalUploadAssistantOpen = useSetAtom(globalUploadAssistantOpenAtom);
	const { startDroppedUpdateUploads } = useUploadIntent();

	const { data: datasetData } = useSuspenseQuery(
		$api.queryOptions('get', '/api/v1/uploads-dataset/{id}/', {
			params: { path: { id: fileUuid } },
		}),
	);

	const { data: datasetVersionData } = useQuery(
		$api.queryOptions(
			'get',
			'/api/v1/uploads-version/{id}/',
			{
				params: { path: { id: datasetData.latest_version?.pk ?? '' } },
			},
			{ enabled: Boolean(datasetData.latest_version) },
		),
	);

	const onDrop = async (ev: DropEvent) => {
		if (!ev.items.length) {
			return;
		}

		await startDroppedUpdateUploads({
			items: ev.items,
			target: {
				datasetUuid: fileUuid,
				folderName,
				folderUuid,
				projectUuid,
			},
		});
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
							isDropZoneOpen ? 'visible opacity-100 duration-250 fade-in' : 'invisible opacity-0 duration-250 fade-out',
						)}
					>
						<div className="global-dropzone-border h-full w-full rounded-xl p-px" key="dropzone">
							<div className="relative h-full w-full rounded-xl bg-base-lavender-100/64 dark:bg-base-lavender-800/64">
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
										className="flex items-center gap-2 rounded-lg bg-base-lavender-600 px-6 py-5 text-base-md text-base-neutral-40 dark:bg-base-lavender-400 dark:text-base-neutral-900"
										key="global-bottom-banner-inner"
										transition={{
											delay: 0.25,
											duration: 0.75,
											repeat: Number.POSITIVE_INFINITY,
											repeatType: 'reverse',
										}}
									>
										{/* eslint-disable-next-line no-negated-condition */}
										Drop file to {!datasetVersionData?.version_file ? 'upload to' : 'update'}{' '}
										<FileIcon aria-hidden className="shrink-0" size={18} strokeWidth={1.5} />{' '}
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
