import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import { clusterContext, isChoiceFieldType, type MetadataValueFieldType } from '@/util/filterContext';
import type { components } from '@/util/openapiSchema';

export type TypeaheadFieldConfig = {
	readonly endpoint: string;
	readonly valueKey: 'pk' | 'name' | 'display_name';
};

const TYPEAHEAD_FIELDS: Record<string, TypeaheadFieldConfig> = {
	project_id: { endpoint: '/api/v1/project/', valueKey: 'pk' },
	project_name: { endpoint: '/api/v1/project/', valueKey: 'name' },
	folder_id: { endpoint: '/api/v1/folder/', valueKey: 'pk' },
	folder_name: { endpoint: '/api/v1/folder/', valueKey: 'name' },
	dataset_id: { endpoint: '/api/v1/uploads-dataset/', valueKey: 'pk' },
	dataset_name: { endpoint: '/api/v1/uploads-dataset/', valueKey: 'name' },
	dataset_version_id: { endpoint: '/api/v1/uploads-version/', valueKey: 'pk' },
	dataset_version_name: { endpoint: '/api/v1/uploads-version/', valueKey: 'name' },
	template_id: { endpoint: '/api/v1/metadata-template-container/', valueKey: 'pk' },
	template_name: { endpoint: '/api/v1/metadata-template-container/', valueKey: 'name' },
	template_version_id: { endpoint: '/api/v1/metadata-template/', valueKey: 'pk' },
	template_version_name: { endpoint: '/api/v1/metadata-template/', valueKey: 'name' },
	'metadata.template_id': { endpoint: '/api/v1/metadata-template-container/', valueKey: 'pk' },
	'metadata.template_name': { endpoint: '/api/v1/metadata-template-container/', valueKey: 'name' },
};

export function getTypeaheadConfig(fieldId: string): TypeaheadFieldConfig | undefined {
	return TYPEAHEAD_FIELDS[fieldId];
}

export const STRING_ONLY_OPERATORS = new Set(['contains', 'not_contains', 'starts_with', 'ends_with']);

const SEARCH_OPERATOR_PRIORITY = [
	'is',
	'contains',
	'is_not',
	'in',
	'gt',
	'gte',
	'lt',
	'lte',
	'between',
	'is_empty',
	'is_not_empty',
	'starts_with',
	'ends_with',
	'not_contains',
	'not_in',
	'contains_any',
	'contains_all',
	'contains_none',
	'is_exactly',
] as const;

const SEARCH_OPERATOR_PRIORITY_BY_ID = new Map<string, number>(
	SEARCH_OPERATOR_PRIORITY.map((operator, index) => [operator, index]),
);

const SEARCH_OPERATOR_LABELS: Readonly<Record<string, string>> = {
	in: 'is_one_of',
	not_in: 'is_not_one_of',
	gt: '>',
	gte: '>=',
	lt: '<',
	lte: '<=',
};

export type SearchOperatorOption = {
	readonly id: string;
	readonly label: string;
};

export function getSearchOperatorOptions(operators: readonly string[]): SearchOperatorOption[] {
	return operators
		.map((id, originalIndex) => ({
			id,
			label: SEARCH_OPERATOR_LABELS[id] ?? id,
			originalIndex,
			priority: SEARCH_OPERATOR_PRIORITY_BY_ID.get(id) ?? Number.POSITIVE_INFINITY,
		}))
		.sort((left, right) => left.priority - right.priority || left.originalIndex - right.originalIndex)
		.map(({ id, label }) => ({ id, label }));
}

export function getOperatorsForMixedField(
	field: SearchSchemaField | undefined,
	fieldType: MetadataValueFieldType | undefined,
): string[] {
	return field?.operators_by_field_type[fieldType ?? 'TEXT'] ?? [];
}

export function coerceOperatorForList(currentOperator: string, operatorList: readonly string[]): string {
	return operatorList.includes(currentOperator) ? currentOperator : 'is';
}

// Narrows the metadata.value row inside a single Metadata predicate cluster against the cluster's
// own field_type row. No "two field_type rows" guard — strict cluster invariants forbid duplicate
// fields inside a cluster, and metadata.field_type cannot live anywhere else.
export function coerceClusterMixedOperators<Row extends MetadataClusterRowInput>(
	rows: readonly Row[],
	metadataValueField: SearchSchemaField | undefined,
): Row[] {
	const inferredType = clusterContext(rows).inferredFieldType;
	const narrowedOperators = getOperatorsForMixedField(metadataValueField, inferredType);

	return rows.map((row) => {
		if (row.field !== 'metadata.value') {
			return row;
		}

		const restoredOperator =
			!row.operator && row.unresolvedOperator && narrowedOperators.includes(row.unresolvedOperator)
				? row.unresolvedOperator
				: undefined;
		const operatorBeforeCoercion = restoredOperator ?? row.operator;
		const nextOperator = coerceMixedOperator(
			{ ...row, operator: operatorBeforeCoercion },
			inferredType,
			narrowedOperators,
		);
		if (nextOperator === row.operator && !row.unresolvedOperator) {
			return row;
		}

		return {
			...row,
			operator: nextOperator,
			unresolvedOperator: nextOperator ? undefined : (row.unresolvedOperator ?? row.operator) || undefined,
			value:
				nextOperator && !restoredOperator
					? isChoiceFieldType(inferredType)
						? coerceChoiceValueForOperatorChange(row.value, row.operator, nextOperator)
						: coerceValueForOperatorChange(row.value, row.operator, nextOperator)
					: row.value,
		};
	});
}

const MULTI_CHOICE_FIELD_TYPES = new Set<MetadataValueFieldType>(['MULTI_SELECTION', 'TAG']);

function isEmptyFilterValue(value: SearchFilterValue): boolean {
	return (
		value === null ||
		value === '' ||
		(Array.isArray(value) && value.length === 0) ||
		(isChoiceFilterValueState(value) && value.selected.length === 0 && value.unselected.length === 0)
	);
}

