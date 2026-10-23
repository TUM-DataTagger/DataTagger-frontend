import {
	buildGlobalSearchRequest,
	getFieldsForTypes,
	hasGlobalSearchCriteria,
	type GlobalSearchCriteria,
	type SearchFilterItemInput,
	type SearchFilterRowItemInput,
	type SearchSchemaField,
	type SearchSchemaResponse,
} from '@/util/globalSearch';
import type { components } from '@/util/openapiSchema';

type ResultType = components['schemas']['ResultTypeEnum'];
type SearchRequestRequest = components['schemas']['SearchRequestRequest'];
type SearchSort = components['schemas']['SearchSort'];

const RESULT_TYPE_ORDER = [
	'project',
	'folder',
	'subfolder',
	'dataset',
	'dataset_version',
	'file',
	'template',
	'template_version',
] satisfies ResultType[];

const RESULT_TYPE_LABELS = {
	project: 'Projects',
	folder: 'Folders',
	subfolder: 'Subfolders',
	dataset: 'Files',
	dataset_version: 'Versions',
	file: 'File attachments',
	template: 'Metadata templates',
	template_version: 'Metadata template versions',
} satisfies Record<ResultType, string>;

export const SEARCH_CREATED_BY_OPTIONS = {
	me: 'Me',
	others: 'Others',
} as const;

export const SEARCH_MY_PERMISSIONS_OPTIONS = {
	admin: 'Project admin',
	member: 'Member',
} as const;

type SearchSimpleFilterKind = 'created_by' | 'my_permissions';

const SEARCH_SIMPLE_FILTER_FIELD_IDS = {
	created_by: ['created_by'],
	my_permissions: ['membership', 'my_permissions'],
} satisfies Record<SearchSimpleFilterKind, readonly string[]>;

type SearchSimpleFilterSelection = 'admin' | 'member' | 'me' | 'others';

export type SearchRouteCriteria = GlobalSearchCriteria & {
	readonly createdByParam?: string | null;
	readonly myPermissionsParam?: string | null;
	readonly selectedTypes?: readonly string[];
	readonly sortParam?: string | null;
	readonly sourceParam?: string | null;
};

function getAllowedResultTypes(schema?: SearchSchemaResponse) {
	const schemaResultTypes = schema?.result_types ?? RESULT_TYPE_ORDER;

	return RESULT_TYPE_ORDER.filter((resultType) => schemaResultTypes.includes(resultType));
}

function getOptionValues(options: Record<string, string>) {
	return Object.keys(options);
}

function normalizeSelectionValues(rawValue: string | null | undefined, allowedValues: readonly string[]) {
	const nextValues = new Set(
		(rawValue ?? '')
			.split(',')
			.map((value) => value.trim())
			.filter(Boolean)
			.filter((value) => allowedValues.includes(value)),
	);

	return allowedValues.filter((value) => nextValues.has(value));
}

export function normalizeSearchMultiSelectParam(rawValue: string | null | undefined, allowedValues: readonly string[]) {
	const nextValues = normalizeSelectionValues(rawValue, allowedValues);
	if (nextValues.length === 0 || nextValues.length === allowedValues.length) {
		return null;
	}

	return nextValues.join(',');
}

export function parseSearchMultiSelectParam(rawValue: string | null | undefined, allowedValues: readonly string[]) {
	return new Set(normalizeSelectionValues(rawValue, allowedValues));
}

export function serializeSearchMultiSelectParam(selectedValues: ReadonlySet<string>, allowedValues: readonly string[]) {
	const nextValues = allowedValues.filter((value) => selectedValues.has(value));
	if (nextValues.length === 0 || nextValues.length === allowedValues.length) {
		return null;
	}

	return nextValues.join(',');
}

export function getSearchSourceOptions(schema?: SearchSchemaResponse) {
	return Object.fromEntries(
		getAllowedResultTypes(schema).map((resultType) => [resultType, RESULT_TYPE_LABELS[resultType]]),
	) as Record<string, string>;
}

type SearchSortField = components['schemas']['FieldEnum'];

const SEARCH_SORT_FIELD_MAP: Record<string, SearchSortField> = {
	creation_date: 'created_at',
	relevance: 'relevance',
	// TODO: Uncomment when backend supports name sorting on the search endpoint (requires FieldEnum update via build:openapi)
	// name: 'name' as SearchSortField,
};

