'use client';

import type { DropEvent } from '@react-types/shared';
import { useAtom, useSetAtom } from 'jotai';
import { PackageOpenIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { DropZone, type DropZoneProps } from 'react-aria-components';
import { globalDropZoneOpenAtom } from '@/stores/globalDropZone';
import { globalUploadAssistantOpenAtom } from '@/stores/globalUploadAssistant';
import { cx } from '@/styles/cva';
import { useUploadIntent } from '@/uploads/useUploadIntent';

export function GlobalDropZone(props: DropZoneProps & { readonly className?: string }) {
	const pathname = usePathname();
	const isDraftsPage = pathname.endsWith('/drafts');
	const [isGlobalDropZoneOpen, setIsGlobalDropZoneOpen] = useAtom(globalDropZoneOpenAtom);
	const setIsGlobalUploadAssistantOpen = useSetAtom(globalUploadAssistantOpenAtom);
	const { startDroppedCreateUploads } = useUploadIntent();

	const onDrop = async (ev: DropEvent) => {
		if (!isDraftsPage) {
			return;
		}

		if (!ev.items.length) {
			return;
		}

		await startDroppedCreateUploads({
			destination: { kind: 'draft' },
			items: ev.items,
		});
	};

	useEffect(() => {
		const dragEnterHandler = (ev: DragEvent) => {
			if (ev.dataTransfer?.types.includes('Files') && isDraftsPage) {
				setIsGlobalDropZoneOpen(true);
			}
		};

		window.addEventListener('dragenter', dragEnterHandler);

		return () => {
			window.removeEventListener('dragenter', dragEnterHandler);
		};
	}, [isDraftsPage, setIsGlobalDropZoneOpen]);

	return (
		<DropZone
			{...props}
			className={cx(
				'fixed inset-0 z-50 p-4 transition-all',
				isGlobalDropZoneOpen ? 'visible opacity-100 duration-250 fade-in' : 'invisible opacity-0 duration-250 fade-out',
				props.className,
			)}
			onDrop={onDrop}
			onDropEnter={() => setIsGlobalUploadAssistantOpen(false)}
			onDropExit={() => setIsGlobalDropZoneOpen(false)}
		>
			<AnimatePresence>
				{isGlobalDropZoneOpen ? (
					<div className="global-dropzone-border h-full w-full rounded-xl p-px" key="global-dropzone">
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
									Drop files to upload them to{' '}
									<PackageOpenIcon aria-hidden className="shrink-0" size={18} strokeWidth={1.5} />{' '}
									<span className="text-base-label-md">My draft files</span>
								</motion.div>
							</motion.div>
						</div>
					</div>
				) : null}
			</AnimatePresence>
		</DropZone>
	);
}