function coerceMixedOperator(
	row: MetadataClusterRowInput,
	fieldType: MetadataValueFieldType | undefined,
	operators: readonly string[],
): string {
	const advertised = (operator: string) => (operators.includes(operator) ? operator : '');
	if (operators.includes(row.operator)) {
		return row.operator;
	}

	if (fieldType && MULTI_CHOICE_FIELD_TYPES.has(fieldType)) {
		if (row.operator === 'is' || row.operator === 'in') {
			return advertised('contains_any');
		}
		if (row.operator === 'is_not' || row.operator === 'not_in') {
			return advertised('contains_none');
		}
		return isEmptyFilterValue(row.value) ? advertised('contains_any') : '';
	}

	if (fieldType === 'SELECTION') {
		if (row.operator === 'contains_any') {
			return advertised('in');
		}
		if (row.operator === 'contains_none') {
			return advertised('not_in');
		}
		return isEmptyFilterValue(row.value) ? advertised('is') : '';
	}

	return operators.includes('is') ? 'is' : (operators[0] ?? '');
}

type SearchResponse = components['schemas']['SearchResponse'];
type CompactSearchResponse = components['schemas']['CompactSearchResponse'];
type SearchRequestRequest = components['schemas']['SearchRequestRequest'];
export type SearchSchemaField = components['schemas']['SearchSchemaField'];
export type SearchSchemaResponse = components['schemas']['SearchSchemaResponse'];
type SearchSchemaType = components['schemas']['SearchSchemaType'];
type ResultType = components['schemas']['ResultTypeEnum'];

export type EnrichedSearchField = SearchSchemaField & {
	readonly applicableTypes: ResultType[];
	readonly label?: string;
};

export type SearchFieldPresentation = {
	readonly label?: string;
	readonly hidden?: true;
	readonly enumValuesHidden?: readonly string[];
};

export const SEARCH_FIELD_PRESENTATION: Record<string, SearchFieldPresentation> = {
	name: { label: 'Name', hidden: true },
	description: { label: 'Description', hidden: true },
	project_id: { label: 'Project (ID)' },
	project_name: { label: 'Project' },
	folder_id: { label: 'Folder (ID)' },
	folder_name: { label: 'Folder' },
	dataset_id: { label: 'File (ID)' },
	dataset_name: { label: 'File' },
	dataset_version_id: { label: 'File version (ID)' },
	dataset_version_name: { label: 'File version' },
	file_name: { label: 'File attachment', hidden: true },
	template_id: { label: 'Metadata template (ID)' },
	template_name: { label: 'Metadata template' },
	template_version_id: { label: 'Metadata template version (ID)' },
	template_version_name: { label: 'Metadata template version' },
	template_type: { label: 'Template scope' },
	'metadata.template_id': { label: 'Metadata template (ID)' },
	'metadata.template_name': { label: 'Metadata template' },
	'metadata.key': { label: 'Metadata key' },
	'metadata.value': { label: 'Metadata value' },
	'metadata.field_type': { label: 'Metadata field type' },
	'metadata.source': { label: 'Metadata source', enumValuesHidden: ['either'] },
	my_project_permission: { label: 'My project permission', hidden: true },
	my_folder_permission: { label: 'My folder permission', hidden: true },
	is_published: { label: 'Published', hidden: true },
	publication_date: { label: 'Publication date', hidden: true },
	expiry_date: { label: 'Expiry date' },
	metadata_is_complete: { label: 'Metadata complete' },
	has_upgradeable_metadata_templates: { label: 'Metadata template upgrade available' },
	has_file: { label: 'Has attachment', hidden: true },
	created_at: { label: 'Created' },
	updated_at: { label: 'Updated' },
};

export function applySearchFieldPresentation(
	fields: readonly EnrichedSearchField[],
	presentation: Record<string, SearchFieldPresentation> = SEARCH_FIELD_PRESENTATION,
): EnrichedSearchField[] {
	const result: EnrichedSearchField[] = [];
	for (const field of fields) {
		const entry = presentation[field.id];
		if (entry?.hidden) {
			continue;
		}
		if (!entry) {
			result.push(field);
			continue;
		}
		const hiddenEnumValues = entry.enumValuesHidden;
		const enumValues =
			hiddenEnumValues && hiddenEnumValues.length > 0
				? field.enum_values.filter((value) => !hiddenEnumValues.includes(value))
				: field.enum_values;
		if (entry.label === undefined && enumValues === field.enum_values) {
			result.push(field);
			continue;
		}
		result.push({
			...field,
			...(entry.label === undefined ? {} : { label: entry.label }),
			...(enumValues === field.enum_values ? {} : { enum_values: enumValues }),
		});
	}
	return result;
}

export function getFieldsForTypes(
	schema: SearchSchemaResponse,
	selectedTypes: readonly string[],
): EnrichedSearchField[] {
	const fieldMap = new Map<string, EnrichedSearchField>();

	for (const typeName of selectedTypes) {
		const schemaType = schema.types[typeName] as SearchSchemaType | undefined;
		if (!schemaType) {
			continue;
		}

		for (const field of schemaType.fields) {
			const existing = fieldMap.get(field.id);
			if (existing) {
				fieldMap.set(field.id, {
					...existing,
					applicableTypes: [...existing.applicableTypes, typeName as ResultType],
				});
			} else {
				fieldMap.set(field.id, {
					...field,
					applicableTypes: [typeName as ResultType],
				});
			}
		}
	}

	return applySearchFieldPresentation([...fieldMap.values()]);
}

export function getSortFieldsForTypes(schema: SearchSchemaResponse, selectedTypes: readonly string[]): string[] {
	const typeSortFields = selectedTypes
		.map((typeName) => (schema.types[typeName] as SearchSchemaType | undefined)?.sort_fields)
		.filter((fields): fields is string[] => fields !== null && fields !== undefined);

	if (typeSortFields.length === 0) {
		return [];
	}

	const [first, ...rest] = typeSortFields;
	return first!.filter((field) => rest.every((fields) => fields.includes(field)));
}

const TEXT_MATCHING_OPERATORS = ['contains', 'starts_with', 'is'];

