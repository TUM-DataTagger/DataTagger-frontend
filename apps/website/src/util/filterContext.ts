import { keepPreviousData, useQueries } from '@tanstack/react-query';
import { $api } from '@/util/clientFetch';
import {
	isClusterItem,
	type MetadataClusterRowInput,
	type SearchFilterItemInput,
	type SearchFilterRowInput,
} from '@/util/globalSearch';

export type ScalarFieldType = 'TEXT' | 'INTEGER' | 'DECIMAL' | 'DATE' | 'DATETIME' | 'TIME';
export type ChoiceFieldType = 'SELECTION' | 'MULTI_SELECTION' | 'TAG';
export type MetadataValueFieldType = ScalarFieldType | ChoiceFieldType;

const SCALAR_FIELD_TYPES = new Set<string>(['TEXT', 'INTEGER', 'DECIMAL', 'DATE', 'DATETIME', 'TIME']);
const CHOICE_FIELD_TYPES = new Set<string>(['SELECTION', 'MULTI_SELECTION', 'TAG']);

export function isChoiceFieldType(value: unknown): value is ChoiceFieldType {
	return typeof value === 'string' && CHOICE_FIELD_TYPES.has(value);
}

export type MetadataKeyScopeKind = 'project' | 'folder' | 'dataset' | 'template';

export type MetadataKeyScope = {
	readonly projectIds: readonly string[];
	readonly folderIds: readonly string[];
	readonly datasetIds: readonly string[];
	readonly templateIds: readonly string[];
	readonly projectNames: readonly string[];
	readonly folderNames: readonly string[];
	readonly datasetNames: readonly string[];
	readonly templateNames: readonly string[];
};

const SCOPE_FIELD_TO_KIND: Record<string, { readonly kind: MetadataKeyScopeKind; readonly by: 'id' | 'name' }> = {
	project_id: { kind: 'project', by: 'id' },
	project_name: { kind: 'project', by: 'name' },
	folder_id: { kind: 'folder', by: 'id' },
	folder_name: { kind: 'folder', by: 'name' },
	dataset_id: { kind: 'dataset', by: 'id' },
	dataset_name: { kind: 'dataset', by: 'name' },
	'metadata.template_id': { kind: 'template', by: 'id' },
	'metadata.template_name': { kind: 'template', by: 'name' },
};

function extractScopeValues(row: { readonly operator: string; readonly value: unknown }): readonly string[] {
	if (row.operator === 'is' && typeof row.value === 'string' && row.value !== '') {
		return [row.value];
	}
	if (row.operator === 'in' && Array.isArray(row.value)) {
		return row.value.filter((v): v is string => typeof v === 'string' && v !== '');
	}
	return [];
}

function getScopeFromTopLevelRows(rows: readonly SearchFilterRowInput[]): MetadataKeyScope | undefined {
	const projectIds: string[] = [];
	const folderIds: string[] = [];
	const datasetIds: string[] = [];
	const templateIds: string[] = [];
	const projectNames: string[] = [];
	const folderNames: string[] = [];
	const datasetNames: string[] = [];
	const templateNames: string[] = [];

	for (const row of rows) {
		const match = SCOPE_FIELD_TO_KIND[row.field];
		if (!match) {
			continue;
		}
		const values = extractScopeValues(row);
		if (values.length === 0) {
			continue;
		}
		if (match.kind === 'project') {
			(match.by === 'id' ? projectIds : projectNames).push(...values);
		} else if (match.kind === 'folder') {
			(match.by === 'id' ? folderIds : folderNames).push(...values);
		} else if (match.kind === 'dataset') {
			(match.by === 'id' ? datasetIds : datasetNames).push(...values);
		} else {
			(match.by === 'id' ? templateIds : templateNames).push(...values);
		}
	}

	if (
		projectIds.length === 0 &&
		folderIds.length === 0 &&
		datasetIds.length === 0 &&
		templateIds.length === 0 &&
		projectNames.length === 0 &&
		folderNames.length === 0 &&
		datasetNames.length === 0 &&
		templateNames.length === 0
	) {
		return undefined;
	}

	return {
		projectIds,
		folderIds,
		datasetIds,
		templateIds,
		projectNames,
		folderNames,
		datasetNames,
		templateNames,
	};
}

export type ClusterContext = {
	readonly inferredFieldType: MetadataValueFieldType | undefined;
};

