'use client';

import { useAtom, useAtomValue } from 'jotai';
import { ChevronDownIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import dynamic from 'next/dynamic';
import { useState, useLayoutEffect } from 'react';
import { useMediaQuery } from 'usehooks-ts';
import { Button } from '@/components/ui/Button';
import { useSidebar } from '@/components/ui/Sidebar';
import { globalUploadAssistantOpenAtom, uploadsQueueLengthAtom } from '@/stores/globalUploadAssistant';
import { cx } from '@/styles/cva';
import { GlobalUploadAssistantTabs } from './GlobalUploadAssistantTabs';

export function GlobalUploadAssistant() {
	const isMobile = useMediaQuery('(max-width: 600px)', { initializeWithValue: false });
	const [isGlobalUploadAssistantOpen, setIsGlobalUploadAssistantOpen] = useAtom(globalUploadAssistantOpenAtom);
	const { open: isSidebarOpen } = useSidebar();
	const uploadsQueueLength = useAtomValue(uploadsQueueLengthAtom);
	const [needsScrollbarGutter, setNeedsScrollbarGutter] = useState(false);

	useLayoutEffect(() => {
		if (isMobile) {
			return;
		}

		const scrollbarVisible = (element: HTMLElement) => element.scrollHeight > element.clientHeight;

		const observer = new MutationObserver((mutations) => {
			if (mutations[0]?.type === 'attributes' && scrollbarVisible(document.documentElement) && isSidebarOpen) {
				if (getComputedStyle(document.documentElement).paddingRight === '0px') {
					setNeedsScrollbarGutter(false);
				} else {
					setNeedsScrollbarGutter(true);
				}
			} else {
				setNeedsScrollbarGutter(false);
			}
		});

		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ['style'],
		});

		return () => {
			observer.disconnect();
		};
	}, [isMobile, isSidebarOpen]);

	return (
		<motion.div
			animate={
				isGlobalUploadAssistantOpen
					? isMobile
						? { height: '100%', width: '100%' }
						: { height: 'auto', width: '396px' }
					: { height: '48px', width: '192px' }
			}
			className={cx(
				'fixed right-0 bottom-0 z-30 flex flex-col md:right-6 lg:right-32 print:hidden',
				isSidebarOpen && 'lg:right-102',
				isGlobalUploadAssistantOpen && 'shadow-base-md',
				isSidebarOpen && needsScrollbarGutter && 'lg:right-[calc(25.5rem+11px)]',
			)}
			initial={false}
		>
			<Button
				className={cx(
					'flex h-12 place-content-between items-center rounded-none rounded-tl-2xl bg-base-neutral-800 p-4 text-base-label-md text-base-neutral-40 focus-visible:z-10 md:rounded-tr-sm dark:bg-base-neutral-100 dark:text-base-neutral-900',
					isGlobalUploadAssistantOpen && isMobile ? 'rounded-none' : '',
				)}
				onPress={() => setIsGlobalUploadAssistantOpen((prev) => !prev)}
				variant="unset"
			>
				{uploadsQueueLength
					? `Uploading ${uploadsQueueLength} ${uploadsQueueLength === 1 ? 'file' : 'files'} ...`
					: 'Uploads'}
				{isGlobalUploadAssistantOpen ? <ChevronDownIcon aria-hidden size={24} strokeWidth={1.5} /> : null}
			</Button>
			<AnimatePresence>
				{isGlobalUploadAssistantOpen && (
					<div
						className={cx(
							'flex h-full max-h-[calc(100vh-3rem)] border border-t-0 border-base-neutral-200 bg-base-neutral-0 md:h-[540px] dark:border-base-neutral-600 dark:bg-base-neutral-800',
							// !isGlobalUploadAssistantOpen && '[@-moz-document_url-prefix()]:hidden',
						)}
					>
						<GlobalUploadAssistantTabs />
					</div>
				)}
			</AnimatePresence>
		</motion.div>
	);
}

export const GlobalUploadAssistantNoSSR = dynamic(async () => GlobalUploadAssistant, { ssr: false });