export function hasPositiveTextInput(
	searchText: string | undefined,
	filters: readonly SearchFilterItemInput[],
	fields: readonly SearchSchemaField[],
): boolean {
	if (searchText?.trim()) {
		return true;
	}

	return filters.some((item) => {
		if (isClusterItem(item)) {
			// Cluster rows are structured key-bound matches, not full-text style filters.
			return false;
		}
		if (!isSearchFilterRowComplete(item)) {
			return false;
		}
		if (!TEXT_MATCHING_OPERATORS.includes(item.operator)) {
			return false;
		}
		const field = fields.find((candidate) => candidate.id === item.field);
		return field?.value_type === 'string';
	});
}

type DefaultSortContext = {
	readonly searchText?: string;
	readonly filters: readonly SearchFilterItemInput[];
	readonly fields: readonly SearchSchemaField[];
};

type SortRule = components['schemas']['SearchSort'];
type DefaultSortConditionSort = components['schemas']['SearchSchemaDefaultSortConditionSort'];

function toSortRules(conditionSorts: readonly DefaultSortConditionSort[]): SortRule[] {
	return conditionSorts.map((sort) => ({
		direction: sort.direction as SortRule['direction'],
		field: sort.field as SortRule['field'],
	}));
}

export function getDefaultSortForTypes(
	schema: SearchSchemaResponse,
	selectedTypes: readonly string[],
	context?: DefaultSortContext,
): SortRule[] {
	for (const typeName of selectedTypes) {
		const schemaType = schema.types[typeName] as SearchSchemaType | undefined;
		if (!schemaType) {
			continue;
		}

		if (context && schemaType.default_sort_conditions.length > 0) {
			for (const condition of schemaType.default_sort_conditions) {
				switch (condition.when) {
					case 'positive_text_input_present':
						if (hasPositiveTextInput(context.searchText, context.filters, context.fields)) {
							return toSortRules(condition.sort);
						}
						break;
					case 'otherwise':
						return toSortRules(condition.sort);
				}
			}
		}

		if (schemaType.default_sort.length > 0) {
			return schemaType.default_sort;
		}
	}

	return [];
}

type ProjectSearch = components['schemas']['ProjectSearch'];
type FolderSearch = components['schemas']['FolderSearch'];
type SubfolderSearch = components['schemas']['SubfolderSearch'];
type UploadsDatasetSearch = components['schemas']['UploadsDatasetSearch'];
type UploadsVersionSearch = components['schemas']['UploadsVersionSearch'];
type UploadsVersionFileSearch = components['schemas']['UploadsVersionFileSearch'];
type MetadataTemplateSearch = components['schemas']['MetadataTemplateSearch'];
type MetadataTemplateVersionSearch = components['schemas']['MetadataTemplateVersionSearch'];

export const GLOBAL_SEARCH_QUERY_KEY = ['global-search-schema'] as const;
export const GLOBAL_SEARCH_LIMIT = 25;
export const GLOBAL_SEARCH_COMMAND_LIMIT = 25;

export type SearchFilterConnector = 'AND' | 'OR';

export type ChoiceFilterValueState = {
	readonly selected: readonly string[];
	readonly unselected: readonly string[];
};

export type SearchFilterValue = string | string[] | ChoiceFilterValueState | boolean | null;

export function isChoiceFilterValueState(value: unknown): value is ChoiceFilterValueState {
	return (
		isRecord(value) &&
		Array.isArray(value.selected) &&
		value.selected.every((item) => typeof item === 'string') &&
		Array.isArray(value.unselected) &&
		value.unselected.every((item) => typeof item === 'string')
	);
}

export function toChoiceFilterValueState(value: SearchFilterValue): ChoiceFilterValueState {
	if (isChoiceFilterValueState(value)) {
		return {
			selected: Array.from(new Set(value.selected)),
			unselected: Array.from(new Set(value.unselected.filter((item) => !value.selected.includes(item)))),
		};
	}
	if (Array.isArray(value)) {
		return { selected: Array.from(new Set(value)), unselected: [] };
	}
	if (typeof value === 'string' && value) {
		return { selected: [value], unselected: [] };
	}
	return { selected: [], unselected: [] };
}

export type SearchFilterRowInput = {
	readonly connector?: SearchFilterConnector;
	readonly entityLabels?: Record<string, string>;
	readonly field: string;
	readonly operator: string;
	readonly value: SearchFilterValue;
};

export type SearchFilterRow = SearchFilterRowInput & {
	readonly id: string;
};

// Cluster-eligible fields bind to a single matching metadata entry on the result and live ONLY
// inside a Metadata predicate cluster. They cannot appear as top-level rows.
export const CLUSTER_ELIGIBLE_FIELDS = ['metadata.key', 'metadata.value', 'metadata.field_type'] as const;
export type ClusterEligibleField = (typeof CLUSTER_ELIGIBLE_FIELDS)[number];

export function isClusterEligibleField(field: string): field is ClusterEligibleField {
	return (CLUSTER_ELIGIBLE_FIELDS as readonly string[]).includes(field);
}

export type MetadataClusterRowInput = {
	readonly field: ClusterEligibleField;
	readonly operator: string;
	readonly unresolvedOperator?: string;
	readonly value: SearchFilterValue;
};

export type MetadataClusterRow = MetadataClusterRowInput & {
	readonly id: string;
};

export type MetadataClusterInput = {
	readonly kind: 'cluster';
	readonly connector?: SearchFilterConnector;
	readonly rows: readonly MetadataClusterRowInput[];
};

export type MetadataCluster = {
	readonly kind: 'cluster';
	readonly connector?: SearchFilterConnector;
	readonly id: string;
	readonly rows: readonly MetadataClusterRow[];
};

// Tagged union: a filter list item is either a top-level row or a cluster.
export type SearchFilterRowItemInput = SearchFilterRowInput & { readonly kind: 'row' };
export type SearchFilterRowItem = SearchFilterRow & { readonly kind: 'row' };

export type SearchFilterItemInput = SearchFilterRowItemInput | MetadataClusterInput;
export type SearchFilterItem = SearchFilterRowItem | MetadataCluster;

