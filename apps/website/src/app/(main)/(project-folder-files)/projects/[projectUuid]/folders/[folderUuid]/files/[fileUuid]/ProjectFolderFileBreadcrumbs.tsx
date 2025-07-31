'use client';

import { useSuspenseQueries } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { EllipsisIcon } from 'lucide-react';
import { VersionHistoryBadge } from '@/components/VersionHistory';
import { BreadcrumbItem, Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Menu, MenuContent, MenuItem, MenuTrigger } from '@/components/ui/Menu';
import { sideSheetSelectedDatasetAtom, sideSheetModeAtom, SideSheetMode } from '@/stores/sideSheet';
import { linkStyles } from '@/styles/ui/link';
import { $api } from '@/util/clientFetch';

export function ProjectFolderFileBreadcrumbs(props: { readonly fileUuid: string; readonly folderUuid: string }) {
	const sideSheetMode = useAtomValue(sideSheetModeAtom);
	const sideSheetSelectedDataset = useAtomValue(sideSheetSelectedDatasetAtom);

	const [folderData, datasetData] = useSuspenseQueries({
		queries: [
			$api.queryOptions('get', '/api/v1/folder/{id}/', {
				params: { path: { id: props.folderUuid } },
			}),
			$api.queryOptions('get', '/api/v1/uploads-dataset/{id}/', {
				params: { path: { id: props.fileUuid } },
			}),
		],
	});

	const isVersionHistoryModeActive = Boolean(
		sideSheetMode === SideSheetMode.VersionHistory && sideSheetSelectedDataset,
	);

	return isVersionHistoryModeActive ? (
		<VersionHistoryBadge fileUuid={props.fileUuid} />
	) : (
		<nav aria-label="File breadcrumbs">
			<Breadcrumbs separator="slash">
				<BreadcrumbItem href="/drafts">Home</BreadcrumbItem>
				<BreadcrumbItem className="print:hidden">
					<Menu respectScreen={false}>
						<MenuTrigger
							aria-label="More"
							className="text-base-neutral-900 dark:text-base-neutral-40"
							size="icon-xs"
							variant="unset"
						>
							<EllipsisIcon aria-hidden size={18} strokeWidth={1.5} />
						</MenuTrigger>
						<MenuContent placement="bottom">
							<MenuItem
								className={linkStyles({ variant: 'breadcrumb', className: 'text-base-xs h-8' })}
								href={`/projects/${folderData.data.project.pk}`}
							>
								{folderData.data.project.name}
							</MenuItem>
							<MenuItem
								className={linkStyles({ variant: 'breadcrumb', className: 'text-base-xs h-8' })}
								href={`/projects/${folderData.data.project.pk}/folders/${folderData.data.pk}`}
							>
								{folderData.data.name}
							</MenuItem>
						</MenuContent>
					</Menu>
				</BreadcrumbItem>
				<BreadcrumbItem className="hidden print:flex">{folderData.data.project.name}</BreadcrumbItem>
				<BreadcrumbItem className="hidden print:flex">{folderData.data.name}</BreadcrumbItem>
				<BreadcrumbItem>
					<span className="max-w-[30ch] truncate sm:max-w-prose">
						{datasetData.data.display_name ?? 'Empty dataset'}
					</span>
				</BreadcrumbItem>
			</Breadcrumbs>
		</nav>
	);
}