// Per-cluster Narrowing signal: reads only the cluster's own metadata.field_type row.
// Strict cluster invariants forbid duplicate fields inside a cluster, so the "two field_type
// rows means transient ambiguity" guard from the old whole-set implementation is unnecessary
// here — do not reintroduce it.
export function clusterContext(rows: readonly MetadataClusterRowInput[]): ClusterContext {
	const signal = rows.find((row) => row.field === 'metadata.field_type');
	if (
		!signal ||
		signal.operator !== 'is' ||
		typeof signal.value !== 'string' ||
		(!SCALAR_FIELD_TYPES.has(signal.value) && !CHOICE_FIELD_TYPES.has(signal.value))
	) {
		return { inferredFieldType: undefined };
	}
	return { inferredFieldType: signal.value as MetadataValueFieldType };
}

export function getBoundedMetadataKeys(rows: readonly MetadataClusterRowInput[]): string[] {
	const keyRow = rows.find((row) => row.field === 'metadata.key');
	if (!keyRow) {
		return [];
	}

	if (keyRow.operator === 'is' && typeof keyRow.value === 'string' && keyRow.value.trim()) {
		return [keyRow.value];
	}

	if (keyRow.operator === 'in' && Array.isArray(keyRow.value)) {
		return Array.from(
			new Set(keyRow.value.filter((value): value is string => typeof value === 'string' && value.trim().length > 0)),
		);
	}

	return [];
}

export type FilterContext = {
	readonly scope: MetadataKeyScope | undefined;
	cluster(clusterId: string): ClusterContext;
};

const EMPTY_CLUSTER_CONTEXT: ClusterContext = { inferredFieldType: undefined };

export function filterContext(items: readonly SearchFilterItemInput[]): FilterContext {
	const topLevelRows = items.filter((item): item is SearchFilterRowInput & { kind: 'row' } => !isClusterItem(item));
	const scope = getScopeFromTopLevelRows(topLevelRows);
	const clusterById = new Map<string, ClusterContext>();
	for (const item of items) {
		if (!isClusterItem(item)) {
			continue;
		}
		// Cluster id is only present on hydrated MetadataCluster — keyed lookups apply to UI state.
		const id = (item as { readonly id?: string }).id;
		if (typeof id !== 'string') {
			continue;
		}
		clusterById.set(id, clusterContext(item.rows));
	}
	return {
		scope,
		cluster: (id: string) => clusterById.get(id) ?? EMPTY_CLUSTER_CONTEXT,
	};
}

// Distinct from MetadataKeyScope — only contains ids that have survived name→PK resolution.
// Keep separate to document the resolution boundary.
export type ResolvedScope = {
	readonly projectIds: readonly string[];
	readonly folderIds: readonly string[];
	readonly datasetIds: readonly string[];
	readonly templateIds: readonly string[];
};

const EMPTY_NAMES: readonly string[] = [];

export function useResolvedScope(scope: MetadataKeyScope | undefined): ResolvedScope {
	const projectNames = scope?.projectNames ?? EMPTY_NAMES;
	const folderNames = scope?.folderNames ?? EMPTY_NAMES;
	const datasetNames = scope?.datasetNames ?? EMPTY_NAMES;
	const templateNames = scope?.templateNames ?? EMPTY_NAMES;

	const projectQueries = useQueries({
		queries: projectNames.map((name) => ({
			...$api.queryOptions('get', '/api/v1/project/', { params: { query: { search: name } } }),
			placeholderData: keepPreviousData,
		})),
	});
	const folderQueries = useQueries({
		queries: folderNames.map((name) => ({
			...$api.queryOptions('get', '/api/v1/folder/', { params: { query: { search: name } } }),
			placeholderData: keepPreviousData,
		})),
	});
	const datasetQueries = useQueries({
		queries: datasetNames.map((name) => ({
			...$api.queryOptions('get', '/api/v1/uploads-dataset/', { params: { query: { search: name } } }),
			placeholderData: keepPreviousData,
		})),
	});
	const templateQueries = useQueries({
		queries: templateNames.map((name) => ({
			...$api.queryOptions('get', '/api/v1/metadata-template-container/', { params: { query: { search: name } } }),
			placeholderData: keepPreviousData,
		})),
	});

	// Names are not unique server-side — return every exact-name PK, the endpoint unions them.
	const resolvedFromNames = (
		names: readonly string[],
		queries: readonly { data?: { results?: readonly { name?: string | null; pk: string }[] } }[],
	): readonly string[] =>
		names.flatMap(
			(name, idx) =>
				queries[idx]?.data?.results?.filter((entity) => entity.name === name).map((entity) => entity.pk) ?? [],
		);

	return {
		projectIds: [...(scope?.projectIds ?? []), ...resolvedFromNames(projectNames, projectQueries)],
		folderIds: [...(scope?.folderIds ?? []), ...resolvedFromNames(folderNames, folderQueries)],
		datasetIds: [...(scope?.datasetIds ?? []), ...resolvedFromNames(datasetNames, datasetQueries)],
		templateIds: [...(scope?.templateIds ?? []), ...resolvedFromNames(templateNames, templateQueries)],
	};
}