export function isClusterItem<Item extends { readonly kind: string }>(
	item: Item,
): item is Item & { readonly kind: 'cluster' } {
	return item.kind === 'cluster';
}

export function isRowItem<Item extends { readonly kind: string }>(item: Item): item is Item & { readonly kind: 'row' } {
	return item.kind === 'row';
}

function newId(prefix: string): string {
	return globalThis.crypto?.randomUUID?.() ?? `${prefix}-${Date.now()}-${Math.random()}`;
}

export type SearchFilterRule = {
	readonly field: string;
	readonly field_type?: string;
	readonly operator: string;
	readonly value: SearchFilterValue;
};

export type SearchFilterGroup = {
	readonly operator: SearchFilterConnector;
	readonly conditions: readonly (SearchFilterGroup | SearchFilterRule)[];
};

export type GlobalSearchCriteria = {
	readonly cursor?: string;
	readonly cursorDirection?: SearchRequestRequest['cursor_direction'];
	readonly filters: readonly SearchFilterItemInput[];
	readonly limit?: number;
	readonly responseMode?: SearchRequestRequest['response_mode'];
	readonly searchText?: string;
};

// ────────────────────────────────────────────────────────────────────────────
// Metadata predicate cluster invariants
// ────────────────────────────────────────────────────────────────────────────

function clusterEligibleFieldsInOrder(): readonly ClusterEligibleField[] {
	return CLUSTER_ELIGIBLE_FIELDS;
}

export function availableFieldsForCluster(cluster: MetadataClusterInput): readonly ClusterEligibleField[] {
	const present = new Set(cluster.rows.map((row) => row.field));
	return clusterEligibleFieldsInOrder().filter((field) => !present.has(field));
}

function defaultsForField(field: SearchSchemaField | undefined): { operator: string; value: SearchFilterValue } {
	return {
		operator: field?.operators[0] ?? '',
		value: field?.enum_values.length ? (field.enum_values[0] ?? '') : '',
	};
}

export function createClusterFromField(
	field: ClusterEligibleField,
	schemaField: SearchSchemaField | undefined,
	overrides?: { readonly connector?: SearchFilterConnector },
): MetadataCluster {
	const { operator, value } = defaultsForField(schemaField);
	return {
		kind: 'cluster',
		connector: overrides?.connector,
		id: newId('cluster'),
		rows: [{ field, id: newId('cluster-row'), operator, value }],
	};
}

export function addRowToCluster(
	cluster: MetadataCluster,
	field: ClusterEligibleField,
	schemaField: SearchSchemaField | undefined,
): MetadataCluster {
	if (!isClusterEligibleField(field)) {
		throw new Error(`Field "${field}" is not cluster-eligible.`);
	}
	if (cluster.rows.some((row) => row.field === field)) {
		throw new Error(`Cluster already contains a "${field}" row.`);
	}
	const { operator, value } = defaultsForField(schemaField);
	return {
		...cluster,
		rows: [...cluster.rows, { field, id: newId('cluster-row'), operator, value }],
	};
}

export function removeRowFromCluster(cluster: MetadataCluster, rowId: string): MetadataCluster | null {
	const nextRows = cluster.rows.filter((row) => row.id !== rowId);
	if (nextRows.length === 0) {
		return null;
	}
	return { ...cluster, rows: nextRows };
}

// Swap a cluster row's field to another cluster-eligible field, resetting its operator and value to
// the new field's defaults. Throws if the target field is not cluster-eligible or is already used.
export function swapClusterRowField(
	cluster: MetadataCluster,
	rowId: string,
	nextField: ClusterEligibleField,
	schemaField: SearchSchemaField | undefined,
): MetadataCluster {
	if (!isClusterEligibleField(nextField)) {
		throw new Error(`Field "${nextField}" is not cluster-eligible.`);
	}
	if (cluster.rows.some((row) => row.id !== rowId && row.field === nextField)) {
		throw new Error(`Cluster already contains a "${nextField}" row.`);
	}
	const { operator, value } = defaultsForField(schemaField);
	return {
		...cluster,
		rows: cluster.rows.map((row) => (row.id === rowId ? { ...row, field: nextField, operator, value } : row)),
	};
}

export function isClusterComplete(cluster: MetadataClusterInput): boolean {
	if (cluster.rows.length === 0) {
		return false;
	}
	return cluster.rows.every((row) =>
		isSearchFilterRowComplete({ field: row.field, operator: row.operator, value: row.value }),
	);
}

export function normalizeCluster(cluster: MetadataCluster, fields: readonly SearchSchemaField[]): MetadataCluster {
	const nextRows = cluster.rows.flatMap((row): MetadataClusterRow[] => {
		const field = getSearchFieldById(fields, row.field);
		if (!field) {
			return [row];
		}
		const nextOperator = field.operators.includes(row.operator) ? row.operator : (field.operators[0] ?? '');
		const nextValue =
			field.enum_values.length > 0
				? typeof row.value === 'string' && field.enum_values.includes(row.value)
					? row.value
					: (field.enum_values[0] ?? '')
				: row.value;
		return [{ ...row, operator: nextOperator, value: nextValue }];
	});
	return { ...cluster, rows: nextRows };
}

// Strip ids and React-only fields from a cluster for serialisation.
function stripClusterIds(cluster: MetadataCluster | MetadataClusterInput): MetadataClusterInput {
	return {
		kind: 'cluster',
		...(cluster.connector ? { connector: cluster.connector } : {}),
		rows: cluster.rows.map((row) => ({ field: row.field, operator: row.operator, value: row.value })),
	};
}

// Re-hydrate ids on a parsed cluster.
function hydrateCluster(cluster: MetadataClusterInput, connector: SearchFilterConnector | undefined): MetadataCluster {
	return {
		kind: 'cluster',
		...(connector ? { connector } : {}),
		id: newId('cluster'),
		rows: cluster.rows.map((row) => ({ ...row, id: newId('cluster-row') })),
	};
}

