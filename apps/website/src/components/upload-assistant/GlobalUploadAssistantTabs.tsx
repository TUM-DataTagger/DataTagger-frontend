'use client';

import { useAtom } from 'jotai';
import { CheckIcon } from 'lucide-react';
import { Tab, TabList, TabPanel, Tabs } from '@/components/ui/Tabs';
import { globalUploadAssistantTabAtom } from '@/stores/globalUploadAssistant';
import { GlobalUploadAssistantDraftsTab } from './GlobalUploadAssistantDraftsTab';
import { GlobalUploadAssistantFoldersTab } from './GlobalUploadAssistantFoldersTab';

export function GlobalUploadAssistantTabs() {
	const [globalUploadAssistantTab, setGlobalUploadAssistantTab] = useAtom(globalUploadAssistantTabAtom);

	return (
		<Tabs
			className="w-full gap-0"
			onSelectionChange={setGlobalUploadAssistantTab}
			selectedKey={globalUploadAssistantTab}
		>
			<TabList className="h-14 min-h-14 place-content-center gap-0" selectionIndicator={false}>
				<Tab
					className="w-full place-content-center rounded-none rounded-l-lg border border-base-neutral-300 text-base-label-md hover:bg-base-lavender-400 dark:hover:bg-base-lavender-400 dark:hover:text-base-neutral-900 pressed:bg-base-lavender-500 dark:pressed:bg-base-lavender-300 selected:bg-base-lavender-200 selected:hover:bg-base-lavender-400 dark:selected:bg-base-lavender-600 dark:selected:hover:bg-base-lavender-400 selected:pressed:bg-base-lavender-500 dark:selected:pressed:bg-base-lavender-300"
					id="drafts"
				>
					{globalUploadAssistantTab === 'drafts' ? <CheckIcon aria-hidden size={18} strokeWidth={1.5} /> : null}
					Drafts
				</Tab>
				<Tab
					className="w-full place-content-center rounded-none rounded-r-lg border border-l-0 border-base-neutral-300 text-base-label-md hover:bg-base-lavender-400 dark:hover:bg-base-lavender-400 dark:hover:text-base-neutral-900 pressed:bg-base-lavender-500 dark:pressed:bg-base-lavender-300 selected:bg-base-lavender-200 selected:hover:bg-base-lavender-400 dark:selected:bg-base-lavender-600 dark:selected:hover:bg-base-lavender-400 selected:pressed:bg-base-lavender-500 dark:selected:pressed:bg-base-lavender-300"
					id="folders"
				>
					{globalUploadAssistantTab === 'folders' ? <CheckIcon aria-hidden size={18} strokeWidth={1.5} /> : null}
					Folders
				</Tab>
			</TabList>

			<TabPanel id="drafts">
				{globalUploadAssistantTab === 'drafts' ? <GlobalUploadAssistantDraftsTab /> : null}
			</TabPanel>
			<TabPanel id="folders">
				{globalUploadAssistantTab === 'folders' ? <GlobalUploadAssistantFoldersTab /> : null}
			</TabPanel>
		</Tabs>
	);
}
