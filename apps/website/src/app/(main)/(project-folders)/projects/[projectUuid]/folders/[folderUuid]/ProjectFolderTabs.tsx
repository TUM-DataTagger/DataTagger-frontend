'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { usePathname } from 'next/navigation';
import type { PropsWithChildren } from 'react';
import { useEffect, useState, useTransition } from 'react';
import type { Key } from 'react-aria-components';
import { Tabs, Tab, TabList } from '@/components/ui/Tabs';
import { $api } from '@/util/clientFetch';

export function ProjectFolderTabs(
	props: PropsWithChildren<{
		readonly folderUuid: string;
		readonly projectUuid: string;
	}>,
) {
	const pathname = usePathname();
	const [tab, setTab] = useState<Key>(pathname.split('/')[5] ?? 'files');
	const [_, startTransition] = useTransition();

	const { data: folderData } = useSuspenseQuery(
		$api.queryOptions('get', '/api/v1/folder/{id}/', {
			params: { path: { id: props.folderUuid } },
		}),
	);

	useEffect(() => {
		startTransition(() => {
			switch (pathname.split('/')[5]!) {
				case 'permissions':
					setTab('permissions');
					break;
				case 'metadata-templates':
					setTab('metadata-templates');
					break;
				default:
					setTab('files');
					break;
			}
		});
	}, [pathname]);

	return (
		<Tabs className="gap-0" selectedKey={tab}>
			<TabList className="mx-auto md:max-w-[856px]">
				<Tab href={`/projects/${props.projectUuid}/folders/${props.folderUuid}/files`} id="files">
					Files
					<span className="flex h-4 min-w-3.5 place-content-center place-items-center rounded-2xl bg-base-neutral-700 px-1 text-base-label-xs text-base-neutral-40 tabular-nums dark:bg-base-neutral-200 dark:text-base-neutral-900">
						{folderData.datasets_count}
					</span>
				</Tab>
				<Tab href={`/projects/${props.projectUuid}/folders/${props.folderUuid}/permissions`} id="permissions">
					Permissions
					<span className="flex h-4 min-w-3.5 place-content-center place-items-center rounded-2xl bg-base-neutral-700 px-1 text-base-label-xs text-base-neutral-40 tabular-nums dark:bg-base-neutral-200 dark:text-base-neutral-900">
						{folderData.members_count}
					</span>
				</Tab>
				<Tab
					href={`/projects/${props.projectUuid}/folders/${props.folderUuid}/metadata-templates`}
					id="metadata-templates"
				>
					Metadata templates
				</Tab>
			</TabList>
			{props.children}
		</Tabs>
	);
}