export function normalizeItemOrder(items: readonly SearchFilterItem[]): SearchFilterItem[] {
	return items.map((item, index) => {
		const connector = index === 0 ? undefined : (item.connector ?? 'AND');
		return { ...item, connector } as SearchFilterItem;
	});
}

export function stripItemIds(items: readonly SearchFilterItem[]): SearchFilterItemInput[] {
	return items.map((item, index) => {
		const connector = index === 0 ? undefined : (item.connector ?? 'AND');
		if (isClusterItem(item)) {
			const stripped = stripClusterIds(item);
			return { ...stripped, ...(connector ? { connector } : {}) };
		}
		const { entityLabels, field, operator, value } = item;
		return {
			kind: 'row',
			...(connector ? { connector } : {}),
			...(entityLabels ? { entityLabels } : {}),
			field,
			operator,
			value,
		};
	});
}

export function hydrateItems(items: readonly SearchFilterItemInput[]): SearchFilterItem[] {
	return items.map((item, index): SearchFilterItem => {
		const connector = index === 0 ? undefined : item.connector;
		if (isClusterItem(item)) {
			return hydrateCluster(item, connector);
		}
		const row: SearchFilterRowItem = {
			kind: 'row',
			...(connector ? { connector } : {}),
			...(item.entityLabels ? { entityLabels: item.entityLabels } : {}),
			field: item.field,
			id: newId('search-filter'),
			operator: item.operator,
			value: item.value,
		};
		return row;
	});
}

type SearchResultBase = {
	readonly createdAt?: string;
	readonly href?: string;
	readonly id: string;
	readonly resultType: ResultType;
	readonly subtitle?: string[];
	readonly title: string;
};

export type GlobalSearchDisplayResult =
	| (SearchResultBase & { readonly resultType: 'project'; readonly item: ProjectSearch })
	| (SearchResultBase & { readonly resultType: 'folder'; readonly item: FolderSearch })
	| (SearchResultBase & { readonly resultType: 'subfolder'; readonly item: SubfolderSearch })
	| (SearchResultBase & { readonly resultType: 'dataset'; readonly item: UploadsDatasetSearch })
	| (SearchResultBase & { readonly resultType: 'dataset_version'; readonly item: UploadsVersionSearch })
	| (SearchResultBase & { readonly resultType: 'file'; readonly item: UploadsVersionFileSearch })
	| (SearchResultBase & { readonly resultType: 'template'; readonly item: MetadataTemplateSearch })
	| (SearchResultBase & { readonly resultType: 'template_version'; readonly item: MetadataTemplateVersionSearch });

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function hasString(value: unknown): value is string {
	return typeof value === 'string' && value.length > 0;
}

export function getSearchSchemaQueryKey() {
	return GLOBAL_SEARCH_QUERY_KEY;
}

export function getSearchResultsQueryKey(criteria: {
	readonly cursor?: string;
	readonly cursorDirection?: SearchRequestRequest['cursor_direction'];
	readonly filtersParam?: string | null;
	readonly limit: number;
	readonly responseMode: SearchRequestRequest['response_mode'];
	readonly searchText?: string;
}) {
	return [
		'global-search-results',
		{
			cursor: criteria.cursor ?? null,
			cursorDirection: criteria.cursorDirection ?? 'next',
			filters: criteria.filtersParam ?? null,
			limit: criteria.limit,
			responseMode: criteria.responseMode,
			searchText: criteria.searchText?.trim() ?? '',
		},
	] as const;
}

function parseSearchFilterValue(raw: unknown, allowChoiceState = false): SearchFilterValue {
	if (raw === null) {
		return null;
	}

	if (typeof raw === 'boolean') {
		return raw;
	}

	if (Array.isArray(raw)) {
		return raw.filter((item): item is string => typeof item === 'string');
	}

	if (allowChoiceState && isChoiceFilterValueState(raw)) {
		return toChoiceFilterValueState(raw);
	}

	if (typeof raw === 'string') {
		return raw;
	}

	return '';
}

function parseClusterRow(raw: unknown, allowChoiceState: boolean): MetadataClusterRowInput | null {
	if (!isRecord(raw)) {
		return null;
	}
	const field = typeof raw.field === 'string' && isClusterEligibleField(raw.field) ? raw.field : null;
	if (!field) {
		return null;
	}
	const operator = typeof raw.operator === 'string' ? raw.operator : '';
	const value = parseSearchFilterValue(raw.value, allowChoiceState && field === 'metadata.value');
	return { field, operator, value };
}

function parseConnector(entry: Record<string, unknown>, index: number): SearchFilterConnector | undefined {
	if (index === 0) {
		return undefined;
	}
	return entry.connector === 'AND' || entry.connector === 'OR' ? entry.connector : undefined;
}

export function parseSearchFiltersParam(rawValue?: string | null): SearchFilterItemInput[] {
	if (!rawValue) {
		return [];
	}

	try {
		const parsed = JSON.parse(rawValue);
		if (!Array.isArray(parsed)) {
			return [];
		}

		return parsed.flatMap((entry, index): SearchFilterItemInput[] => {
			if (!isRecord(entry)) {
				return [];
			}
			const connector = parseConnector(entry, index);

			if (entry.kind === 'cluster') {
				const rawRows = Array.isArray(entry.rows) ? entry.rows : [];
				const allowsChoiceState = rawRows.some(
					(row) =>
						isRecord(row) &&
						row.field === 'metadata.field_type' &&
						row.operator === 'is' &&
						isChoiceFieldType(row.value),
				);
				const rows = rawRows
					.map((row) => parseClusterRow(row, allowsChoiceState))
					.filter((row): row is MetadataClusterRowInput => row !== null);
				if (rows.length === 0) {
					return [];
				}
				return [{ kind: 'cluster', ...(connector ? { connector } : {}), rows }];
			}

			const field = typeof entry.field === 'string' ? entry.field : '';
			if (isClusterEligibleField(field)) {
				// Cluster-eligible fields cannot live at the top level; drop them.
				return [];
			}
			const operator = typeof entry.operator === 'string' ? entry.operator : '';
			const value = parseSearchFilterValue(entry.value);
			const entityLabels = isRecord(entry.entityLabels) ? (entry.entityLabels as Record<string, string>) : undefined;

			return [
				{
					kind: 'row',
					...(connector ? { connector } : {}),
					...(entityLabels ? { entityLabels } : {}),
					field,
					operator,
					value,
				},
			];
		});
	} catch {
		return [];
	}
}

