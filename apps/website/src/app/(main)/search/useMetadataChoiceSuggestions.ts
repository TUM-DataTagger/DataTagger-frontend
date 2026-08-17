'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { $api } from '@/util/clientFetch';
import { type ChoiceFieldType, type MetadataKeyScope, useResolvedScope } from '@/util/filterContext';
import type { components } from '@/util/openapiSchema';

type ChoiceOptionGroup = components['schemas']['SearchMetadataChoiceOptionGroup'];

export type MetadataChoiceSuggestionGroup = Omit<ChoiceOptionGroup, 'options'> & {
	readonly id: string;
	readonly options: readonly { readonly id: string; readonly value: string }[];
};

function buildChoiceOptionsQuery(
	keys: readonly string[],
	fieldType: ChoiceFieldType,
	resolved: ReturnType<typeof useResolvedScope>,
) {
	return {
		field_type: fieldType,
		key: [...keys],
		...(resolved.projectIds.length > 0 ? { project_id: [...resolved.projectIds] } : {}),
		...(resolved.folderIds.length > 0 ? { folder_id: [...resolved.folderIds] } : {}),
		...(resolved.datasetIds.length > 0 ? { dataset_id: [...resolved.datasetIds] } : {}),
		...(resolved.templateIds.length > 0 ? { template_id: [...resolved.templateIds] } : {}),
	};
}

function decorateGroups(groups: readonly ChoiceOptionGroup[]): {
	readonly groups: readonly MetadataChoiceSuggestionGroup[];
	readonly idToValue: ReadonlyMap<string, string>;
} {
	const idToValue = new Map<string, string>();
	const decorated = groups.map((group) => {
		const groupId = [group.key, group.source, group.source_id, group.metadata_template_field_id]
			.map(encodeURIComponent)
			.join(':');
		return {
			...group,
			id: groupId,
			options: group.options.map((value, index) => {
				const id = `${groupId}:${index}`;
				idToValue.set(id, value);
				return { id, value };
			}),
		};
	});
	return { groups: decorated, idToValue };
}

const EMPTY_GROUPS: readonly MetadataChoiceSuggestionGroup[] = [];
const EMPTY_ID_MAP: ReadonlyMap<string, string> = new Map();

export function useMetadataChoiceSuggestions(args: {
	readonly enabled: boolean;
	readonly fieldType: ChoiceFieldType;
	readonly keys: readonly string[];
	readonly scope?: MetadataKeyScope;
}) {
	const enabled = args.enabled && args.keys.length > 0;
	const resolved = useResolvedScope(enabled ? args.scope : undefined);
	const query = useQuery({
		...$api.queryOptions('get', '/api/v1/search/metadata-choice-options/', {
			params: { query: buildChoiceOptionsQuery(args.keys, args.fieldType, resolved) },
		}),
		enabled,
	});

	const decorated = useMemo(
		() => (query.data ? decorateGroups(query.data.results) : { groups: EMPTY_GROUPS, idToValue: EMPTY_ID_MAP }),
		[query.data],
	);
	return {
		...decorated,
		isError: enabled && query.isError,
		isLoading: enabled && query.isFetching,
	};
}
