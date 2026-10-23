'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { SearchIcon, SlidersHorizontalIcon, XCircleIcon } from 'lucide-react';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import type { Selection } from 'react-aria-components';
import { useDebounceValue, useMediaQuery } from 'usehooks-ts';
import { FilterMenu } from '@/components/query-controls/FilterMenu';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Collapsible } from '@/components/ui/Collapsible';
import { Input } from '@/components/ui/Input';
import { ModalBody, ModalContent, ModalFooter, ModalHeader, ModalTitle } from '@/components/ui/Modal';
import { SearchField } from '@/components/ui/SearchField';
import { ToggleButton } from '@/components/ui/ToggleButton';
import { cx } from '@/styles/cva';
import { openAPIClient } from '@/util/clientFetch';
import { clusterContext, isChoiceFieldType } from '@/util/filterContext';
import { DEFAULT_FILTER_PRESET, type FilterPreset, insertFilterPreset } from '@/util/filterPresets';
import { formatErrorMessage } from '@/util/formatErrorMessage';
import {
	addRowToCluster,
	type ClusterEligibleField,
	coerceClusterMixedOperators,
	coerceChoiceValueForOperatorChange,
	coerceValueForOperatorChange,
	compressFiltersParam,
	createClusterFromField,
	createSearchFilterRow,
	decompressFiltersParam,
	type EnrichedSearchField,
	getFieldsForTypes,
	getSearchFieldById,
	getGlobalSearchDisplayResults,
	getSearchSchemaQueryKey,
	hydrateItems,
	isClusterEligibleField,
	isClusterItem,
	isSearchSchemaResponse,
	type SearchSchemaResponse,
	normalizeItemOrder,
	type MetadataCluster,
	normalizeSearchFilterRow,
	parseSearchFiltersParam,
	removeRowFromCluster,
	swapClusterRowField,
	type SearchFilterConnector,
	type SearchFilterItem,
	type SearchFilterRowItem,
	type SearchFilterValue,
	serializeSearchFiltersParam,
	stripItemIds,
	GLOBAL_SEARCH_LIMIT,
} from '@/util/globalSearch';
import { getSelectionStringSet } from '@/util/selection';
import { SearchAdvancedFilters } from './SearchAdvancedFilters';
import { SearchCursorPagination } from './SearchCursorPagination';
import { SearchLimitMenu } from './SearchLimitMenu';
import { SearchList } from './SearchList';
import { SearchSortByMenu } from './SearchSortByMenu';
import { SearchViewEmpty } from './SearchViewEmpty';
import { normalizeSearchLimit, type SearchLimit } from './searchLimit';
import {
	buildSearchRouteRequest,
	getResolvedSearchResultTypes,
	getResolvedSearchSortKey,
	getSearchRouteResultsQueryKey,
	getSearchSimpleFilterField,
	getSearchSourceOptions,
	hasSearchRouteCriteria,
	normalizeSearchMultiSelectParam,
	parseSearchMultiSelectParam,
	SEARCH_CREATED_BY_OPTIONS,
	SEARCH_MY_PERMISSIONS_OPTIONS,
	serializeSearchMultiSelectParam,
} from './searchRouteCriteria';

const TOOLBAR_TRIGGER_CLASS_NAME =
	'h-8 gap-2 rounded-lg border border-base-neutral-100 py-1 pr-4 pl-2 hover:bg-base-neutral-100 dark:border-base-neutral-700 dark:hover:bg-base-neutral-700 pressed:border-transparent pressed:bg-base-neutral-300 pressed:outline-2 pressed:outline-offset-2 pressed:outline-base-lavender-400 dark:pressed:border-transparent dark:pressed:bg-base-neutral-600 dark:pressed:outline-base-lavender-600';

type SearchMenuState = {
	handleSelectionChange(keys: Selection): Promise<void>;
	readonly isMenuOpen: boolean;
	readonly label: string;
	readonly options: Record<string, string>;
	readonly selected: Set<string>;
	readonly setIsMenuOpen: Dispatch<SetStateAction<boolean>>;
};