export function serializeSearchFiltersParam(items: readonly SearchFilterItemInput[]) {
	if (items.length === 0) {
		return null;
	}

	return JSON.stringify(
		items.map((item, index) => {
			const connector = index === 0 ? undefined : (item.connector ?? 'AND');
			if (isClusterItem(item)) {
				return {
					kind: 'cluster' as const,
					...(connector ? { connector } : {}),
					rows: item.rows.map((row) => ({ field: row.field, operator: row.operator, value: row.value })),
				};
			}
			return {
				kind: 'row' as const,
				...(connector ? { connector } : {}),
				...(item.entityLabels ? { entityLabels: item.entityLabels } : {}),
				field: item.field,
				operator: item.operator,
				value: item.value,
			};
		}),
	);
}

export function compressFiltersParam(items: readonly SearchFilterItemInput[]): string | null {
	const serialized = serializeSearchFiltersParam(items);
	if (!serialized) {
		return null;
	}

	return compressToEncodedURIComponent(serialized);
}

export function decompressFiltersParam(compressed?: string | null): SearchFilterItemInput[] {
	if (!compressed) {
		return [];
	}

	try {
		const decompressed = decompressFromEncodedURIComponent(compressed);
		return parseSearchFiltersParam(decompressed);
	} catch {
		return [];
	}
}

export function createSearchFilterRow(
	field: SearchSchemaField | undefined,
	overrides?: Partial<SearchFilterRowInput>,
): SearchFilterRow {
	const operator = overrides?.operator ?? field?.operators[0] ?? '';
	const value = overrides?.value ?? (field?.enum_values.length ? (field.enum_values[0] ?? '') : '');

	return {
		connector: overrides?.connector,
		field: overrides?.field ?? field?.id ?? '',
		id: globalThis.crypto?.randomUUID?.() ?? `search-filter-${Date.now()}-${Math.random()}`,
		operator,
		value,
	};
}

export function getSearchFieldById<Field extends SearchSchemaField>(
	fields: readonly Field[],
	fieldId: string | undefined,
): Field | undefined {
	return fields.find((field) => field.id === fieldId);
}

export function normalizeSearchFilterRow(row: SearchFilterRow, fields: readonly SearchSchemaField[]): SearchFilterRow {
	const field = getSearchFieldById(fields, row.field) ?? fields[0];
	if (!field) {
		return row;
	}

	const nextOperator = field.operators.includes(row.operator) ? row.operator : (field.operators[0] ?? '');
	const nextValue =
		field.enum_values.length > 0
			? typeof row.value === 'string' && field.enum_values.includes(row.value)
				? row.value
				: (field.enum_values[0] ?? '')
			: row.value;

	return {
		...row,
		field: field.id,
		operator: nextOperator,
		value: nextValue,
	};
}

const END_OF_DAY_OPERATORS = new Set(['lt', 'lte']);
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function appendTimeBoundary(dateString: string, endOfDay: boolean): string {
	if (!dateString || !DATE_ONLY_PATTERN.test(dateString)) {
		return dateString;
	}

	return endOfDay ? `${dateString}T23:59:59Z` : `${dateString}T00:00:00Z`;
}

export function applyDatetimeBoundary(value: SearchFilterValue, operator: string): SearchFilterValue {
	if (Array.isArray(value)) {
		return [appendTimeBoundary(value[0] ?? '', false), appendTimeBoundary(value[1] ?? '', true)];
	}

	if (typeof value === 'string') {
		return appendTimeBoundary(value, END_OF_DAY_OPERATORS.has(operator));
	}

	return value;
}

const MULTI_VALUE_OPERATORS = new Set(['in', 'not_in', 'contains_any', 'contains_all', 'contains_none', 'is_exactly']);
const EMPTY_CHECK_OPERATORS = new Set(['is_empty', 'is_not_empty']);
const RANGE_OPERATORS = new Set(['between']);

export function coerceValueForOperatorChange(
	currentValue: SearchFilterValue,
	previousOperator: string,
	nextOperator: string,
): SearchFilterValue {
	if (EMPTY_CHECK_OPERATORS.has(nextOperator)) {
		return null;
	}

	if (RANGE_OPERATORS.has(nextOperator)) {
		return ['', ''];
	}

	const wasMulti = MULTI_VALUE_OPERATORS.has(previousOperator);
	const wasRange = RANGE_OPERATORS.has(previousOperator);
	const isMulti = MULTI_VALUE_OPERATORS.has(nextOperator);

	if (!wasMulti && isMulti) {
		if (typeof currentValue === 'string' && currentValue) {
			return [currentValue];
		}
		return [];
	}

	if ((wasMulti || wasRange) && !isMulti) {
		if (Array.isArray(currentValue) && currentValue.length > 0 && !wasRange) {
			return currentValue[0]!;
		}
		return '';
	}

	if (wasMulti && isMulti) {
		return currentValue;
	}

	return currentValue;
}

export function coerceChoiceValueForOperatorChange(
	currentValue: SearchFilterValue,
	previousOperator: string,
	nextOperator: string,
): SearchFilterValue {
	if (EMPTY_CHECK_OPERATORS.has(nextOperator)) {
		return null;
	}

	if (MULTI_VALUE_OPERATORS.has(nextOperator)) {
		return toChoiceFilterValueState(currentValue);
	}

	if (isChoiceFilterValueState(currentValue)) {
		return currentValue.selected[0] ?? '';
	}

	return coerceValueForOperatorChange(currentValue, previousOperator, nextOperator);
}

