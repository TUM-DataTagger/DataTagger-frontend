'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { MetadataTemplateVersionHistoryBadge } from '@/components/metadata-template/MetadataTemplateVersionHistory';
import { BreadcrumbsItem, Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { SideSheetMode, sideSheetModeAtom, sideSheetSelectedMetadataTemplateContainerAtom } from '@/stores/sideSheet';
import { $api } from '@/util/clientFetch';

export function MetadataTemplateContainerBreadcrumbs(props: { readonly metadataTemplateContainerUuid: string }) {
	const sideSheetMode = useAtomValue(sideSheetModeAtom);
	const sideSheetSelectedMetadataTemplateContainer = useAtomValue(sideSheetSelectedMetadataTemplateContainerAtom);

	const isVersionHistoryModeActive = Boolean(
		sideSheetMode === SideSheetMode.MetadataTemplateVersionHistory && sideSheetSelectedMetadataTemplateContainer,
	);

	const { data: metadataTemplateData } = useSuspenseQuery(
		$api.queryOptions('get', '/api/v1/metadata-template-container/{id}/', {
			params: { path: { id: props.metadataTemplateContainerUuid } },
		}),
	);

	return isVersionHistoryModeActive ? (
		<MetadataTemplateVersionHistoryBadge metadataTemplateContainerUuid={props.metadataTemplateContainerUuid} />
	) : (
		<nav aria-label="Metadata template breadcrumbs">
			<Breadcrumbs separator="slash">
				<BreadcrumbsItem href="/">Home</BreadcrumbsItem>
				<BreadcrumbsItem>
					<span className="max-w-[30ch] truncate sm:max-w-prose" title={metadataTemplateData.name}>
						{metadataTemplateData.name}
					</span>
				</BreadcrumbsItem>
			</Breadcrumbs>
		</nav>
	);
}
