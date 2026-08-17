import {
	hydrateItems,
	normalizeItemOrder,
	type SearchFilterItem,
	type SearchFilterItemInput,
} from '@/util/globalSearch';

export type FilterPreset = {
	readonly id: string;
	readonly label: string;
	readonly items: readonly SearchFilterItemInput[];
};

export const DEFAULT_FILTER_PRESET: FilterPreset = {
	id: 'project-folder-and-metadata-key-value',
	label: 'Metadata',
	items: [
		{ kind: 'row', field: 'project_name', operator: 'is', value: '' },
		{ kind: 'row', field: 'folder_name', operator: 'is', value: '' },
		{
			kind: 'cluster',
			rows: [
				{ field: 'metadata.key', operator: 'is', value: '' },
				{ field: 'metadata.value', operator: 'contains', value: '' },
			],
		},
	],
};

export const FILTER_PRESETS: readonly FilterPreset[] = [
	DEFAULT_FILTER_PRESET,
	{
		id: 'metadata-template-and-key',
		label: 'Metadata template',
		items: [
			{ kind: 'row', field: 'metadata.template_name', operator: 'is', value: '' },
			{
				kind: 'cluster',
				rows: [
					{ field: 'metadata.key', operator: 'is', value: '' },
					{ field: 'metadata.value', operator: 'contains', value: '' },
				],
			},
		],
	},
	{
		id: 'date-metadata-range',
		label: 'Date range',
		items: [
			{
				kind: 'cluster',
				rows: [
					{ field: 'metadata.key', operator: 'is', value: '' },
					{ field: 'metadata.field_type', operator: 'is', value: 'DATE' },
					{ field: 'metadata.value', operator: 'between', value: '' },
				],
			},
		],
	},
	{
		id: 'numeric-metadata-range',
		label: 'Numeric range',
		items: [
			{
				kind: 'cluster',
				rows: [
					{ field: 'metadata.key', operator: 'is', value: '' },
					{ field: 'metadata.field_type', operator: 'is', value: 'INTEGER' },
					{ field: 'metadata.value', operator: 'between', value: '' },
				],
			},
		],
	},
];

export function insertFilterPreset(
	currentItems: readonly SearchFilterItem[],
	preset: FilterPreset,
	mode: 'append' | 'replace',
): SearchFilterItem[] {
	const hydrated = hydrateItems(preset.items);
	const combined = mode === 'replace' ? hydrated : [...currentItems, ...hydrated];
	return normalizeItemOrder(combined);
}