export function isSearchFilterRowComplete(row: SearchFilterRowInput) {
	if (!row.field || !row.operator) {
		return false;
	}

	const { value } = row;

	if (value === null) {
		return true;
	}

	if (typeof value === 'boolean') {
		return true;
	}

	if (Array.isArray(value)) {
		return value.length > 0;
	}

	if (isChoiceFilterValueState(value)) {
		return value.selected.length > 0 || value.unselected.length > 0;
	}

	return value.trim().length > 0;
}

function createTopLevelRule(row: SearchFilterRowInput): SearchFilterRule {
	return {
		field: row.field,
		operator: row.operator,
		value: row.value,
	};
}

function createClusterRule(
	row: MetadataClusterRowInput,
	inferredType: MetadataValueFieldType | undefined,
): SearchFilterRule {
	const fieldType = row.field === 'metadata.value' ? inferredType : undefined;
	return {
		field: row.field,
		...(fieldType ? { field_type: fieldType } : {}),
		operator: row.operator,
		value: row.value,
	};
}

function clusterToGroupNode(cluster: MetadataClusterInput): SearchFilterGroup {
	const inferredType = clusterContext(cluster.rows).inferredFieldType;
	return {
		operator: 'AND',
		conditions: cluster.rows.map((row) => createClusterRule(row, inferredType)),
	};
}

function itemToConditionNode(item: SearchFilterItemInput): SearchFilterGroup | SearchFilterRule {
	if (isClusterItem(item)) {
		return clusterToGroupNode(item);
	}
	return createTopLevelRule(item);
}

function isSearchFilterGroupNode(node: SearchFilterGroup | SearchFilterRule): node is SearchFilterGroup {
	return 'conditions' in node;
}

function filterCompleteItems(items: readonly SearchFilterItemInput[]): SearchFilterItemInput[] {
	const usable: SearchFilterItemInput[] = [];
	for (const item of items) {
		if (isClusterItem(item)) {
			const completeRows = item.rows.filter((row) =>
				isSearchFilterRowComplete({ field: row.field, operator: row.operator, value: row.value }),
			);
			if (completeRows.length === 0) {
				continue;
			}
			usable.push({ ...item, rows: completeRows });
			continue;
		}
		if (isSearchFilterRowComplete(item)) {
			usable.push(item);
		}
	}
	return usable;
}

export function buildSearchFilterGroup(items: readonly SearchFilterItemInput[]): SearchFilterGroup | null {
	const completeItems = filterCompleteItems(items);
	if (completeItems.length === 0) {
		return null;
	}

	const [firstItem, ...remaining] = completeItems;
	if (!firstItem) {
		return null;
	}

	// A cluster's condition node is already an AND group — reuse it as the accumulator instead of
	// double-wrapping it in another single-element AND. Top-level rows still get promoted to a
	// single-element AND group because the wire shape requires the outermost node to be a group.
	const firstNode = itemToConditionNode(firstItem);
	let group: SearchFilterGroup = isSearchFilterGroupNode(firstNode)
		? firstNode
		: { operator: 'AND', conditions: [firstNode] };

	for (const item of remaining) {
		group = {
			operator: item.connector ?? 'AND',
			conditions: [group, itemToConditionNode(item)],
		};
	}

	return group;
}

function applyDatetimeBoundaries(
	items: readonly SearchFilterItemInput[],
	fields: readonly SearchSchemaField[],
): SearchFilterItemInput[] {
	return items.map((item): SearchFilterItemInput => {
		if (isClusterItem(item)) {
			return item;
		}
		const field = getSearchFieldById(fields, item.field);
		if (field?.value_type !== 'datetime') {
			return item;
		}
		return { ...item, value: applyDatetimeBoundary(item.value, item.operator) };
	});
}

export function buildGlobalSearchRequest({
	cursor,
	cursorDirection = 'next',
	filters,
	limit = GLOBAL_SEARCH_LIMIT,
	responseMode = 'full',
	schema,
	searchText,
	selectedTypes,
}: GlobalSearchCriteria & {
	readonly schema: SearchSchemaResponse;
	readonly selectedTypes?: readonly string[];
}): SearchRequestRequest {
	const effectiveTypes = selectedTypes ?? schema.default_result_types;
	const fields = getFieldsForTypes(schema, effectiveTypes);
	const sortContext = { searchText, filters, fields };
	const defaultSort = getDefaultSortForTypes(schema, effectiveTypes, sortContext);

	const processedFilters = applyDatetimeBoundaries(filters, fields);

	return {
		cursor,
		cursor_direction: cursorDirection,
		group: buildSearchFilterGroup(processedFilters),
		limit,
		response_mode: responseMode,
		result_types: schema.default_result_types as unknown as SearchRequestRequest['result_types'],
		search_text: searchText?.trim() ? searchText.trim() : undefined,
		sort: defaultSort.map((sortRule) => ({
			direction: sortRule.direction,
			field: sortRule.field,
		})),
	};
}

export function hasGlobalSearchCriteria(criteria: {
	readonly filters: readonly SearchFilterItemInput[];
	readonly searchText?: string;
}) {
	if (criteria.searchText?.trim()) {
		return true;
	}
	return filterCompleteItems(criteria.filters).length > 0;
}

export function isSearchSchemaResponse(value: unknown): value is SearchSchemaResponse {
	return isRecord(value) && Array.isArray(value.default_result_types) && isRecord(value.types);
}

function getScopeLines(assignedTo: { result_type?: string; name?: string } | null | undefined): string[] {
	if (!assignedTo?.result_type || !assignedTo.name) {
		return ['Global'];
	}

	if (assignedTo.result_type === 'project') {
		return [`Project: ${assignedTo.name}`];
	}

	if (assignedTo.result_type === 'folder') {
		return [`Folder: ${assignedTo.name}`];
	}

	return [assignedTo.name];
}

function getDatasetLink(item: UploadsDatasetSearch) {
	if (hasString(item.folder?.project?.pk) && hasString(item.folder?.pk)) {
		return `/projects/${item.folder.project.pk}/folders/${item.folder.pk}/files/${item.pk}`;
	}

	return `/drafts/${item.pk}`;
}

