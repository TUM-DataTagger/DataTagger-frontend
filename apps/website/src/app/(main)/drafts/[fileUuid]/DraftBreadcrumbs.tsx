'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { VersionHistoryBadge } from '@/components/VersionHistory';
import { BreadcrumbItem, Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { SideSheetMode, sideSheetSelectedDatasetAtom, sideSheetModeAtom } from '@/stores/sideSheet';
import { $api } from '@/util/clientFetch';

export function DraftBreadcrumbs(props: { readonly fileUuid: string }) {
	const sideSheetMode = useAtomValue(sideSheetModeAtom);
	const sideSheetSelectedDataset = useAtomValue(sideSheetSelectedDatasetAtom);

	const isVersionHistoryModeActive = Boolean(
		sideSheetMode === SideSheetMode.VersionHistory && sideSheetSelectedDataset,
	);

	const { data: datasetData } = useSuspenseQuery(
		$api.queryOptions('get', '/api/v1/uploads-dataset/{id}/', {
			params: { path: { id: props.fileUuid } },
		}),
	);

	return isVersionHistoryModeActive ? (
		<VersionHistoryBadge fileUuid={props.fileUuid} />
	) : (
		<nav aria-label="Draft breadcrumbs">
			<Breadcrumbs separator="slash">
				<BreadcrumbItem href="/drafts">Home</BreadcrumbItem>
				<BreadcrumbItem>
					<span className="max-w-[30ch] truncate sm:max-w-prose">{datasetData.display_name ?? 'Empty dataset'}</span>
				</BreadcrumbItem>
			</Breadcrumbs>
		</nav>
	);
}
