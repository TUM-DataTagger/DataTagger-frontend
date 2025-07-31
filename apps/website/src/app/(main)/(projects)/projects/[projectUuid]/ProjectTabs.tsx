'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { usePathname } from 'next/navigation';
import type { PropsWithChildren } from 'react';
import { useEffect, useState, useTransition } from 'react';
import type { Key } from 'react-aria-components';
import { Tabs, Tab, TabList } from '@/components/ui/Tabs';
import { $api } from '@/util/clientFetch';

export function ProjectTabs(
	props: PropsWithChildren<{
		readonly projectUuid: string;
	}>,
) {
	const pathname = usePathname();
	const [tab, setTab] = useState<Key>(pathname.split('/')[3] ?? 'folders');
	const [, startTransition] = useTransition();

	const { data: projectData } = useSuspenseQuery(
		$api.queryOptions('get', '/api/v1/project/{id}/', {
			params: { path: { id: props.projectUuid } },
		}),
	);

	useEffect(() => {
		startTransition(() => {
			switch (pathname.split('/')[3]!) {
				case 'details':
					setTab('details');
					break;
				case 'members':
					setTab('members');
					break;
				case 'metadata-templates':
					setTab('metadata-templates');
					break;
				default:
					setTab('folders');
					break;
			}
		});
	}, [pathname]);

	return (
		<Tabs className="gap-0" selectedKey={tab}>
			<TabList className="mx-auto md:max-w-[852px]">
				<Tab href={`/projects/${props.projectUuid}/folders`} id="folders">
					Folders
					<span className="bg-base-neutral-700 text-base-label-xs text-base-neutral-40 dark:bg-base-neutral-200 dark:text-base-neutral-900 flex h-4 w-3.5 place-content-center place-items-center rounded-2xl tabular-nums">
						{projectData.folders_count}
					</span>
				</Tab>
				<Tab href={`/projects/${props.projectUuid}/members`} id="members">
					Members
					<span className="bg-base-neutral-700 text-base-label-xs text-base-neutral-40 dark:bg-base-neutral-200 dark:text-base-neutral-900 flex h-4 w-3.5 place-content-center place-items-center rounded-2xl tabular-nums">
						{projectData.members_count}
					</span>
				</Tab>
				<Tab href={`/projects/${props.projectUuid}/metadata-templates`} id="metadata-templates">
					Metadata templates
				</Tab>
				<Tab href={`/projects/${props.projectUuid}/details`} id="details">
					Details
				</Tab>
			</TabList>
			{props.children}
		</Tabs>
	);
}