export function toSearchApiSort(sortKey: string): SearchSort[] {
	const isDescending = sortKey.startsWith('-');
	const fieldName = isDescending ? sortKey.slice(1) : sortKey;
	const apiField = SEARCH_SORT_FIELD_MAP[fieldName];

	if (!apiField) {
		return [{ field: 'created_at', direction: 'desc' }];
	}

	return [{ field: apiField, direction: isDescending ? 'desc' : 'asc' }];
}

export function getSearchSortOptions(searchText?: string): Record<string, string> {
	const options: Record<string, string> = {};

	if (searchText?.trim()) {
		options['-relevance'] = 'Relevance';
	}

	// TODO: Uncomment when backend supports name sorting on the search endpoint
	// options['name'] = 'Name A-Z';
	// options['-name'] = 'Name Z-A';
	options['-creation_date'] = 'Created last';
	options.creation_date = 'Created first';

	return options;
}

export function getDefaultSearchSortKey(searchText?: string): string {
	return searchText?.trim() ? '-relevance' : '-creation_date';
}

export function getResolvedSearchSortKey(sortParam: string | null | undefined, searchText?: string): string {
	const options = getSearchSortOptions(searchText);
	if (sortParam && sortParam in options) {
		return sortParam;
	}
	return getDefaultSearchSortKey(searchText);
}

function getSearchSimpleFilterFieldCandidates(kind: SearchSimpleFilterKind, fields: readonly SearchSchemaField[]) {
	const preferredFieldIds = SEARCH_SIMPLE_FILTER_FIELD_IDS[kind];
	for (const fieldId of preferredFieldIds) {
		const field = fields.find((candidate) => candidate.id === fieldId);
		if (field) {
			return field;
		}
	}

	const selectionValues =
		kind === 'created_by' ? getOptionValues(SEARCH_CREATED_BY_OPTIONS) : getOptionValues(SEARCH_MY_PERMISSIONS_OPTIONS);

	return fields.find((field) => selectionValues.every((value) => field.enum_values.includes(value)));
}

export function getSearchSimpleFilterField(kind: SearchSimpleFilterKind, fields: readonly SearchSchemaField[]) {
	const field = getSearchSimpleFilterFieldCandidates(kind, fields);
	if (!field || field.operators.length === 0) {
		return undefined;
	}

	return field;
}

function toSearchSimpleFilterRow(
	field: SearchSchemaField | undefined,
	value: SearchSimpleFilterSelection,
): SearchFilterRowItemInput | null {
	if (!field) {
		return null;
	}

	return {
		kind: 'row',
		field: field.id,
		operator: field.operators[0] ?? '',
		value,
	};
}

export function buildSearchSimpleFilterRows(criteria: {
	readonly createdByParam?: string | null;
	readonly fields: readonly SearchSchemaField[];
	readonly myPermissionsParam?: string | null;
}): SearchFilterRowItemInput[] {
	const rows: SearchFilterRowItemInput[] = [];
	const createdBySelection = normalizeSelectionValues(
		criteria.createdByParam,
		getOptionValues(SEARCH_CREATED_BY_OPTIONS),
	);
	const myPermissionsSelection = normalizeSelectionValues(
		criteria.myPermissionsParam,
		getOptionValues(SEARCH_MY_PERMISSIONS_OPTIONS),
	);

	if (createdBySelection.length === 1) {
		const createdByRow = toSearchSimpleFilterRow(
			getSearchSimpleFilterField('created_by', criteria.fields),
			createdBySelection[0] as SearchSimpleFilterSelection,
		);
		if (createdByRow) {
			rows.push(createdByRow);
		}
	}

	if (myPermissionsSelection.length === 1) {
		const myPermissionsRow = toSearchSimpleFilterRow(
			getSearchSimpleFilterField('my_permissions', criteria.fields),
			myPermissionsSelection[0] as SearchSimpleFilterSelection,
		);
		if (myPermissionsRow) {
			rows.push(myPermissionsRow);
		}
	}

	return rows;
}

function mergeSearchFilterItems(
	advancedItems: readonly SearchFilterItemInput[],
	simpleRows: readonly SearchFilterRowItemInput[],
): SearchFilterItemInput[] {
	const nextItems: SearchFilterItemInput[] = [...advancedItems];

	for (const simpleRow of simpleRows) {
		nextItems.push({
			...simpleRow,
			connector: nextItems.length > 0 ? 'AND' : undefined,
		});
	}

	return nextItems;
}