function getAdvancedFilterStateKey(items: readonly SearchFilterItem[]) {
	return serializeSearchFiltersParam(stripItemIds(items)) ?? '';
}

function SearchAdvancedFiltersTrigger(props: {
	readonly activeFilters: number;
	readonly isOpen: boolean;
	onOpenChange(isOpen: boolean): void;
}) {
	return (
		<ToggleButton
			className={cx(
				TOOLBAR_TRIGGER_CLASS_NAME,
				props.activeFilters ? 'pr-1' : '',
				'data-[selected=true]:bg-base-neutral-100 dark:data-[selected=true]:bg-base-neutral-700',
			)}
			isSelected={props.isOpen}
			onChange={props.onOpenChange}
			variant="unset"
		>
			<SlidersHorizontalIcon aria-hidden size={18} strokeWidth={1.5} />
			<span className="inline-flex place-items-center gap-3">
				Advanced
				{props.activeFilters > 0 ? (
					<span className="rounded-sm bg-base-neutral-100 px-2 py-1 text-base-sm dark:bg-base-neutral-700">
						{props.activeFilters}
					</span>
				) : null}
			</span>
		</ToggleButton>
	);
}

function SearchAdvancedFiltersPanel(props: {
	readonly fields: readonly EnrichedSearchField[];
	readonly isOpen: boolean;
	readonly items: readonly SearchFilterItem[];
	onAddItem(fieldId: string): void;
	onClusterAddRow(clusterId: string, field: ClusterEligibleField): void;
	onClusterRemove(clusterId: string): void;
	onClusterRowFieldChange(clusterId: string, rowId: string, fieldId: ClusterEligibleField): void;
	onClusterRowOperatorChange(clusterId: string, rowId: string, operator: string): void;
	onClusterRowRemove(clusterId: string, rowId: string): void;
	onClusterRowValueChange(clusterId: string, rowId: string, value: SearchFilterValue): void;
	onConnectorChange(id: string, connector: SearchFilterConnector): void;
	onMove(fromIndex: number, toIndex: number): void;
	onPresetSelect(preset: FilterPreset): void;
	onRemoveItem(id: string): void;
	onRowEntityLabelsChange(id: string, labels: Record<string, string>): void;
	onRowFieldChange(id: string, fieldId: string): void;
	onRowOperatorChange(id: string, operator: string): void;
	onRowValueChange(id: string, value: SearchFilterValue): void;
	readonly totalSelectedTypes: number;
}) {
	return (
		<Collapsible isOpen={props.isOpen}>
			<SearchAdvancedFilters
				fields={props.fields}
				items={props.items}
				onAddItem={props.onAddItem}
				onClusterAddRow={props.onClusterAddRow}
				onClusterRemove={props.onClusterRemove}
				onClusterRowFieldChange={props.onClusterRowFieldChange}
				onClusterRowOperatorChange={props.onClusterRowOperatorChange}
				onClusterRowRemove={props.onClusterRowRemove}
				onClusterRowValueChange={props.onClusterRowValueChange}
				onConnectorChange={props.onConnectorChange}
				onMove={props.onMove}
				onPresetSelect={props.onPresetSelect}
				onRemoveItem={props.onRemoveItem}
				onRowEntityLabelsChange={props.onRowEntityLabelsChange}
				onRowFieldChange={props.onRowFieldChange}
				onRowOperatorChange={props.onRowOperatorChange}
				onRowValueChange={props.onRowValueChange}
				totalSelectedTypes={props.totalSelectedTypes}
			/>
		</Collapsible>
	);
}

