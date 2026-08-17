'use client';

import { keepPreviousData, useSuspenseQuery } from '@tanstack/react-query';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { useEffect, useRef } from 'react';
import { useMediaQuery } from 'usehooks-ts';
import { MainRouteListFrame } from '@/components/main-route/frame/MainRouteListFrame';
import { MetadataTemplateImportButton } from '@/components/metadata-template/MetadataTemplateImportDialog';
import { ViewSwitch } from '@/components/query-controls/ViewSwitch';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useUserSettings } from '@/hooks/useUserSettings';
import { $api } from '@/util/clientFetch';
import { getEffectiveListLimit } from '@/util/paginationLimits';
import { MetadataTemplatesBulkActions } from './MetadataTemplatesBulkActions';
import { MetadataTemplatesGrid } from './MetadataTemplatesGrid';
import { MetadataTemplatesSortByMenu } from './MetadataTemplatesSortByMenu';
import { MetadataTemplatesTable } from './MetadataTemplatesTable';
import { MetadataTemplatesViewEmpty } from './MetadataTemplatesViewEmpty';
import { metadataTemplateBulkQueryState } from './metadataTemplateBulkQueryState';

export function MetadataTemplatesView() {
	const { currentUserData } = useCurrentUser();
	const { settings } = useUserSettings();

	const [queryStates, setQueryStates] = useQueryStates({
		...metadataTemplateBulkQueryState,
		page: parseAsInteger.withDefault(1),
		sort: parseAsString.withDefault('name'),
		view: parseAsString.withDefault(settings.defaultViewMode ?? 'grid'),
	});
	const isMobile = useMediaQuery('(max-width: 600px)', { initializeWithValue: false });
	const isGridLayout = queryStates.view === 'grid' || isMobile;

	const hasLeadingActionItem = Boolean(currentUserData?.is_global_metadata_template_admin);
	const effectiveLimit = getEffectiveListLimit({
		hasLeadingActionItem,
		isGridLayout,
	});
	const offset = (queryStates.page - 1) * effectiveLimit;
	const selectionPageKey = `${queryStates.page}:${queryStates.sort}`;
	const previousSelectionPageKeyRef = useRef(selectionPageKey);

	useEffect(() => {
		if (previousSelectionPageKeyRef.current === selectionPageKey) {
			return;
		}

		previousSelectionPageKeyRef.current = selectionPageKey;
		if (queryStates.selected.length) {
			void setQueryStates({ selected: [] });
		}
	}, [queryStates.selected.length, selectionPageKey, setQueryStates]);

	const { data: metadataTemplateContainersData } = useSuspenseQuery(
		$api.queryOptions(
			'get',
			'/api/v1/metadata-template-container/',
			{
				params: { query: { limit: effectiveLimit, offset, ordering: queryStates.sort } },
			},
			{ placeholderData: keepPreviousData },
		),
	);

	const hasResults = metadataTemplateContainersData.results?.length;

	return (
		<MainRouteListFrame
			controls={
				<div className="flex flex-col gap-4">
					<div className="flex place-content-between place-items-center gap-2">
						<MetadataTemplatesSortByMenu isDisabled={!hasResults} />
						<div className="flex place-items-center gap-2">
							{currentUserData?.is_global_metadata_template_admin ? (
								<MetadataTemplateImportButton scope={{ kind: 'global' }} size="sm" variant="secondary-filled" />
							) : null}
							<ViewSwitch
								className="hidden md:flex"
								defaultView={settings.defaultViewMode}
								isDisabled={!hasResults}
								resetPageOnChange={!queryStates.bulk_edit}
							/>
						</div>
					</div>
				</div>
			}
			empty={<MetadataTemplatesViewEmpty />}
			hasResults={Boolean(hasResults)}
			layout={isGridLayout ? 'grid' : 'table'}
			list={
				isGridLayout ? (
					<MetadataTemplatesGrid data={metadataTemplateContainersData.results ?? []} />
				) : (
					<MetadataTemplatesTable data={metadataTemplateContainersData.results ?? []} />
				)
			}
			pagination={
				hasResults
					? {
							count: metadataTemplateContainersData.count ?? 0,
							length: metadataTemplateContainersData.results?.length ?? 0,
							limit: effectiveLimit,
							offset,
						}
					: undefined
			}
			preListContent={
				hasResults ? (
					<MetadataTemplatesBulkActions
						currentPageUuids={(metadataTemplateContainersData.results ?? []).map((item) => item.pk)}
					/>
				) : null
			}
		/>
	);
}
