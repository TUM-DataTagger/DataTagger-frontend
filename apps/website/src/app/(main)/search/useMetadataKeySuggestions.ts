'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { $api } from '@/util/clientFetch';
import { type MetadataKeyScope, type ResolvedScope, useResolvedScope } from '@/util/filterContext';
import type { components } from '@/util/openapiSchema';

type SearchMetadataKey = components['schemas']['SearchMetadataKey'];
type SourceEnum = components['schemas']['SourceEnum'];

export type MetadataKeySuggestionGroup = {
	readonly source: SourceEnum;
	readonly sourceLabel: string;
	readonly keys: readonly { readonly id: string; readonly suggestion: SearchMetadataKey }[];
};

export type MetadataKeySuggestionGroups = readonly MetadataKeySuggestionGroup[];

const SOURCE_LABEL: Record<SourceEnum, string> = {
	project: 'Project',
	folder: 'Folder',
	dataset: 'Dataset',
	template: 'Template',
};

function buildMetadataKeysQuery(resolved: ResolvedScope): {
	project_id?: string[];
	folder_id?: string[];
	dataset_id?: string[];
	template_id?: string[];
} {
	const query: { project_id?: string[]; folder_id?: string[]; dataset_id?: string[]; template_id?: string[] } = {};
	if (resolved.projectIds.length > 0) {
		query.project_id = [...resolved.projectIds];
	}
	if (resolved.folderIds.length > 0) {
		query.folder_id = [...resolved.folderIds];
	}
	if (resolved.datasetIds.length > 0) {
		query.dataset_id = [...resolved.datasetIds];
	}
	if (resolved.templateIds.length > 0) {
		query.template_id = [...resolved.templateIds];
	}
	return query;
}

function hasAnyResolvedId(resolved: ResolvedScope): boolean {
	return (
		resolved.projectIds.length > 0 ||
		resolved.folderIds.length > 0 ||
		resolved.datasetIds.length > 0 ||
		resolved.templateIds.length > 0
	);
}

type GroupAccumulator = {
	readonly source: SourceEnum;
	readonly sourceLabel: string;
	readonly keys: { readonly id: string; readonly suggestion: SearchMetadataKey }[];
};

function buildGroupsAndIdMap(suggestions: readonly SearchMetadataKey[]): {
	readonly groups: MetadataKeySuggestionGroups;
	readonly idToKey: ReadonlyMap<string, string>;
} {
	const order: SourceEnum[] = [];
	const buckets = new Map<SourceEnum, GroupAccumulator>();
	const idToKey = new Map<string, string>();

	for (const [index, suggestion] of suggestions.entries()) {
		let bucket = buckets.get(suggestion.source);
		if (!bucket) {
			bucket = { source: suggestion.source, sourceLabel: SOURCE_LABEL[suggestion.source], keys: [] };
			buckets.set(suggestion.source, bucket);
			order.push(suggestion.source);
		}
		const id = `${suggestion.source}-${index}-${suggestion.key}`;
		bucket.keys.push({ id, suggestion });
		idToKey.set(id, suggestion.key);
	}

	const groups = order.map((source) => buckets.get(source)!) as MetadataKeySuggestionGroups;
	return { groups, idToKey };
}

const EMPTY_RESULT = {
	groups: [] as MetadataKeySuggestionGroups,
	idToKey: new Map<string, string>() as ReadonlyMap<string, string>,
};

export function useMetadataKeySuggestions(scope: MetadataKeyScope | undefined): {
	readonly groups: MetadataKeySuggestionGroups;
	readonly idToKey: ReadonlyMap<string, string>;
} {
	const resolved = useResolvedScope(scope);
	const enabled = hasAnyResolvedId(resolved);

	const { data } = useQuery({
		...$api.queryOptions('get', '/api/v1/search/metadata-keys/', {
			params: { query: buildMetadataKeysQuery(resolved) },
		}),
		enabled,
		placeholderData: keepPreviousData,
	});

	if (!enabled) {
		return EMPTY_RESULT;
	}

	return buildGroupsAndIdMap(data?.results ?? []);
}
