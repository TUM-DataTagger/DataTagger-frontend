'use client';

import { CheckIcon } from 'lucide-react';
import { useState } from 'react';
import type { PropsWithChildren } from 'react';
import { Tab, TabList, TabPanel, Tabs } from '@/components/ui/Tabs';

export function AccessibilityTabs(
	props: PropsWithChildren<{
		readonly textDE: string;
		readonly textEN: string;
	}>,
) {
	const [accessibilityTab, setAccessibilityTab] = useState('english');

	return (
		<Tabs
			className="gap-0"
			onSelectionChange={(key) => setAccessibilityTab(String(key))}
			selectedKey={accessibilityTab}
		>
			<TabList className="h-8 place-content-center gap-0 border-0">
				<Tab
					className="border-base-neutral-300 selected:bg-base-lavender-200 text-base-label-md hover:bg-base-lavender-400 dark:hover:text-base-neutral-900 pressed:bg-base-lavender-500 selected:hover:bg-base-lavender-400 selected:pressed:bg-base-lavender-500 dark:selected:bg-base-lavender-600 dark:hover:bg-base-lavender-400 dark:pressed:bg-base-lavender-300 dark:selected:hover:bg-base-lavender-400 dark:selected:pressed:bg-base-lavender-300 w-full place-content-center rounded-none rounded-l-lg border"
					hasIndicator={false}
					id="english"
				>
					{accessibilityTab === 'english' ? <CheckIcon aria-hidden size={18} strokeWidth={1.5} /> : null}
					English (EN)
				</Tab>
				<Tab
					className="border-base-neutral-300 selected:bg-base-lavender-200 text-base-label-md hover:bg-base-lavender-400 dark:hover:text-base-neutral-900 pressed:bg-base-lavender-500 selected:hover:bg-base-lavender-400 selected:pressed:bg-base-lavender-500 dark:selected:bg-base-lavender-600 dark:hover:bg-base-lavender-400 dark:pressed:bg-base-lavender-300 dark:selected:hover:bg-base-lavender-400 dark:selected:pressed:bg-base-lavender-300 w-full place-content-center rounded-none rounded-r-lg border border-l-0"
					hasIndicator={false}
					id="german"
				>
					{accessibilityTab === 'german' ? <CheckIcon aria-hidden size={18} strokeWidth={1.5} /> : null}
					German (DE)
				</Tab>
			</TabList>

			<TabPanel id="english">
				{/* eslint-disable-next-line react/no-danger */}
				<div className="pt-8 [&_br]:hidden" dangerouslySetInnerHTML={{ __html: props.textEN }} />
			</TabPanel>
			<TabPanel id="german">
				{/* eslint-disable-next-line react/no-danger */}
				<div className="pt-8 [&_br]:hidden" dangerouslySetInnerHTML={{ __html: props.textDE }} />
			</TabPanel>
		</Tabs>
	);
}
