'use client';

import { CheckIcon } from 'lucide-react';
import { useState } from 'react';
import { Tab, TabList, TabPanel, Tabs } from '@/components/ui/Tabs';

type LocalizedCmsTabsProps = {
	readonly textDE: string;
	readonly textEN: string;
};

export function LocalizedCmsTabs({ textDE, textEN }: LocalizedCmsTabsProps) {
	const [selectedTab, setSelectedTab] = useState('english');

	return (
		<Tabs className="gap-0" onSelectionChange={(key) => setSelectedTab(String(key))} selectedKey={selectedTab}>
			<TabList className="h-8 place-content-center gap-0 border-0" selectionIndicator={false}>
				<Tab
					className="w-full place-content-center rounded-none rounded-l-lg border border-base-neutral-300 text-base-label-md hover:bg-base-lavender-400 dark:hover:bg-base-lavender-400 dark:hover:text-base-neutral-900 pressed:bg-base-lavender-500 dark:pressed:bg-base-lavender-300 selected:bg-base-lavender-200 selected:hover:bg-base-lavender-400 dark:selected:bg-base-lavender-600 dark:selected:hover:bg-base-lavender-400 selected:pressed:bg-base-lavender-500 dark:selected:pressed:bg-base-lavender-300"
					id="english"
				>
					{selectedTab === 'english' ? <CheckIcon aria-hidden size={18} strokeWidth={1.5} /> : null}
					English (EN)
				</Tab>
				<Tab
					className="w-full place-content-center rounded-none rounded-r-lg border border-l-0 border-base-neutral-300 text-base-label-md hover:bg-base-lavender-400 dark:hover:bg-base-lavender-400 dark:hover:text-base-neutral-900 pressed:bg-base-lavender-500 dark:pressed:bg-base-lavender-300 selected:bg-base-lavender-200 selected:hover:bg-base-lavender-400 dark:selected:bg-base-lavender-600 dark:selected:hover:bg-base-lavender-400 selected:pressed:bg-base-lavender-500 dark:selected:pressed:bg-base-lavender-300"
					id="german"
				>
					{selectedTab === 'german' ? <CheckIcon aria-hidden size={18} strokeWidth={1.5} /> : null}
					German (DE)
				</Tab>
			</TabList>

			<TabPanel id="english">
				{/* eslint-disable-next-line react/no-danger */}
				<div className="pt-8 [&_br]:hidden" dangerouslySetInnerHTML={{ __html: textEN }} />
			</TabPanel>
			<TabPanel id="german">
				{/* eslint-disable-next-line react/no-danger */}
				<div className="pt-8 [&_br]:hidden" dangerouslySetInnerHTML={{ __html: textDE }} />
			</TabPanel>
		</Tabs>
	);
}