export function SearchView(props: { readonly initialSchema?: SearchSchemaResponse | undefined }) {
	const [queryStates, setQueryStates] = useQueryStates({
		created_by: parseAsString,
		filters: parseAsString,
		limit: parseAsInteger.withDefault(GLOBAL_SEARCH_LIMIT),
		my_permissions: parseAsString,
		q: parseAsString,
		sort: parseAsString,
		source: parseAsString,
	});
	const isMobile = useMediaQuery('(max-width: 600px)', { initializeWithValue: false });
	const searchQueryParam = queryStates.q ?? '';
	const filtersParam = queryStates.filters ?? '';
	const [search, setSearch] = useState(searchQueryParam);
	const [items, setItems] = useState<SearchFilterItem[]>(() => {
		if (filtersParam) {
			return hydrateItems(decompressFiltersParam(filtersParam));
		}
		return insertFilterPreset([], DEFAULT_FILTER_PRESET, 'append');
	});
	const [debouncedSearch, setDebouncedSearch] = useDebounceValue(searchQueryParam, 250);
	const [page, setPage] = useState(1);
	const [cursor, setCursor] = useState<string | undefined>();
	const [cursorDirection, setCursorDirection] = useState<'next' | 'previous'>('next');
	const [isAdvancedOpen, setIsAdvancedOpen] = useState(() => items.length > 0);
	const [isSourceMenuOpen, setIsSourceMenuOpen] = useState(false);
	const [isCreatedByMenuOpen, setIsCreatedByMenuOpen] = useState(false);
	const [isMyPermissionsMenuOpen, setIsMyPermissionsMenuOpen] = useState(false);

	const schemaQuery = useQuery({
		queryKey: getSearchSchemaQueryKey(),
		queryFn: async () => {
			const { data, error, response } = await openAPIClient.GET('/api/v1/search/global/schema/');

			if (error || !isSearchSchemaResponse(data)) {
				throw new Error(formatErrorMessage(error ?? {}, response));
			}

			return data;
		},
	});
	// The command menu may already have created this query in the browser before the page data is hydrated, so the
	// first browser render uses the schema the server rendered with, which keeps server and browser output identical.
	const schemaData = schemaQuery.data ?? props.initialSchema;

	useEffect(() => {
		setSearch(searchQueryParam);
		setDebouncedSearch(searchQueryParam);
	}, [searchQueryParam, setDebouncedSearch]);

	useEffect(() => {
		const normalizedSearchParam = debouncedSearch.trim().length > 0 ? debouncedSearch : null;
		if ((searchQueryParam || null) === normalizedSearchParam) {
			return;
		}

		void setQueryStates({ q: normalizedSearchParam });
	}, [debouncedSearch, searchQueryParam, setQueryStates]);

	const serializedAdvancedFilterState = getAdvancedFilterStateKey(items);
	const [debouncedSerializedFilters, setDebouncedSerializedFilters] = useDebounceValue(
		serializedAdvancedFilterState,
		250,
	);
	useEffect(() => {
		setDebouncedSerializedFilters(serializedAdvancedFilterState);
	}, [serializedAdvancedFilterState, setDebouncedSerializedFilters]);
	const compressedFilters = compressFiltersParam(stripItemIds(items));

	useEffect(() => {
		const currentParam = queryStates.filters ?? null;
		const nextParam = compressedFilters;
		if (currentParam === nextParam) {
			return;
		}

		void setQueryStates({ filters: nextParam });
	}, [compressedFilters, queryStates.filters, setQueryStates]);

	const sourceOptions = getSearchSourceOptions(schemaData);
	const sourceOptionKeys = Object.keys(sourceOptions);
	const selectedTypes = schemaData ? getResolvedSearchResultTypes(queryStates.source ?? null, schemaData) : [];
	const fields = schemaData ? getFieldsForTypes(schemaData, selectedTypes) : [];
	const createdByField = getSearchSimpleFilterField('created_by', fields);
	const myPermissionsField = getSearchSimpleFilterField('my_permissions', fields);
	const createdByOptionKeys = Object.keys(SEARCH_CREATED_BY_OPTIONS);
	const myPermissionsOptionKeys = Object.keys(SEARCH_MY_PERMISSIONS_OPTIONS);
	const sourceSelection = parseSearchMultiSelectParam(queryStates.source ?? null, sourceOptionKeys);
	const createdBySelection = parseSearchMultiSelectParam(queryStates.created_by ?? null, createdByOptionKeys);
	const myPermissionsSelection = parseSearchMultiSelectParam(
		queryStates.my_permissions ?? null,
		myPermissionsOptionKeys,
	);
	const parsedAdvancedFilters = parseSearchFiltersParam(debouncedSerializedFilters);
	const limit = normalizeSearchLimit(queryStates.limit);
	const resolvedSortKey = getResolvedSearchSortKey(queryStates.sort ?? null, debouncedSearch);
	const normalizedSourceParam = normalizeSearchMultiSelectParam(queryStates.source ?? null, sourceOptionKeys);
	const normalizedCreatedByParam = normalizeSearchMultiSelectParam(queryStates.created_by ?? null, createdByOptionKeys);
	const normalizedMyPermissionsParam = normalizeSearchMultiSelectParam(
		queryStates.my_permissions ?? null,
		myPermissionsOptionKeys,
	);
	const hasCriteria = hasSearchRouteCriteria({
		createdByParam: normalizedCreatedByParam,
		filters: parsedAdvancedFilters,
		myPermissionsParam: normalizedMyPermissionsParam,
		searchText: debouncedSearch,
		sourceParam: normalizedSourceParam,
	});

	useEffect(() => {
		setCursor(undefined);
		setCursorDirection('next');
		setPage(1);
	}, [
		debouncedSerializedFilters,
		debouncedSearch,
		limit,
		normalizedCreatedByParam,
		normalizedMyPermissionsParam,
		normalizedSourceParam,
		resolvedSortKey,
	]);

	const searchQuery = useQuery({
		queryKey: schemaData
			? getSearchRouteResultsQueryKey({
					createdByParam: normalizedCreatedByParam,
					cursor,
					cursorDirection,
					filtersParam: debouncedSerializedFilters || null,
					limit,
					myPermissionsParam: normalizedMyPermissionsParam,
					responseMode: 'full',
					schema: schemaData,
					searchText: debouncedSearch,
					selectedTypes,
					sortParam: resolvedSortKey,
					sourceParam: normalizedSourceParam,
				})
			: ['search-route-results', 'pending'],
		queryFn: async () => {
			const schema = schemaData;
			if (!schema) {
				return null;
			}

			const { data, error, response } = await openAPIClient.POST('/api/v1/search/global/', {
				body: buildSearchRouteRequest({
					createdByParam: normalizedCreatedByParam,
					cursor,
					cursorDirection,
					filters: parsedAdvancedFilters,
					limit,
					myPermissionsParam: normalizedMyPermissionsParam,
					responseMode: 'full',
					schema,
					searchText: debouncedSearch,
					selectedTypes,
					sortParam: resolvedSortKey,
					sourceParam: normalizedSourceParam,
				}),
			});

			if (error || !data) {
				throw new Error(formatErrorMessage(error ?? {}, response));
			}

			return data;
		},
		enabled: Boolean(schemaData) && hasCriteria,
		placeholderData: keepPreviousData,
	});

	const searchResults = hasCriteria ? getGlobalSearchDisplayResults(searchQuery.data ?? null) : [];
	const hasResults = searchResults.length > 0;
	const hasSearchError = searchQuery.isError;
	const hasSchemaError = schemaQuery.isError && !schemaData;
	const shouldShowNoResults =
		hasCriteria && !searchQuery.isPending && !hasResults && !hasSearchError && !hasSchemaError;

	const metadataValueField = getSearchFieldById(fields, 'metadata.value');

	function coerceCluster(cluster: MetadataCluster): MetadataCluster {
		const coercedRows = coerceClusterMixedOperators(cluster.rows, metadataValueField);
		if (coercedRows === cluster.rows) {
			return cluster;
		}
		return { ...cluster, rows: coercedRows as MetadataCluster['rows'] };
	}

	function updateCluster(clusterId: string, updater: (cluster: MetadataCluster) => MetadataCluster | null): void {
		setItems((currentItems) =>
			normalizeItemOrder(
				currentItems.flatMap((item): SearchFilterItem[] => {
					if (!isClusterItem(item) || item.id !== clusterId) {
						return [item];
					}
					const next = updater(item);
					return next ? [coerceCluster(next)] : [];
				}),
			),
		);
	}

	const handleAddItem = (fieldId: string) => {
		const field = getSearchFieldById(fields, fieldId) ?? fields[0];
		const effectiveFieldId = field?.id ?? '';
		setItems((currentItems) => {
			const connector: SearchFilterConnector | undefined = currentItems.length > 0 ? 'AND' : undefined;
			if (isClusterEligibleField(effectiveFieldId)) {
				return normalizeItemOrder([
					...currentItems,
					coerceCluster(createClusterFromField(effectiveFieldId, field, { connector })),
				]);
			}
			const row = createSearchFilterRow(field, { connector });
			const rowItem: SearchFilterRowItem = {
				kind: 'row',
				connector: row.connector,
				...(row.entityLabels ? { entityLabels: row.entityLabels } : {}),
				field: row.field,
				id: row.id,
				operator: row.operator,
				value: row.value,
			};
			return normalizeItemOrder([...currentItems, rowItem]);
		});
	};

	const handleConnectorChange = (id: string, connector: SearchFilterConnector) => {
		setItems((currentItems) =>
			normalizeItemOrder(currentItems.map((item) => (item.id === id ? { ...item, connector } : item))),
		);
	};

	const handleRowFieldChange = (id: string, fieldId: string) => {
		setItems((currentItems) =>
			normalizeItemOrder(
				currentItems.flatMap((item): SearchFilterItem[] => {
					if (item.id !== id || isClusterItem(item)) {
						return [item];
					}
					const field = getSearchFieldById(fields, fieldId);
					// Cluster-eligible field picked on a top-level row: replace the row with a cluster.
					if (isClusterEligibleField(fieldId)) {
						return [coerceCluster(createClusterFromField(fieldId, field, { connector: item.connector }))];
					}
					const normalized = normalizeSearchFilterRow(
						{
							connector: item.connector,
							...(item.entityLabels ? { entityLabels: item.entityLabels } : {}),
							field: fieldId,
							id: item.id,
							operator: field?.operators[0] ?? '',
							value: field?.enum_values[0] ?? '',
						},
						fields,
					);
					return [
						{
							kind: 'row',
							connector: normalized.connector,
							...(normalized.entityLabels ? { entityLabels: normalized.entityLabels } : {}),
							field: normalized.field,
							id: normalized.id,
							operator: normalized.operator,
							value: normalized.value,
						},
					];
				}),
			),
		);
	};

	const handleRowOperatorChange = (id: string, operator: string) => {
		setItems((currentItems) =>
			currentItems.map((item) => {
				if (item.id !== id || isClusterItem(item)) {
					return item;
				}
				const coercedValue = coerceValueForOperatorChange(item.value, item.operator, operator);
				return { ...item, operator, value: coercedValue };
			}),
		);
	};

	const handleRowValueChange = (id: string, value: SearchFilterValue) => {
		setItems((currentItems) =>
			currentItems.map((item) => (item.id === id && !isClusterItem(item) ? { ...item, value } : item)),
		);
	};

	const handleRowEntityLabelsChange = (id: string, entityLabels: Record<string, string>) => {
		setItems((currentItems) =>
			currentItems.map((item) => (item.id === id && !isClusterItem(item) ? { ...item, entityLabels } : item)),
		);
	};

	const handleRemoveItem = (id: string) => {
		setItems((currentItems) => normalizeItemOrder(currentItems.filter((item) => item.id !== id)));
	};

	const handleClusterAddRow = (clusterId: string, field: ClusterEligibleField) => {
		const schemaField = getSearchFieldById(fields, field);
		updateCluster(clusterId, (cluster) => addRowToCluster(cluster, field, schemaField));
	};

	const handleClusterRemove = (clusterId: string) => {
		setItems((currentItems) => normalizeItemOrder(currentItems.filter((item) => item.id !== clusterId)));
	};

	const handleClusterRowRemove = (clusterId: string, rowId: string) => {
		updateCluster(clusterId, (cluster) => removeRowFromCluster(cluster, rowId));
	};

	const handleClusterRowFieldChange = (clusterId: string, rowId: string, fieldId: ClusterEligibleField) => {
		const schemaField = getSearchFieldById(fields, fieldId);
		updateCluster(clusterId, (cluster) => swapClusterRowField(cluster, rowId, fieldId, schemaField));
	};

	const handleClusterRowOperatorChange = (clusterId: string, rowId: string, operator: string) => {
		updateCluster(clusterId, (cluster) => ({
			...cluster,
			rows: cluster.rows.map((row) => {
				if (row.id !== rowId) {
					return row;
				}
				const coercedValue =
					row.field === 'metadata.value' && isChoiceFieldType(clusterContext(cluster.rows).inferredFieldType)
						? coerceChoiceValueForOperatorChange(row.value, row.operator, operator)
						: coerceValueForOperatorChange(row.value, row.operator, operator);
				return { ...row, operator, unresolvedOperator: undefined, value: coercedValue };
			}),
		}));
	};

	const handleClusterRowValueChange = (clusterId: string, rowId: string, value: SearchFilterValue) => {
		updateCluster(clusterId, (cluster) => ({
			...cluster,
			rows: cluster.rows.map((row) => (row.id === rowId ? { ...row, value } : row)),
		}));
	};

	const [pendingPreset, setPendingPreset] = useState<FilterPreset | null>(null);

	const handlePresetSelect = (preset: FilterPreset) => {
		if (items.length === 0) {
			setItems((currentItems) => insertFilterPreset(currentItems, preset, 'append'));
			return;
		}
		setPendingPreset(preset);
	};

	const handlePresetCommit = (mode: 'append' | 'replace') => {
		const preset = pendingPreset;
		if (!preset) {
			return;
		}
		setItems((currentItems) => insertFilterPreset(currentItems, preset, mode));
		setPendingPreset(null);
	};

	const handleMoveItem = (fromIndex: number, toIndex: number) => {
		if (fromIndex === toIndex) {
			return;
		}

		setItems((currentItems) => {
			const nextItems = [...currentItems];
			const moved = nextItems[fromIndex];
			if (!moved) {
				return currentItems;
			}
			nextItems.splice(fromIndex, 1);
			nextItems.splice(toIndex, 0, moved);
			return normalizeItemOrder(nextItems);
		});
	};

	const handleMultiSelectChange = async (
		queryKey: 'created_by' | 'my_permissions' | 'source',
		keys: Selection,
		allowedValues: readonly string[],
	) => {
		const normalizedKeys = getSelectionStringSet(keys, allowedValues);
		const nextValue = serializeSearchMultiSelectParam(normalizedKeys, allowedValues);

		if (normalizedKeys.has('reset')) {
			await setQueryStates({ [queryKey]: null });
		} else if (queryKey === 'source') {
			await setQueryStates({ source: nextValue });
		} else if (queryKey === 'created_by') {
			await setQueryStates({ created_by: nextValue });
		} else {
			await setQueryStates({ my_permissions: nextValue });
		}
	};

	const sourceFilterState: SearchMenuState | undefined =
		sourceOptionKeys.length > 0
			? {
					handleSelectionChange: async (keys: Selection) => handleMultiSelectChange('source', keys, sourceOptionKeys),
					isMenuOpen: isSourceMenuOpen,
					label: 'Source',
					options: sourceOptions,
					selected: sourceSelection,
					setIsMenuOpen: setIsSourceMenuOpen,
				}
			: undefined;

	const createdByFilterState: SearchMenuState | undefined = createdByField
		? {
				handleSelectionChange: async (keys: Selection) =>
					handleMultiSelectChange('created_by', keys, createdByOptionKeys),
				isMenuOpen: isCreatedByMenuOpen,
				label: 'Created by',
				options: SEARCH_CREATED_BY_OPTIONS,
				selected: createdBySelection,
				setIsMenuOpen: setIsCreatedByMenuOpen,
			}
		: undefined;

	const myPermissionsFilterState: SearchMenuState | undefined = myPermissionsField
		? {
				handleSelectionChange: async (keys: Selection) =>
					handleMultiSelectChange('my_permissions', keys, myPermissionsOptionKeys),
				isMenuOpen: isMyPermissionsMenuOpen,
				label: 'My permissions',
				options: SEARCH_MY_PERMISSIONS_OPTIONS,
				selected: myPermissionsSelection,
				setIsMenuOpen: setIsMyPermissionsMenuOpen,
			}
		: undefined;

	const mobileFilterStates = [sourceFilterState, createdByFilterState, myPermissionsFilterState].filter(
		(filterState): filterState is SearchMenuState => filterState !== undefined,
	);
	const handleLimitChange = (nextLimit: SearchLimit) => {
		setCursor(undefined);
		setCursorDirection('next');
		setPage(1);
		void setQueryStates({ limit: nextLimit === GLOBAL_SEARCH_LIMIT ? null : nextLimit });
	};

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-6">
				<SearchField
					aria-label="Global search"
					className="group/search-header h-[72px] flex-row items-center gap-3 border-b border-base-neutral-300 pr-1 pb-6 outline-offset-2 outline-base-lavender-400 focus-within:border-base-lavender-500 focus-within:outline-2 dark:border-base-neutral-500 dark:outline-base-lavender-600 dark:focus-within:border-base-lavender-400"
					onChange={(value) => {
						setSearch(value);
						setDebouncedSearch(value);
					}}
					value={search}
				>
					<SearchIcon
						aria-hidden
						className="mt-2 size-10 shrink-0 text-base-neutral-900 dark:text-base-neutral-40"
						strokeWidth={1}
					/>
					<div className="min-w-0 grow">
						<Input
							aria-label="Search all items"
							className="h-12 min-w-0 rounded-none border-0 bg-transparent p-0 pt-2 text-base-neutral-900 placeholder:text-base-neutral-400 hover:border-transparent focus:border-transparent focus:outline-0 dark:bg-transparent dark:text-base-neutral-40 dark:placeholder:text-base-neutral-500"
							placeholder="Search"
							style={{
								fontSize: 'var(--text-base-heading-md)',
								lineHeight: 'var(--text-base-heading-md--line-height)',
							}}
						/>
					</div>
					<Button
						aria-label="Clear search"
						className="mt-2 group-empty/search-header:invisible"
						size="icon-xs"
						slot="clear"
						type="button"
						variant="unset"
					>
						<XCircleIcon aria-hidden className="size-6 shrink-0" strokeWidth={1.5} />
					</Button>
				</SearchField>

				<div className="flex flex-col gap-4">
					<div className="flex place-content-between place-items-center">
						<SearchSortByMenu searchText={debouncedSearch} />
						<SearchLimitMenu limit={limit} onLimitChange={handleLimitChange} />
					</div>

					<div className="flex flex-wrap items-center gap-2">
						{isMobile ? (
							mobileFilterStates.length > 0 ? (
								<FilterMenu filterStates={mobileFilterStates} label="Filter" />
							) : null
						) : (
							<>
								{sourceFilterState ? <FilterMenu filterState={sourceFilterState} label="Source" /> : null}
								{createdByFilterState ? <FilterMenu filterState={createdByFilterState} label="Created by" /> : null}
								{myPermissionsFilterState ? (
									<FilterMenu filterState={myPermissionsFilterState} label="My permissions" />
								) : null}
							</>
						)}
						<SearchAdvancedFiltersTrigger
							activeFilters={items.length}
							isOpen={isAdvancedOpen}
							onOpenChange={setIsAdvancedOpen}
						/>
					</div>
					<SearchAdvancedFiltersPanel
						fields={fields}
						isOpen={isAdvancedOpen}
						items={items}
						onAddItem={handleAddItem}
						onClusterAddRow={handleClusterAddRow}
						onClusterRemove={handleClusterRemove}
						onClusterRowFieldChange={handleClusterRowFieldChange}
						onClusterRowOperatorChange={handleClusterRowOperatorChange}
						onClusterRowRemove={handleClusterRowRemove}
						onClusterRowValueChange={handleClusterRowValueChange}
						onConnectorChange={handleConnectorChange}
						onMove={handleMoveItem}
						onPresetSelect={handlePresetSelect}
						onRemoveItem={handleRemoveItem}
						onRowEntityLabelsChange={handleRowEntityLabelsChange}
						onRowFieldChange={handleRowFieldChange}
						onRowOperatorChange={handleRowOperatorChange}
						onRowValueChange={handleRowValueChange}
						totalSelectedTypes={selectedTypes.length}
					/>
				</div>
			</div>

			{hasSchemaError ? (
				<Alert>
					<span>
						{schemaQuery.error instanceof Error ? schemaQuery.error.message : 'Failed to load search schema.'}
					</span>
				</Alert>
			) : null}

			{hasSearchError ? (
				<Alert>
					<span>
						{searchQuery.error instanceof Error ? searchQuery.error.message : 'Failed to load search results.'}
					</span>
				</Alert>
			) : null}

			{searchQuery.data?.count && hasResults ? (
				<SearchCursorPagination
					count={searchQuery.data.count}
					hasNextPage={Boolean(searchQuery.data.next_cursor)}
					hasPreviousPage={Boolean(searchQuery.data.previous_cursor) && page > 1}
					length={searchResults.length}
					limit={limit}
					onNextPage={() => {
						if (!searchQuery.data?.next_cursor) {
							return;
						}

						setCursor(searchQuery.data.next_cursor);
						setCursorDirection('next');
						setPage((currentPage) => currentPage + 1);
					}}
					onPreviousPage={() => {
						if (!searchQuery.data?.previous_cursor || page <= 1) {
							return;
						}

						setCursor(searchQuery.data.previous_cursor);
						setCursorDirection('previous');
						setPage((currentPage) => Math.max(currentPage - 1, 1));
					}}
					page={page}
				/>
			) : null}

			{hasResults ? (
				<SearchList data={searchResults} searchText={debouncedSearch} />
			) : shouldShowNoResults ? (
				<SearchViewEmpty />
			) : null}

			{searchQuery.data?.count && hasResults ? (
				<SearchCursorPagination
					count={searchQuery.data.count}
					hasNextPage={Boolean(searchQuery.data.next_cursor)}
					hasPreviousPage={Boolean(searchQuery.data.previous_cursor) && page > 1}
					length={searchResults.length}
					limit={limit}
					onNextPage={() => {
						if (!searchQuery.data?.next_cursor) {
							return;
						}

						setCursor(searchQuery.data.next_cursor);
						setCursorDirection('next');
						setPage((currentPage) => currentPage + 1);
					}}
					onPreviousPage={() => {
						if (!searchQuery.data?.previous_cursor || page <= 1) {
							return;
						}

						setCursor(searchQuery.data.previous_cursor);
						setCursorDirection('previous');
						setPage((currentPage) => Math.max(currentPage - 1, 1));
					}}
					onLimitChange={handleLimitChange}
					page={page}
					showLimitControl
				/>
			) : null}
			<ModalContent
				aria-labelledby="preset-replace-title"
				closeButton={false}
				isOpen={pendingPreset !== null}
				onOpenChange={(open) => !open && setPendingPreset(null)}
				role="alertdialog"
			>
				<ModalHeader>
					<ModalTitle id="preset-replace-title">Apply preset</ModalTitle>
				</ModalHeader>
				<ModalBody>
					<p>You already have filter conditions. Replace them with this preset, or add to them?</p>
				</ModalBody>
				<ModalFooter>
					<Button onPress={() => setPendingPreset(null)} variant="secondary-discreet">
						Cancel
					</Button>
					<Button onPress={() => handlePresetCommit('append')} variant="secondary-outline">
						Add to existing
					</Button>
					<Button onPress={() => handlePresetCommit('replace')} variant="filled">
						Replace current filters
					</Button>
				</ModalFooter>
			</ModalContent>
		</div>
	);
}