function getDatasetVersionLink(item: UploadsVersionSearch) {
	return `/drafts/${item.dataset.pk}?version=${item.pk}`;
}

function toDisplayResult(result: {
	readonly result_type: ResultType;
	readonly item: unknown;
}): GlobalSearchDisplayResult | null {
	if (!isRecord(result.item) || !hasString(result.result_type)) {
		return null;
	}

	switch (result.result_type) {
		case 'project': {
			const item = result.item as ProjectSearch;

			return {
				createdAt: item.creation_date,
				href: `/projects/${item.pk}`,
				id: item.pk,
				item,
				resultType: 'project',
				subtitle: item.created_by?.email ? [item.created_by.email] : undefined,
				title: item.name,
			};
		}
		case 'folder': {
			const item = result.item as FolderSearch;

			return {
				createdAt: item.creation_date,
				href: hasString(item.project?.pk) ? `/projects/${item.project.pk}/folders/${item.pk}` : undefined,
				id: item.pk,
				item,
				resultType: 'folder',
				subtitle: item.project?.name ? [`Project: ${item.project.name}`] : undefined,
				title: item.name,
			};
		}
		case 'subfolder': {
			const item = result.item as SubfolderSearch;
			const projectPk = item.folder?.project?.pk;
			const metadata = item.metadata
				.map(
					(entry) =>
						`${entry.custom_key ?? ''}: ${Array.isArray(entry.value) ? entry.value.join(', ') : String(entry.value ?? '')}`,
				)
				.join(' · ');

			return {
				createdAt: item.creation_date,
				href: hasString(projectPk)
					? `/projects/${projectPk}/folders/${item.folder.pk}?subfolder=${item.pk}`
					: undefined,
				id: item.pk,
				item,
				resultType: 'subfolder',
				subtitle: [
					`Project: ${item.folder?.project?.name ?? ''}`,
					`Folder: ${[item.folder?.name, ...item.path.map((entry) => entry.name)].join(' / ')}`,
					...(metadata ? [`Metadata: ${metadata}`] : []),
				],
				title: item.name,
			};
		}
		case 'dataset': {
			const item = result.item as UploadsDatasetSearch;
			const projectName = item.folder?.project?.name;
			const folderName = item.folder?.name;

			return {
				createdAt: item.creation_date,
				href: getDatasetLink(item),
				id: item.pk,
				item,
				resultType: 'dataset',
				subtitle: projectName && folderName ? [`Project: ${projectName}`, `Folder: ${folderName}`] : ['Draft dataset'],
				title: item.display_name ?? item.name ?? 'Untitled dataset',
			};
		}
		case 'dataset_version': {
			const item = result.item as UploadsVersionSearch;
			const datasetName = item.dataset.name ?? 'dataset';
			const projectName = item.dataset.folder?.project?.name;
			const folderName = item.dataset.folder?.name;

			return {
				createdAt: item.creation_date,
				href: getDatasetVersionLink(item),
				id: item.pk,
				item,
				resultType: 'dataset_version',
				subtitle:
					projectName && folderName
						? [`Project: ${projectName}`, `Folder: ${folderName}`, `Dataset: ${datasetName}`]
						: [`Dataset: ${datasetName}`],
				title: item.name ?? item.version_file?.name ?? 'Dataset version',
			};
		}
		case 'file': {
			const item = result.item as UploadsVersionFileSearch;
			const latestVersion = item.uploads_versions?.[0];
			const datasetPk = latestVersion?.dataset?.pk;
			const versionPk = latestVersion?.pk;
			const href =
				hasString(datasetPk) && hasString(versionPk) ? `/drafts/${datasetPk}?version=${versionPk}` : undefined;
			const datasetName = latestVersion?.dataset?.name;
			const versionName = latestVersion?.name;
			const subtitleLines = [
				...(datasetName ? [`Dataset: ${datasetName}`] : []),
				...(versionName ? [`Version: ${versionName}`] : []),
			];

			return {
				createdAt: item.creation_date,
				href,
				id: item.pk,
				item,
				resultType: 'file',
				subtitle: subtitleLines.length > 0 ? subtitleLines : undefined,
				title: item.name,
			};
		}
		case 'template': {
			const item = result.item as MetadataTemplateSearch;
			const scopeLines = getScopeLines(item.assigned_to);

			return {
				createdAt: undefined,
				href: `/metadata-templates/${item.pk}`,
				id: item.pk,
				item,
				resultType: 'template',
				subtitle: scopeLines.length > 0 ? scopeLines : undefined,
				title: item.name,
			};
		}
		case 'template_version': {
			const item = result.item as MetadataTemplateVersionSearch;
			const templatePk = item.template?.pk;
			const templateName = item.template?.name;
			const scopeLines = getScopeLines(item.assigned_to);
			const subtitleLines = [...scopeLines, ...(templateName ? [`Template: ${templateName}`] : [])];

			return {
				createdAt: undefined,
				href: hasString(templatePk) ? `/metadata-templates/${templatePk}?version=${item.pk}` : undefined,
				id: item.pk,
				item,
				resultType: 'template_version',
				subtitle: subtitleLines.length > 0 ? subtitleLines : undefined,
				title: item.name ?? templateName ?? 'Template version',
			};
		}
		default:
			return null;
	}
}

export function getGlobalSearchDisplayResults(response: SearchResponse | CompactSearchResponse | null | undefined) {
	return (
		response?.results.flatMap((result) => {
			const displayResult = toDisplayResult(result);
			return displayResult ? [displayResult] : [];
		}) ?? []
	);
}

export function getCommandMenuSearchSections(results: readonly GlobalSearchDisplayResult[]) {
	return {
		datasets: results.filter((result) => result.resultType === 'dataset' && result.href),
		folders: results.filter((result) => result.resultType === 'folder' && result.href),
		projects: results.filter((result) => result.resultType === 'project' && result.href),
		templates: results.filter((result) => result.resultType === 'template' && result.href),
	};
}

export function getSearchFieldValueOptions(field: SearchSchemaField | undefined) {
	return field?.enum_values ?? [];
}
