'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { FileVersionHistoryBadge } from '@/components/FileVersionHistory';
import { BreadcrumbsItem, Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { SideSheetMode, sideSheetSelectedDatasetAtom, sideSheetModeAtom } from '@/stores/sideSheet';
import { $api } from '@/util/clientFetch';

export function DraftBreadcrumbs(props: { readonly fileUuid: string }) {
	const sideSheetMode = useAtomValue(sideSheetModeAtom);
	const sideSheetSelectedDataset = useAtomValue(sideSheetSelectedDatasetAtom);

	const isVersionHistoryModeActive = Boolean(
		sideSheetMode === SideSheetMode.FileVersionHistory && sideSheetSelectedDataset,
	);

	const { data: datasetData } = useSuspenseQuery(
		$api.queryOptions('get', '/api/v1/uploads-dataset/{id}/', {
			params: { path: { id: props.fileUuid } },
		}),
	);

	return isVersionHistoryModeActive ? (
		<FileVersionHistoryBadge fileUuid={props.fileUuid} />
	) : (
		<nav aria-label="Draft breadcrumbs">
			<Breadcrumbs separator="slash">
				<BreadcrumbsItem href="/">Home</BreadcrumbsItem>
				<BreadcrumbsItem>
					<span className="max-w-[30ch] truncate sm:max-w-prose" title={datasetData.display_name ?? 'Empty dataset'}>
						{datasetData.display_name ?? 'Empty dataset'}
					</span>
				</BreadcrumbsItem>
			</Breadcrumbs>
		</nav>
	);
}
