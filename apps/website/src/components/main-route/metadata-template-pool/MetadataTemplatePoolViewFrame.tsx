'use client';

import { keepPreviousData, useSuspenseQuery } from '@tanstack/react-query';
import { HelpCircleIcon } from 'lucide-react';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import type { ReactNode } from 'react';
import { useMediaQuery } from 'usehooks-ts';
import { ShareButton } from '@/components/ShareButton';
import { MainRouteListFrame } from '@/components/main-route/frame/MainRouteListFrame';
import {
	EditTemplateContainersToolbar,
	UpdateMetadataTemplateButton,
} from '@/components/metadata-template/EditTemplateContainersToolbar';
import { MetadataTemplateImportButton } from '@/components/metadata-template/MetadataTemplateImportDialog';
import { ViewSwitch } from '@/components/query-controls/ViewSwitch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/Tooltip';
import { useUserSettings } from '@/hooks/useUserSettings';
import { $api } from '@/util/clientFetch';
import type { components } from '@/util/openapiSchema';
import { getEffectiveListLimit } from '@/util/paginationLimits';
import type { MetadataTemplatePoolScope } from './MetadataTemplatePoolScope';
import { useMetadataTemplatePoolAccess } from './useMetadataTemplatePoolAccess';

type MetadataTemplateContainer = components['schemas']['MetadataTemplateContainer'];

type MetadataTemplatePoolViewFrameProps = {
	readonly limit: number;
	renderEmpty(): ReactNode;
	renderGrid(data: readonly MetadataTemplateContainer[]): ReactNode;
	renderTable(data: readonly MetadataTemplateContainer[]): ReactNode;
	readonly scope: MetadataTemplatePoolScope;
};

export function MetadataTemplatePoolViewFrame(props: MetadataTemplatePoolViewFrameProps) {
	const { access, isProjectOrFolderAdmin } = useMetadataTemplatePoolAccess(props.scope);
	const { settings } = useUserSettings();

	const [queryStates] = useQueryStates({
		page: parseAsInteger.withDefault(1),
		sort: parseAsString.withDefault('name'),
		view: parseAsString.withDefault(settings.defaultViewMode ?? 'grid'),
	});
	const isMobile = useMediaQuery('(max-width: 600px)', { initializeWithValue: false });
	const isGridLayout = queryStates.view === 'grid' || isMobile;
	const effectiveLimit = getEffectiveListLimit({ hasLeadingActionItem: true, isGridLayout });
	const offset = (queryStates.page - 1) * effectiveLimit;

	const poolPath =
		props.scope.kind === 'folder'
			? '/api/v1/folder/{id}/metadata-template-container-pool/'
			: '/api/v1/project/{id}/metadata-template-container-pool/';
	const poolId = props.scope.kind === 'folder' ? props.scope.folderUuid : props.scope.projectUuid;

	const metadataTemplateContainerPoolData = useSuspenseQuery(
		$api.queryOptions(
			'get',
			poolPath,
			{
				params: { path: { id: poolId } },
			},
			{
				placeholderData: keepPreviousData,
			},
		),
	);

	const allData = metadataTemplateContainerPoolData.data;
	const paginatedData = allData.slice(offset, offset + effectiveLimit);
	const totalCount = allData.length;
	const hasResults = paginatedData.length > 0;

	return (
		<MainRouteListFrame
			controls={
				<>
					<div className="flex place-content-between place-items-center">
						<div className="flex place-items-center gap-1">
							<span className="text-base-neutral-600 dark:text-base-neutral-300">
								Metadata templates are user-defined collections of metadata fields.
							</span>
							<Tooltip delay={400}>
								<TooltipTrigger variant="tooltip">
									<HelpCircleIcon aria-hidden size={18} strokeWidth={1.5} />
								</TooltipTrigger>
								<TooltipContent arrow={false} variant="rich">
									Templates can be created and activated in projects and folders.
									<br />
									<br />
									Click the edit button and select one template.
								</TooltipContent>
							</Tooltip>
						</div>
						<ShareButton />
					</div>

					<div className="flex place-content-end place-items-center gap-2">
						{access.canCreate ? (
							<MetadataTemplateImportButton scope={props.scope} size="sm" variant="secondary-filled" />
						) : null}
						<ViewSwitch
							className="hidden md:flex"
							defaultView={settings.defaultViewMode}
							isDisabled={!totalCount}
							resetPageOnChange
						/>
					</div>
				</>
			}
			empty={props.renderEmpty()}
			hasResults={hasResults}
			layout={isGridLayout ? 'grid' : 'table'}
			list={isGridLayout ? props.renderGrid(paginatedData) : props.renderTable(paginatedData)}
			pagination={
				totalCount
					? {
							count: totalCount,
							length: paginatedData.length,
							limit: effectiveLimit,
							offset,
						}
					: undefined
			}
			preListContent={
				isProjectOrFolderAdmin ? (
					<EditTemplateContainersToolbar>
						<UpdateMetadataTemplateButton
							containers={allData}
							folderUuid={props.scope.kind === 'folder' ? props.scope.folderUuid : undefined}
							projectUuid={props.scope.projectUuid}
						/>
					</EditTemplateContainersToolbar>
				) : null
			}
		/>
	);
}