export function getResolvedSearchResultTypes(sourceParam: string | null | undefined, schema: SearchSchemaResponse) {
	const schemaAllowedResultTypes = getAllowedResultTypes(schema);
	const schemaAllowedResultTypeSet: ReadonlySet<string> = new Set(schemaAllowedResultTypes);
	const selectedResultTypes = normalizeSelectionValues(sourceParam, schemaAllowedResultTypes);

	if (selectedResultTypes.length > 0) {
		return selectedResultTypes as SearchRequestRequest['result_types'];
	}

	return schema.default_result_types.filter((resultType) =>
		schemaAllowedResultTypeSet.has(resultType),
	) as SearchRequestRequest['result_types'];
}

export function hasSearchRouteCriteria(criteria: {
	readonly createdByParam?: string | null;
	readonly filters: readonly SearchFilterItemInput[];
	readonly myPermissionsParam?: string | null;
	readonly searchText?: string;
	readonly sourceParam?: string | null;
}) {
	return (
		hasGlobalSearchCriteria({
			filters: criteria.filters,
			searchText: criteria.searchText,
		}) ||
		Boolean(normalizeSearchMultiSelectParam(criteria.sourceParam, RESULT_TYPE_ORDER)) ||
		Boolean(normalizeSearchMultiSelectParam(criteria.createdByParam, getOptionValues(SEARCH_CREATED_BY_OPTIONS))) ||
		Boolean(
			normalizeSearchMultiSelectParam(criteria.myPermissionsParam, getOptionValues(SEARCH_MY_PERMISSIONS_OPTIONS)),
		)
	);
}

export function getSearchRouteResultsQueryKey(criteria: {
	readonly createdByParam?: string | null;
	readonly cursor?: string;
	readonly cursorDirection?: SearchRequestRequest['cursor_direction'];
	readonly filtersParam?: string | null;
	readonly limit: number;
	readonly myPermissionsParam?: string | null;
	readonly responseMode: SearchRequestRequest['response_mode'];
	readonly schema: SearchSchemaResponse;
	readonly searchText?: string;
	readonly selectedTypes?: readonly string[];
	readonly sortParam?: string | null;
	readonly sourceParam?: string | null;
}) {
	return [
		'search-route-results',
		{
			createdBy: normalizeSearchMultiSelectParam(criteria.createdByParam, getOptionValues(SEARCH_CREATED_BY_OPTIONS)),
			cursor: criteria.cursor ?? null,
			cursorDirection: criteria.cursorDirection ?? 'next',
			filters: criteria.filtersParam ?? null,
			limit: criteria.limit,
			myPermissions: normalizeSearchMultiSelectParam(
				criteria.myPermissionsParam,
				getOptionValues(SEARCH_MY_PERMISSIONS_OPTIONS),
			),
			responseMode: criteria.responseMode,
			searchText: criteria.searchText?.trim() ?? '',
			sort: getResolvedSearchSortKey(criteria.sortParam, criteria.searchText),
			source: normalizeSearchMultiSelectParam(criteria.sourceParam, getAllowedResultTypes(criteria.schema)),
		},
	] as const;
}

export function buildSearchRouteRequest({
	createdByParam,
	myPermissionsParam,
	selectedTypes,
	sortParam,
	sourceParam,
	...criteria
}: SearchRouteCriteria & {
	readonly schema: SearchSchemaResponse;
}) {
	const effectiveTypes = selectedTypes ?? criteria.schema.default_result_types;
	const fields = getFieldsForTypes(criteria.schema, effectiveTypes);
	const simpleFilters = buildSearchSimpleFilterRows({
		createdByParam,
		fields,
		myPermissionsParam,
	});
	const allFilters = mergeSearchFilterItems(criteria.filters, simpleFilters);
	const resolvedSortKey = getResolvedSearchSortKey(sortParam, criteria.searchText);
	const request = buildGlobalSearchRequest({
		...criteria,
		filters: allFilters,
		selectedTypes: effectiveTypes,
	});

	return {
		...request,
		result_types: getResolvedSearchResultTypes(sourceParam, criteria.schema),
		sort: toSearchApiSort(resolvedSortKey),
	};
}
