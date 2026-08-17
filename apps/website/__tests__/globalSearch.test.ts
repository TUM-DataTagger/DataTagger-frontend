import { describe, expect, it } from 'vitest';
import {
	addRowToCluster,
	applyDatetimeBoundary,
	applySearchFieldPresentation,
	availableFieldsForCluster,
	buildSearchFilterGroup,
	coerceChoiceValueForOperatorChange,
	coerceClusterMixedOperators,
	coerceOperatorForList,
	coerceValueForOperatorChange,
	compressFiltersParam,
	createClusterFromField,
	decompressFiltersParam,
	type EnrichedSearchField,
	getOperatorsForMixedField,
	getSearchOperatorOptions,
	getTypeaheadConfig,
	getCommandMenuSearchSections,
	getDefaultSortForTypes,
	getFieldsForTypes,
	getGlobalSearchDisplayResults,
	getSortFieldsForTypes,
	hasPositiveTextInput,
	isClusterComplete,
	isSearchFilterRowComplete,
	isSearchSchemaResponse,
	type MetadataCluster,
	type MetadataClusterRowInput,
	normalizeCluster,
	normalizeSearchFilterRow,
	parseSearchFiltersParam,
	removeRowFromCluster,
	type SearchFilterConnector,
	type SearchFilterItemInput,
	type SearchFilterValue,
	type SearchSchemaField,
	serializeSearchFiltersParam,
} from '@/util/globalSearch';
import type { components } from '@/util/openapiSchema';

type SearchFilterRowItemInput = SearchFilterItemInput & { readonly kind: 'row' };

function row(
	field: string,
	operator: string,
	value: SearchFilterValue,
	connector?: SearchFilterConnector,
): SearchFilterRowItemInput {
	return { kind: 'row', ...(connector ? { connector } : {}), field, operator, value };
}

function rowWithLabels(
	field: string,
	operator: string,
	value: SearchFilterValue,
	entityLabels: Record<string, string>,
	connector?: SearchFilterConnector,
): SearchFilterRowItemInput {
	return { kind: 'row', ...(connector ? { connector } : {}), entityLabels, field, operator, value };
}

function clusterItem(rows: MetadataClusterRowInput[], connector?: SearchFilterConnector): SearchFilterItemInput {
	return { kind: 'cluster', ...(connector ? { connector } : {}), rows };
}

function clusterRow(
	field: MetadataClusterRowInput['field'],
	operator: string,
	value: SearchFilterValue,
): MetadataClusterRowInput {
	return { field, operator, value };
}

type SearchSchemaResponse = components['schemas']['SearchSchemaResponse'];

describe('global search helpers', () => {
	it('round-trips serialized filters through the URL representation', () => {
		const filters = [row('status', 'eq', 'Open'), row('owner', 'contains', 'Jane', 'OR')];

		const serialized = serializeSearchFiltersParam(filters);

		expect(serialized).toBe(
			'[{"kind":"row","field":"status","operator":"eq","value":"Open"},{"kind":"row","connector":"OR","field":"owner","operator":"contains","value":"Jane"}]',
		);
		expect(parseSearchFiltersParam(serialized)).toEqual(filters);
	});

	it('round-trips boolean values through serialization', () => {
		const filters = [row('is_published', 'is', true)];

		const serialized = serializeSearchFiltersParam(filters);
		expect(parseSearchFiltersParam(serialized)).toEqual(filters);
	});

	it('round-trips null values through serialization (empty operators)', () => {
		const filters = [row('created_at', 'is_empty', null)];

		const serialized = serializeSearchFiltersParam(filters);
		expect(parseSearchFiltersParam(serialized)).toEqual(filters);
	});

	it('round-trips string array values through serialization (in/not_in)', () => {
		const filters = [row('project_id', 'in', ['uuid-1', 'uuid-2'])];

		const serialized = serializeSearchFiltersParam(filters);
		expect(parseSearchFiltersParam(serialized)).toEqual(filters);
	});

	it('rejects choice-state objects outside choice-typed metadata value rows', () => {
		const choiceState = { selected: ['A'], unselected: ['B'] };
		const raw = JSON.stringify([
			{ kind: 'row', field: 'project_id', operator: 'in', value: choiceState },
			{
				kind: 'cluster',
				rows: [
					{ field: 'metadata.field_type', operator: 'is', value: 'TEXT' },
					{ field: 'metadata.value', operator: 'contains', value: choiceState },
				],
			},
		]);

		expect(parseSearchFiltersParam(raw)).toEqual([
			row('project_id', 'in', ''),
			clusterItem([clusterRow('metadata.field_type', 'is', 'TEXT'), clusterRow('metadata.value', 'contains', '')]),
		]);
	});

	it('accepts choice-state objects for metadata values narrowed to a choice field type', () => {
		const filters = [
			clusterItem([
				clusterRow('metadata.field_type', 'is', 'TAG'),
				clusterRow('metadata.value', 'contains_any', { selected: ['A'], unselected: ['B'] }),
			]),
		];

		expect(parseSearchFiltersParam(serializeSearchFiltersParam(filters))).toEqual(filters);
	});

	it('drops cluster-eligible fields when they appear at the top level (cluster-only invariant)', () => {
		const raw = JSON.stringify([
			{ kind: 'row', field: 'metadata.key', operator: 'is', value: 'temperature' },
			{ kind: 'row', field: 'name', operator: 'contains', value: 'report' },
		]);
		const result = parseSearchFiltersParam(raw);
		expect(result).toEqual([row('name', 'contains', 'report')]);
	});

	it('round-trips entityLabels through serialization', () => {
		const filters = [
			rowWithLabels('project_id', 'is', 'uuid-1', { 'uuid-1': 'My Project' }),
			row('name', 'contains', 'budget', 'AND'),
		];

		const serialized = serializeSearchFiltersParam(filters);
		expect(parseSearchFiltersParam(serialized)).toEqual(filters);
	});

	it('round-trips a single metadata predicate cluster', () => {
		const filters = [
			clusterItem([clusterRow('metadata.key', 'is', 'temperature'), clusterRow('metadata.value', 'gt', '30')]),
		];

		const serialized = serializeSearchFiltersParam(filters);
		expect(parseSearchFiltersParam(serialized)).toEqual(filters);
	});

	it('round-trips two clusters joined by AND with a top-level row in between', () => {
		const filters = [
			clusterItem([clusterRow('metadata.key', 'is', 'temperature'), clusterRow('metadata.value', 'gt', '30')]),
			row('project_id', 'is', 'proj-1', 'AND'),
			clusterItem([clusterRow('metadata.key', 'is', 'humidity'), clusterRow('metadata.value', 'gt', '40')], 'OR'),
		];

		const serialized = serializeSearchFiltersParam(filters);
		expect(parseSearchFiltersParam(serialized)).toEqual(filters);
	});

	it('drops a cluster entirely when its rows array is empty after parsing', () => {
		const raw = JSON.stringify([
			{ kind: 'cluster', rows: [] },
			{ kind: 'row', field: 'name', operator: 'contains', value: 'foo' },
		]);
		const result = parseSearchFiltersParam(raw);
		expect(result).toEqual([row('name', 'contains', 'foo')]);
	});

	it('builds a left-associative condition tree that preserves row order', () => {
		expect(
			buildSearchFilterGroup([
				row('status', 'eq', 'Open'),
				row('owner', 'contains', 'Jane', 'AND'),
				row('project', 'contains', 'Atlas', 'OR'),
			]),
		).toEqual({
			operator: 'OR',
			conditions: [
				{
					operator: 'AND',
					conditions: [
						{
							operator: 'AND',
							conditions: [{ field: 'status', operator: 'eq', value: 'Open' }],
						},
						{ field: 'owner', operator: 'contains', value: 'Jane' },
					],
				},
				{ field: 'project', operator: 'contains', value: 'Atlas' },
			],
		});
	});

	it('builds filter group with boolean and null values', () => {
		expect(
			buildSearchFilterGroup([row('is_published', 'is', true), row('created_at', 'is_not_empty', null, 'AND')]),
		).toEqual({
			operator: 'AND',
			conditions: [
				{
					operator: 'AND',
					conditions: [{ field: 'is_published', operator: 'is', value: true }],
				},
				{ field: 'created_at', operator: 'is_not_empty', value: null },
			],
		});
	});

	it('emits the cluster group directly as the outer AND for a single cluster', () => {
		// A single cluster's AND group is the entire request group — no degenerate single-element
		// outer wrap. (For a single top-level row, the rule is still promoted to a single-element
		// AND because a bare rule cannot be the outermost node.)
		expect(
			buildSearchFilterGroup([
				clusterItem([clusterRow('metadata.key', 'is', 'temperature'), clusterRow('metadata.value', 'gt', '30')]),
			]),
		).toEqual({
			operator: 'AND',
			conditions: [
				{ field: 'metadata.key', operator: 'is', value: 'temperature' },
				{ field: 'metadata.value', operator: 'gt', value: '30' },
			],
		});
	});

	it('emits two cluster groups as direct siblings of the outer AND (multi-key metadata search)', () => {
		// Matches the backend's canonical Multi-key Metadata Search example: each cluster is one
		// nested AND group; siblings live directly under the outer AND. No asymmetric extra wrap
		// on the first item.
		expect(
			buildSearchFilterGroup([
				clusterItem([clusterRow('metadata.key', 'is', 'temperature'), clusterRow('metadata.value', 'gt', '30')]),
				clusterItem([clusterRow('metadata.key', 'is', 'humidity'), clusterRow('metadata.value', 'gt', '40')], 'AND'),
			]),
		).toEqual({
			operator: 'AND',
			conditions: [
				{
					operator: 'AND',
					conditions: [
						{ field: 'metadata.key', operator: 'is', value: 'temperature' },
						{ field: 'metadata.value', operator: 'gt', value: '30' },
					],
				},
				{
					operator: 'AND',
					conditions: [
						{ field: 'metadata.key', operator: 'is', value: 'humidity' },
						{ field: 'metadata.value', operator: 'gt', value: '40' },
					],
				},
			],
		});
	});

	it('attaches field_type to a cluster metadata.value rule when the cluster has a narrowing signal', () => {
		expect(
			buildSearchFilterGroup([
				clusterItem([clusterRow('metadata.field_type', 'is', 'INTEGER'), clusterRow('metadata.value', 'gt', '42')]),
			]),
		).toEqual({
			operator: 'AND',
			conditions: [
				{ field: 'metadata.field_type', operator: 'is', value: 'INTEGER' },
				{ field: 'metadata.value', field_type: 'INTEGER', operator: 'gt', value: '42' },
			],
		});
	});

	it.each(['contains_any', 'contains_all', 'contains_none', 'is_exactly'])(
		'serializes literal-only TAG value sets for %s',
		(operator) => {
			expect(
				buildSearchFilterGroup([
					clusterItem([
						clusterRow('metadata.field_type', 'is', 'TAG'),
						clusterRow('metadata.value', operator, {
							selected: ['First', 'Third'],
							unselected: ['Second'],
						}),
					]),
				]),
			).toEqual({
				operator: 'AND',
				conditions: [
					{ field: 'metadata.field_type', operator: 'is', value: 'TAG' },
					{
						field: 'metadata.value',
						field_type: 'TAG',
						operator,
						value: { selected: ['First', 'Third'], unselected: ['Second'] },
					},
				],
			});
		},
	);

	it('preserves padded legacy choice literals in emitted search rules', () => {
		expect(
			buildSearchFilterGroup([
				clusterItem([
					clusterRow('metadata.field_type', 'is', 'TAG'),
					clusterRow('metadata.value', 'contains_any', { selected: [' legacy '], unselected: [] }),
				]),
			]),
		).toEqual({
			operator: 'AND',
			conditions: [
				{ field: 'metadata.field_type', operator: 'is', value: 'TAG' },
				{
					field: 'metadata.value',
					field_type: 'TAG',
					operator: 'contains_any',
					value: { selected: [' legacy '], unselected: [] },
				},
			],
		});
	});

	it('serializes empty choice checks without a value token', () => {
		expect(
			buildSearchFilterGroup([
				clusterItem([
					clusterRow('metadata.field_type', 'is', 'SELECTION'),
					clusterRow('metadata.value', 'is_empty', null),
				]),
			]),
		).toEqual({
			operator: 'AND',
			conditions: [
				{ field: 'metadata.field_type', operator: 'is', value: 'SELECTION' },
				{ field: 'metadata.value', field_type: 'SELECTION', operator: 'is_empty', value: null },
			],
		});
	});

	it('omits an unresolved choice value row without blocking complete sibling filters', () => {
		expect(
			buildSearchFilterGroup([
				clusterItem([
					clusterRow('metadata.field_type', 'is', 'SELECTION'),
					clusterRow('metadata.value', '', ['First', 'Third']),
				]),
				row('project_id', 'is', 'project-1', 'AND'),
			]),
		).toEqual({
			operator: 'AND',
			conditions: [
				{
					operator: 'AND',
					conditions: [{ field: 'metadata.field_type', operator: 'is', value: 'SELECTION' }],
				},
				{ field: 'project_id', operator: 'is', value: 'project-1' },
			],
		});
	});

	it('omits field_type on a cluster metadata.value rule when the cluster has no narrowing signal', () => {
		expect(buildSearchFilterGroup([clusterItem([clusterRow('metadata.value', 'contains', 'foo')])])).toEqual({
			operator: 'AND',
			conditions: [{ field: 'metadata.value', operator: 'contains', value: 'foo' }],
		});
	});

	it('narrowing in one cluster does not leak to a sibling cluster', () => {
		expect(
			buildSearchFilterGroup([
				clusterItem([clusterRow('metadata.field_type', 'is', 'INTEGER'), clusterRow('metadata.value', 'gt', '42')]),
				clusterItem([clusterRow('metadata.value', 'contains', 'foo')], 'AND'),
			]),
		).toEqual({
			operator: 'AND',
			conditions: [
				{
					operator: 'AND',
					conditions: [
						{ field: 'metadata.field_type', operator: 'is', value: 'INTEGER' },
						{ field: 'metadata.value', field_type: 'INTEGER', operator: 'gt', value: '42' },
					],
				},
				{
					operator: 'AND',
					conditions: [{ field: 'metadata.value', operator: 'contains', value: 'foo' }],
				},
			],
		});
	});

	it('excludes incomplete rows from filter group (empty array)', () => {
		expect(buildSearchFilterGroup([row('project_id', 'in', []), row('name', 'contains', 'test', 'AND')])).toEqual({
			operator: 'AND',
			conditions: [{ field: 'name', operator: 'contains', value: 'test' }],
		});
	});

	it('drops incomplete cluster rows from the nested group and drops a fully-incomplete cluster', () => {
		const group = buildSearchFilterGroup([
			clusterItem([clusterRow('metadata.key', 'is', 'temperature'), clusterRow('metadata.value', 'gt', '')]),
			clusterItem([clusterRow('metadata.key', 'is', ''), clusterRow('metadata.value', 'gt', '')], 'AND'),
			row('name', 'contains', 'foo', 'AND'),
		]);

		expect(group).toEqual({
			operator: 'AND',
			conditions: [
				{
					operator: 'AND',
					conditions: [{ field: 'metadata.key', operator: 'is', value: 'temperature' }],
				},
				{ field: 'name', operator: 'contains', value: 'foo' },
			],
		});
	});

	it('resets incompatible operator and enum value when a field changes', () => {
		expect(
			normalizeSearchFilterRow(
				{
					connector: 'AND',
					field: 'status',
					id: 'row-1',
					operator: 'contains',
					value: 'Ready',
				},
				[
					{
						description: 'Status',
						enum_values: ['Open', 'Closed'],
						id: 'status',
						metadata_only: false,
						operators: ['eq'],
						operators_by_field_type: {},
						value_type: 'string',
					},
				],
			),
		).toEqual({
			connector: 'AND',
			field: 'status',
			id: 'row-1',
			operator: 'eq',
			value: 'Open',
		});
	});

	it('does not throw when nested route fields are missing from search results', () => {
		expect(
			getGlobalSearchDisplayResults({
				count: 2,
				next_cursor: null,
				previous_cursor: null,
				results: [
					{
						item: {
							creation_date: '2024-01-01T00:00:00Z',
							name: 'Folder without project pk',
							pk: 'folder-1',
							project: {
								name: 'Project name only',
							},
						} as never,
						result_type: 'folder',
					},
					{
						item: {
							creation_date: '2024-01-01T00:00:00Z',
							name: 'Version without container pk',
							pk: 'template-version-1',
							template: {
								name: 'Container name only',
							},
						} as never,
						result_type: 'template_version',
					},
				],
			}),
		).toEqual([
			expect.objectContaining({
				href: undefined,
				id: 'folder-1',
				subtitle: ['Project: Project name only'],
				title: 'Folder without project pk',
			}),
			expect.objectContaining({
				href: undefined,
				id: 'template-version-1',
				subtitle: ['Global', 'Template: Container name only'],
				title: 'Version without container pk',
			}),
		]);
	});

	it('does not throw when file search results have malformed uploads_versions data', () => {
		expect(
			getGlobalSearchDisplayResults({
				count: 5,
				next_cursor: null,
				previous_cursor: null,
				results: [
					{
						item: {
							creation_date: '2024-01-01T00:00:00Z',
							name: 'File without versions',
							pk: 'file-1',
						} as never,
						result_type: 'file',
					},
					{
						item: {
							creation_date: '2024-01-01T00:00:00Z',
							name: 'File with null versions',
							pk: 'file-2',
							uploads_versions: null,
						} as never,
						result_type: 'file',
					},
					{
						item: {
							creation_date: '2024-01-01T00:00:00Z',
							name: 'File with object versions',
							pk: 'file-3',
							uploads_versions: { pk: 'version-3' },
						} as never,
						result_type: 'file',
					},
					{
						item: {
							creation_date: '2024-01-01T00:00:00Z',
							name: 'File with empty versions',
							pk: 'file-4',
							uploads_versions: [],
						} as never,
						result_type: 'file',
					},
					{
						item: {
							creation_date: '2024-01-01T00:00:00Z',
							name: 'File with incomplete version',
							pk: 'file-5',
							uploads_versions: [{ pk: 'version-5' }],
						} as never,
						result_type: 'file',
					},
				],
			}),
		).toEqual([
			expect.objectContaining({
				href: undefined,
				id: 'file-1',
				subtitle: undefined,
				title: 'File without versions',
			}),
			expect.objectContaining({
				href: undefined,
				id: 'file-2',
				subtitle: undefined,
				title: 'File with null versions',
			}),
			expect.objectContaining({
				href: undefined,
				id: 'file-3',
				subtitle: undefined,
				title: 'File with object versions',
			}),
			expect.objectContaining({
				href: undefined,
				id: 'file-4',
				subtitle: undefined,
				title: 'File with empty versions',
			}),
			expect.objectContaining({
				href: undefined,
				id: 'file-5',
				subtitle: undefined,
				title: 'File with incomplete version',
			}),
		]);
	});

	it('produces dataset and version name subtitles for file search results', () => {
		expect(
			getGlobalSearchDisplayResults({
				count: 2,
				next_cursor: null,
				previous_cursor: null,
				results: [
					{
						item: {
							creation_date: '2024-01-01T00:00:00Z',
							name: 'report.pdf',
							pk: 'file-a',
							uploads_versions: [
								{
									pk: 'version-a',
									name: 'Version 1',
									dataset: { pk: 'dataset-a', name: 'My Dataset' },
								},
							],
						} as never,
						result_type: 'file',
					},
					{
						item: {
							creation_date: '2024-01-01T00:00:00Z',
							name: 'image.png',
							pk: 'file-b',
							uploads_versions: [
								{
									pk: 'version-b',
									name: null,
									dataset: { pk: 'dataset-b', name: 'Another Dataset' },
								},
							],
						} as never,
						result_type: 'file',
					},
				],
			}),
		).toEqual([
			expect.objectContaining({
				href: '/drafts/dataset-a?version=version-a',
				id: 'file-a',
				subtitle: ['Dataset: My Dataset', 'Version: Version 1'],
				title: 'report.pdf',
			}),
			expect.objectContaining({
				href: '/drafts/dataset-b?version=version-b',
				id: 'file-b',
				subtitle: ['Dataset: Another Dataset'],
				title: 'image.png',
			}),
		]);
	});

	it('shows Global subtitle for unassigned templates and template versions', () => {
		expect(
			getGlobalSearchDisplayResults({
				count: 2,
				next_cursor: null,
				previous_cursor: null,
				results: [
					{
						item: {
							name: 'Unassigned Template',
							pk: 'template-1',
							assigned_to: null,
						} as never,
						result_type: 'template',
					},
					{
						item: {
							name: 'Version 1',
							pk: 'tv-1',
							assigned_to: null,
							template: { pk: 'template-1', name: 'Parent Template' },
						} as never,
						result_type: 'template_version',
					},
				],
			}),
		).toEqual([
			expect.objectContaining({
				id: 'template-1',
				subtitle: ['Global'],
			}),
			expect.objectContaining({
				id: 'tv-1',
				subtitle: ['Global', 'Template: Parent Template'],
			}),
		]);
	});

	it('groups template results into command menu sections when they have links', () => {
		const sections = getCommandMenuSearchSections([
			{
				href: '/metadata-templates/template-1',
				id: 'template-1',
				item: {
					assigned_to_content_object_name: 'Projects',
					creation_date: '2024-01-01T00:00:00Z',
					name: 'Template Alpha',
					pk: 'template-1',
				} as never,
				resultType: 'template',
				subtitle: ['Projects'],
				title: 'Template Alpha',
			},
			{
				href: undefined,
				id: 'template-2',
				item: {
					creation_date: '2024-01-01T00:00:00Z',
					name: 'Template Beta',
					pk: 'template-2',
				} as never,
				resultType: 'template',
				subtitle: undefined,
				title: 'Template Beta',
			},
		]);

		expect(sections.templates).toEqual([
			expect.objectContaining({
				href: '/metadata-templates/template-1',
				id: 'template-1',
				title: 'Template Alpha',
			}),
		]);
	});
});

const PER_TYPE_SCHEMA = {
	default_result_types: ['project', 'folder', 'dataset'],
	response_modes: ['full', 'compact'],
	result_types: ['project', 'folder', 'dataset'],
	sort_directions: ['asc', 'desc'],
	types: {
		project: {
			default_sort: [{ direction: 'desc', field: 'updated_at' }],
			default_sort_conditions: [
				{ when: 'positive_text_input_present', sort: [{ field: 'relevance', direction: 'desc' }] },
				{ when: 'otherwise', sort: [{ field: 'updated_at', direction: 'desc' }] },
			],
			fields: [
				{
					id: 'headline',
					description: 'Name',
					operators: ['contains', 'eq'],
					metadata_only: false,
					enum_values: [],
					operators_by_field_type: {},
					value_type: 'string',
				},
				{
					id: 'created_by',
					description: 'Created by',
					operators: ['eq'],
					metadata_only: false,
					enum_values: ['me', 'others'],
					operators_by_field_type: {},
					value_type: 'string',
				},
			],
			sort_fields: ['relevance', 'updated_at', 'created_at'],
		},
		folder: {
			default_sort: [{ direction: 'desc', field: 'updated_at' }],
			default_sort_conditions: [
				{ when: 'positive_text_input_present', sort: [{ field: 'relevance', direction: 'desc' }] },
				{ when: 'otherwise', sort: [{ field: 'updated_at', direction: 'desc' }] },
			],
			fields: [
				{
					id: 'headline',
					description: 'Name',
					operators: ['contains', 'eq'],
					metadata_only: false,
					enum_values: [],
					operators_by_field_type: {},
					value_type: 'string',
				},
			],
			sort_fields: ['relevance', 'updated_at', 'created_at'],
		},
		dataset: {
			default_sort: [{ direction: 'desc', field: 'updated_at' }],
			default_sort_conditions: [
				{ when: 'positive_text_input_present', sort: [{ field: 'relevance', direction: 'desc' }] },
				{ when: 'otherwise', sort: [{ field: 'updated_at', direction: 'desc' }] },
			],
			fields: [
				{
					id: 'headline',
					description: 'Name',
					operators: ['contains', 'eq'],
					metadata_only: false,
					enum_values: [],
					operators_by_field_type: {},
					value_type: 'string',
				},
				{
					id: 'flow_status',
					description: 'Status',
					operators: ['eq'],
					metadata_only: false,
					enum_values: ['Open', 'Closed'],
					operators_by_field_type: {},
					value_type: 'string',
				},
			],
			sort_fields: ['relevance', 'updated_at'],
		},
	},
} satisfies SearchSchemaResponse;

describe('getFieldsForTypes', () => {
	it('returns fields for a single type', () => {
		const fields = getFieldsForTypes(PER_TYPE_SCHEMA, ['project']);

		expect(fields).toHaveLength(2);
		expect(fields.map((field) => field.id)).toEqual(['headline', 'created_by']);
		expect(fields[0]!.applicableTypes).toEqual(['project']);
		expect(fields[1]!.applicableTypes).toEqual(['project']);
	});

	it('returns union of fields across types, deduplicated by id with correct applicableTypes', () => {
		const fields = getFieldsForTypes(PER_TYPE_SCHEMA, ['project', 'folder', 'dataset']);

		expect(fields.map((field) => field.id)).toEqual(['headline', 'created_by', 'flow_status']);
		expect(fields.find((field) => field.id === 'headline')!.applicableTypes).toEqual(['project', 'folder', 'dataset']);
		expect(fields.find((field) => field.id === 'created_by')!.applicableTypes).toEqual(['project']);
		expect(fields.find((field) => field.id === 'flow_status')!.applicableTypes).toEqual(['dataset']);
	});

	it('skips unknown types gracefully', () => {
		const fields = getFieldsForTypes(PER_TYPE_SCHEMA, ['project', 'nonexistent_type']);

		expect(fields).toHaveLength(2);
		expect(fields.map((field) => field.id)).toEqual(['headline', 'created_by']);
	});

	it('decorates has_upgradeable_metadata_templates with its presentation label on dataset results', () => {
		const schema = {
			default_result_types: ['dataset'],
			response_modes: ['full', 'compact'],
			result_types: ['dataset'],
			sort_directions: ['asc', 'desc'],
			types: {
				dataset: {
					default_sort: [{ direction: 'desc', field: 'updated_at' }],
					default_sort_conditions: [],
					fields: [
						{
							id: 'has_upgradeable_metadata_templates',
							description: 'Whether the dataset has a newer template version available.',
							operators: ['is', 'is_not'],
							metadata_only: false,
							enum_values: [],
							operators_by_field_type: {},
							value_type: 'boolean',
						},
					],
					sort_fields: ['relevance', 'updated_at', 'created_at'],
				},
			},
		} satisfies SearchSchemaResponse;

		const fields = getFieldsForTypes(schema, ['dataset']);
		const upgradeable = fields.find((field) => field.id === 'has_upgradeable_metadata_templates');

		expect(upgradeable).toBeDefined();
		expect(upgradeable?.label).toBe('Metadata template upgrade available');
	});
});

describe('applySearchFieldPresentation', () => {
	const FIELDS: EnrichedSearchField[] = [
		{
			id: 'name',
			description: 'Name',
			operators: ['contains', 'eq'],
			metadata_only: false,
			enum_values: [],
			operators_by_field_type: {},
			value_type: 'string',
			applicableTypes: ['project', 'folder'],
		},
		{
			id: 'description',
			description: 'Description',
			operators: ['contains'],
			metadata_only: false,
			enum_values: [],
			operators_by_field_type: {},
			value_type: 'string',
			applicableTypes: ['project'],
		},
		{
			id: 'project_name',
			description: 'Project name',
			operators: ['contains', 'eq'],
			metadata_only: false,
			enum_values: [],
			operators_by_field_type: {},
			value_type: 'string',
			applicableTypes: ['project'],
		},
	];

	it('returns input unchanged when presentation is empty', () => {
		const result = applySearchFieldPresentation(FIELDS, {});

		expect(result.map((field) => field.id)).toEqual(['name', 'description', 'project_name']);
		expect(result.every((field) => field.label === undefined)).toBe(true);
	});

	it('attaches the override label to a matching field', () => {
		const result = applySearchFieldPresentation(FIELDS, {
			project_name: { label: 'Project' },
		});

		expect(result.find((field) => field.id === 'project_name')?.label).toBe('Project');
		expect(result.find((field) => field.id === 'name')?.label).toBeUndefined();
		expect(result.find((field) => field.id === 'description')?.label).toBeUndefined();
	});

	it('drops a hidden field from the output and leaves others untouched', () => {
		const result = applySearchFieldPresentation(FIELDS, {
			description: { hidden: true },
		});

		expect(result.map((field) => field.id)).toEqual(['name', 'project_name']);
		expect(result.every((field) => field.label === undefined)).toBe(true);
	});

	it('drops a field when an entry has both label and hidden (hidden wins)', () => {
		const result = applySearchFieldPresentation(FIELDS, {
			description: { label: 'Description', hidden: true },
		});

		expect(result.map((field) => field.id)).toEqual(['name', 'project_name']);
	});

	it('is a no-op for an entry whose id is not in the input fields', () => {
		const result = applySearchFieldPresentation(FIELDS, {
			stale_field_no_longer_in_schema: { label: 'Gone', hidden: true },
			another_stale_one: { label: 'Also gone' },
		});

		expect(result.map((field) => field.id)).toEqual(['name', 'description', 'project_name']);
		expect(result.every((field) => field.label === undefined)).toBe(true);
	});

	it('preserves input order when some fields are dropped', () => {
		const result = applySearchFieldPresentation(FIELDS, {
			name: { hidden: true },
		});

		expect(result.map((field) => field.id)).toEqual(['description', 'project_name']);
	});

	it('preserves applicableTypes on surviving fields', () => {
		const result = applySearchFieldPresentation(FIELDS, {
			name: { label: 'Name' },
		});

		const name = result.find((field) => field.id === 'name');
		const description = result.find((field) => field.id === 'description');
		expect(name?.applicableTypes).toEqual(['project', 'folder']);
		expect(description?.applicableTypes).toEqual(['project']);
	});

	it('filters listed enum values out of enum_values when enumValuesHidden is set', () => {
		const ENUM_FIELD: EnrichedSearchField = {
			id: 'metadata.source',
			description: 'Metadata source',
			operators: ['is', 'is_not'],
			metadata_only: true,
			enum_values: ['either', 'instance', 'system', 'template'],
			operators_by_field_type: {},
			value_type: 'enum',
			applicableTypes: ['dataset'],
		};

		const result = applySearchFieldPresentation([ENUM_FIELD], {
			'metadata.source': { label: 'Metadata source', enumValuesHidden: ['either'] },
		});

		const source = result.find((field) => field.id === 'metadata.source');
		expect(source?.enum_values).toEqual(['instance', 'system', 'template']);
		expect(source?.label).toBe('Metadata source');
	});

	it('leaves enum_values untouched when enumValuesHidden is not set', () => {
		const ENUM_FIELD: EnrichedSearchField = {
			id: 'metadata.source',
			description: 'Metadata source',
			operators: ['is', 'is_not'],
			metadata_only: true,
			enum_values: ['either', 'instance', 'system', 'template'],
			operators_by_field_type: {},
			value_type: 'enum',
			applicableTypes: ['dataset'],
		};

		const result = applySearchFieldPresentation([ENUM_FIELD], {
			'metadata.source': { label: 'Metadata source' },
		});

		const source = result.find((field) => field.id === 'metadata.source');
		expect(source?.enum_values).toEqual(['either', 'instance', 'system', 'template']);
	});
});

describe('getSortFieldsForTypes', () => {
	it('returns sort fields for a single type', () => {
		const sortFields = getSortFieldsForTypes(PER_TYPE_SCHEMA, ['project']);

		expect(sortFields).toEqual(['relevance', 'updated_at', 'created_at']);
	});

	it('returns only sort fields common to all selected types (intersection)', () => {
		// project has: relevance, updated_at, created_at
		// dataset has: relevance, updated_at
		const sortFields = getSortFieldsForTypes(PER_TYPE_SCHEMA, ['project', 'dataset']);

		expect(sortFields).toEqual(['relevance', 'updated_at']);
	});
});

describe('isSearchSchemaResponse', () => {
	it('validates the new per-type schema shape', () => {
		expect(isSearchSchemaResponse(PER_TYPE_SCHEMA)).toBe(true);
	});

	it('rejects the old flat schema shape', () => {
		const oldSchema = {
			default_result_types: ['project'],
			default_sort: [{ direction: 'desc', field: 'relevance' }],
			fields: [
				{
					id: 'name',
					description: 'Name',
					operators: ['eq'],
					metadata_only: false,
					enum_values: [],
					operators_by_field_type: {},
					value_type: 'string',
				},
			],
			response_modes: ['full'],
			result_types: ['project'],
			sort_directions: ['asc', 'desc'],
			sort_fields: ['relevance'],
		};

		expect(isSearchSchemaResponse(oldSchema)).toBe(false);
	});

	it('rejects non-object values', () => {
		expect(isSearchSchemaResponse(null)).toBe(false);
		expect(isSearchSchemaResponse('string')).toBe(false);
		expect(isSearchSchemaResponse(42)).toBe(false);
	});
});

describe('hasPositiveTextInput', () => {
	const TEXT_FIELD: SearchSchemaField = {
		id: 'name',
		description: 'Name',
		operators: ['contains', 'eq'],
		metadata_only: false,
		enum_values: [],
		operators_by_field_type: {},
		value_type: 'string',
	};

	const ENUM_FIELD: SearchSchemaField = {
		id: 'status',
		description: 'Status',
		operators: ['eq'],
		metadata_only: false,
		enum_values: ['Open', 'Closed'],
		operators_by_field_type: {},
		value_type: 'string',
	};

	it('returns true when searchText is non-empty', () => {
		expect(hasPositiveTextInput('hello', [], [TEXT_FIELD])).toBe(true);
	});

	it('returns false when searchText is empty and no filters', () => {
		expect(hasPositiveTextInput('', [], [TEXT_FIELD])).toBe(false);
		expect(hasPositiveTextInput('   ', [], [TEXT_FIELD])).toBe(false);
	});

	it('returns true when a complete filter uses a text-matching operator on a string field', () => {
		expect(hasPositiveTextInput('', [row('name', 'contains', 'report')], [TEXT_FIELD])).toBe(true);
	});

	it('returns false for incomplete filter rows', () => {
		expect(hasPositiveTextInput('', [row('name', 'contains', '')], [TEXT_FIELD])).toBe(false);
	});

	it('returns false for non-text-matching operators', () => {
		expect(hasPositiveTextInput('', [row('status', 'eq', 'Open')], [ENUM_FIELD])).toBe(false);
	});

	it('treats clusters as structured (not full-text) filters', () => {
		expect(
			hasPositiveTextInput(
				'',
				[clusterItem([clusterRow('metadata.key', 'is', 'temperature'), clusterRow('metadata.value', 'is', 'hot')])],
				[TEXT_FIELD],
			),
		).toBe(false);
	});
});

describe('compressFiltersParam / decompressFiltersParam', () => {
	it('round-trips filter items through compression', () => {
		const filters = [row('name', 'contains', 'test'), row('created_at', 'gt', '2026-04-13', 'AND')];

		const compressed = compressFiltersParam(filters);
		expect(compressed).toBeDefined();
		expect(typeof compressed).toBe('string');
		expect(decompressFiltersParam(compressed)).toEqual(filters);
	});

	it('round-trips filters with entityLabels through compression', () => {
		const filters = [
			rowWithLabels('project_id', 'is', 'uuid-1', { 'uuid-1': 'My Project' }),
			clusterItem([clusterRow('metadata.value', 'gt', '3.14')], 'AND'),
		];

		const compressed = compressFiltersParam(filters);
		expect(decompressFiltersParam(compressed)).toEqual(filters);
	});

	it('returns null for empty filters', () => {
		expect(compressFiltersParam([])).toBeNull();
	});

	it('returns empty array for null/invalid input', () => {
		expect(decompressFiltersParam(null)).toEqual([]);
		expect(decompressFiltersParam('')).toEqual([]);
		expect(decompressFiltersParam('invalid-data')).toEqual([]);
	});
});

describe('getOperatorsForMixedField', () => {
	const FIELD = {
		id: 'metadata.value',
		description: 'Metadata value',
		operators: ['contains', 'is', 'contains_any'],
		metadata_only: true,
		enum_values: [],
		operators_by_field_type: {
			TEXT: ['contains', 'is'],
			INTEGER: ['is', 'gt'],
			SELECTION: ['is', 'is_not', 'in', 'not_in', 'is_empty', 'is_not_empty'],
			TAG: ['contains_any', 'contains_all', 'contains_none', 'is_exactly', 'is_empty', 'is_not_empty'],
		},
		value_type: 'mixed',
	} satisfies SearchSchemaField;

	it('uses the backend TEXT operator map when no narrowing signal exists', () => {
		expect(getOperatorsForMixedField(FIELD, undefined)).toEqual(['contains', 'is']);
	});

	it('uses the backend-advertised operators for scalar and choice narrowing signals', () => {
		expect(getOperatorsForMixedField(FIELD, 'INTEGER')).toEqual(['is', 'gt']);
		expect(getOperatorsForMixedField(FIELD, 'SELECTION')).toEqual([
			'is',
			'is_not',
			'in',
			'not_in',
			'is_empty',
			'is_not_empty',
		]);
		expect(getOperatorsForMixedField(FIELD, 'TAG')).toEqual([
			'contains_any',
			'contains_all',
			'contains_none',
			'is_exactly',
			'is_empty',
			'is_not_empty',
		]);
	});
});

describe('getSearchOperatorOptions', () => {
	it('prioritizes common and comparison operators while preserving their wire ids', () => {
		expect(
			getSearchOperatorOptions([
				'not_in',
				'custom_first',
				'lte',
				'contains',
				'is_empty',
				'in',
				'gte',
				'lt',
				'custom_second',
				'is_not',
				'gt',
				'is',
				'between',
			]),
		).toEqual([
			{ id: 'is', label: 'is' },
			{ id: 'contains', label: 'contains' },
			{ id: 'is_not', label: 'is_not' },
			{ id: 'in', label: 'is_one_of' },
			{ id: 'gt', label: '>' },
			{ id: 'gte', label: '>=' },
			{ id: 'lt', label: '<' },
			{ id: 'lte', label: '<=' },
			{ id: 'between', label: 'between' },
			{ id: 'is_empty', label: 'is_empty' },
			{ id: 'not_in', label: 'is_not_one_of' },
			{ id: 'custom_first', label: 'custom_first' },
			{ id: 'custom_second', label: 'custom_second' },
		]);
	});
});

describe('coerceClusterMixedOperators', () => {
	const METADATA_VALUE_FIELD = {
		id: 'metadata.value',
		description: 'Metadata value',
		operators: [],
		metadata_only: true,
		enum_values: [],
		operators_by_field_type: {
			TEXT: ['contains', 'is'],
			INTEGER: ['is', 'gt'],
			SELECTION: ['is', 'is_not', 'in', 'not_in', 'is_empty', 'is_not_empty'],
			MULTI_SELECTION: ['contains_any', 'contains_all', 'contains_none', 'is_exactly', 'is_empty', 'is_not_empty'],
			TAG: ['contains_any', 'contains_all', 'contains_none', 'is_exactly', 'is_empty', 'is_not_empty'],
		},
		value_type: 'mixed',
	} satisfies SearchSchemaField;

	it('leaves metadata.value rows untouched when the operator is valid for the inferred type', () => {
		const rows = [clusterRow('metadata.field_type', 'is', 'INTEGER'), clusterRow('metadata.value', 'gt', '42')];
		expect(coerceClusterMixedOperators(rows, METADATA_VALUE_FIELD)).toEqual(rows);
	});

	it("coerces the operator to 'is' when no narrowing signal exists in the cluster", () => {
		const rows = [clusterRow('metadata.value', 'gt', '42')];
		expect(coerceClusterMixedOperators(rows, METADATA_VALUE_FIELD)).toEqual([clusterRow('metadata.value', 'is', '42')]);
	});

	it("coerces a string operator to 'is' when narrowing fires and string operators fall out", () => {
		const rows = [clusterRow('metadata.field_type', 'is', 'INTEGER'), clusterRow('metadata.value', 'contains', 'foo')];
		expect(coerceClusterMixedOperators(rows, METADATA_VALUE_FIELD)).toEqual([
			clusterRow('metadata.field_type', 'is', 'INTEGER'),
			clusterRow('metadata.value', 'is', 'foo'),
		]);
	});

	it('preserves literals across safe selection and multi-value transitions', () => {
		expect(
			coerceClusterMixedOperators(
				[clusterRow('metadata.field_type', 'is', 'TAG'), clusterRow('metadata.value', 'is', 'A')],
				METADATA_VALUE_FIELD,
			),
		).toEqual([
			clusterRow('metadata.field_type', 'is', 'TAG'),
			clusterRow('metadata.value', 'contains_any', { selected: ['A'], unselected: [] }),
		]);
		expect(
			coerceClusterMixedOperators(
				[
					clusterRow('metadata.field_type', 'is', 'SELECTION'),
					clusterRow('metadata.value', 'contains_none', { selected: ['A'], unselected: ['C'] }),
				],
				METADATA_VALUE_FIELD,
			),
		).toEqual([
			clusterRow('metadata.field_type', 'is', 'SELECTION'),
			clusterRow('metadata.value', 'not_in', { selected: ['A'], unselected: ['C'] }),
		]);
	});

	it('retains values but makes unsafe exact-set to selection transitions unresolved', () => {
		const rows = [
			clusterRow('metadata.field_type', 'is', 'SELECTION'),
			clusterRow('metadata.value', 'is_exactly', { selected: ['A'], unselected: ['C'] }),
		];
		expect(coerceClusterMixedOperators(rows, METADATA_VALUE_FIELD)).toEqual([
			rows[0],
			{
				...clusterRow('metadata.value', '', { selected: ['A'], unselected: ['C'] }),
				unresolvedOperator: 'is_exactly',
			},
		]);
	});

	it('restores an unresolved operator after returning to a compatible field type', () => {
		const unresolved = coerceClusterMixedOperators(
			[
				clusterRow('metadata.field_type', 'is', 'SELECTION'),
				clusterRow('metadata.value', 'is_exactly', { selected: ['A'], unselected: ['C'] }),
			],
			METADATA_VALUE_FIELD,
		);
		const returnedToTag = [clusterRow('metadata.field_type', 'is', 'TAG'), unresolved[1]!];
		expect(coerceClusterMixedOperators(returnedToTag, METADATA_VALUE_FIELD)).toEqual([
			returnedToTag[0],
			{
				...clusterRow('metadata.value', 'is_exactly', { selected: ['A'], unselected: ['C'] }),
				unresolvedOperator: undefined,
			},
		]);
	});

	it('does not use a safe mapping target the backend did not advertise', () => {
		const withoutContainsAny = {
			...METADATA_VALUE_FIELD,
			operators_by_field_type: { ...METADATA_VALUE_FIELD.operators_by_field_type, TAG: ['contains_none'] },
		};
		expect(
			coerceClusterMixedOperators(
				[clusterRow('metadata.field_type', 'is', 'TAG'), clusterRow('metadata.value', 'is', 'A')],
				withoutContainsAny,
			),
		).toEqual([
			clusterRow('metadata.field_type', 'is', 'TAG'),
			{ ...clusterRow('metadata.value', '', 'A'), unresolvedOperator: 'is' },
		]);
	});

	it('defaults a new empty tag value row to contains-any', () => {
		const rows = [clusterRow('metadata.field_type', 'is', 'TAG'), clusterRow('metadata.value', 'contains', '')];
		expect(coerceClusterMixedOperators(rows, METADATA_VALUE_FIELD)).toEqual([
			rows[0],
			clusterRow('metadata.value', 'contains_any', { selected: [], unselected: [] }),
		]);
	});

	it('does not touch metadata.key rows', () => {
		const rows = [clusterRow('metadata.field_type', 'is', 'INTEGER'), clusterRow('metadata.key', 'is', 'temperature')];
		expect(coerceClusterMixedOperators(rows, METADATA_VALUE_FIELD)).toEqual(rows);
	});
});

describe('coerceOperatorForList', () => {
	it('returns the operator unchanged when it appears in the list', () => {
		expect(coerceOperatorForList('gt', ['is', 'gt', 'lt'])).toBe('gt');
	});

	it("returns 'is' when the operator is not in the list", () => {
		expect(coerceOperatorForList('contains', ['is', 'gt', 'lt'])).toBe('is');
	});

	it("returns 'is' when the list is empty", () => {
		expect(coerceOperatorForList('gt', [])).toBe('is');
	});
});

describe('getTypeaheadConfig', () => {
	it('returns config for uuid entity fields with pk as valueKey', () => {
		const config = getTypeaheadConfig('project_id');
		expect(config).toEqual({ endpoint: '/api/v1/project/', valueKey: 'pk' });
	});

	it('returns config for string entity name fields with name as valueKey', () => {
		const config = getTypeaheadConfig('project_name');
		expect(config).toEqual({ endpoint: '/api/v1/project/', valueKey: 'name' });
	});

	it('returns config for all 14 entity fields', () => {
		const entityFields = [
			'project_id',
			'project_name',
			'folder_id',
			'folder_name',
			'dataset_id',
			'dataset_name',
			'dataset_version_id',
			'dataset_version_name',
			'template_id',
			'template_name',
			'template_version_id',
			'template_version_name',
			'metadata.template_id',
			'metadata.template_name',
		];

		for (const fieldId of entityFields) {
			expect(getTypeaheadConfig(fieldId)).toBeDefined();
		}
	});

	it('returns undefined for non-entity fields', () => {
		expect(getTypeaheadConfig('name')).toBeUndefined();
		expect(getTypeaheadConfig('description')).toBeUndefined();
		expect(getTypeaheadConfig('status')).toBeUndefined();
		expect(getTypeaheadConfig('created_at')).toBeUndefined();
	});
});

describe('applyDatetimeBoundary', () => {
	it('appends T00:00:00Z for start-of-day operators (gt, gte, is, is_not)', () => {
		expect(applyDatetimeBoundary('2026-04-13', 'gt')).toBe('2026-04-13T00:00:00Z');
		expect(applyDatetimeBoundary('2026-04-13', 'gte')).toBe('2026-04-13T00:00:00Z');
		expect(applyDatetimeBoundary('2026-04-13', 'is')).toBe('2026-04-13T00:00:00Z');
		expect(applyDatetimeBoundary('2026-04-13', 'is_not')).toBe('2026-04-13T00:00:00Z');
	});

	it('appends T23:59:59Z for end-of-day operators (lt, lte)', () => {
		expect(applyDatetimeBoundary('2026-04-13', 'lt')).toBe('2026-04-13T23:59:59Z');
		expect(applyDatetimeBoundary('2026-04-13', 'lte')).toBe('2026-04-13T23:59:59Z');
	});

	it('applies start/end boundaries to between range values', () => {
		expect(applyDatetimeBoundary(['2026-04-01', '2026-04-30'], 'between')).toEqual([
			'2026-04-01T00:00:00Z',
			'2026-04-30T23:59:59Z',
		]);
	});

	it('returns empty string for empty input', () => {
		expect(applyDatetimeBoundary('', 'gt')).toBe('');
	});

	it('returns empty array elements unchanged for incomplete between ranges', () => {
		expect(applyDatetimeBoundary(['2026-04-01', ''], 'between')).toEqual(['2026-04-01T00:00:00Z', '']);
		expect(applyDatetimeBoundary(['', '2026-04-30'], 'between')).toEqual(['', '2026-04-30T23:59:59Z']);
	});

	it('passes through values that already have a time component', () => {
		expect(applyDatetimeBoundary('2026-04-13T12:30:00Z', 'gt')).toBe('2026-04-13T12:30:00Z');
	});
});

describe('coerceValueForOperatorChange', () => {
	it('wraps single string into array when switching to in/not_in', () => {
		expect(coerceValueForOperatorChange('uuid-1', 'is', 'in')).toEqual(['uuid-1']);
		expect(coerceValueForOperatorChange('uuid-1', 'is', 'not_in')).toEqual(['uuid-1']);
	});

	it('unwraps array to first element when switching from in/not_in to single', () => {
		expect(coerceValueForOperatorChange(['uuid-1', 'uuid-2'], 'in', 'is')).toBe('uuid-1');
		expect(coerceValueForOperatorChange(['uuid-1'], 'not_in', 'is_not')).toBe('uuid-1');
	});

	it('returns empty string when unwrapping empty array', () => {
		expect(coerceValueForOperatorChange([], 'in', 'is')).toBe('');
	});

	it('returns null for is_empty/is_not_empty operators', () => {
		expect(coerceValueForOperatorChange('some-value', 'is', 'is_empty')).toBeNull();
		expect(coerceValueForOperatorChange(['a', 'b'], 'in', 'is_not_empty')).toBeNull();
		expect(coerceValueForOperatorChange(true, 'is', 'is_empty')).toBeNull();
	});

	it('resets to empty string when switching from array to incompatible single operator', () => {
		expect(coerceValueForOperatorChange(['2026-01-01', '2026-02-01'], 'between', 'gt')).toBe('');
	});

	it('resets to empty array when switching from single to between', () => {
		expect(coerceValueForOperatorChange('2026-01-01', 'gt', 'between')).toEqual(['', '']);
	});

	it('preserves value when switching between compatible single operators', () => {
		expect(coerceValueForOperatorChange('test', 'contains', 'starts_with')).toBe('test');
		expect(coerceValueForOperatorChange('2026-01-01', 'gt', 'lt')).toBe('2026-01-01');
		expect(coerceValueForOperatorChange(true, 'is', 'is_not')).toBe(true);
	});

	it('preserves array when switching between in and not_in', () => {
		expect(coerceValueForOperatorChange(['a', 'b'], 'in', 'not_in')).toEqual(['a', 'b']);
	});

	it('does not invert an unselected choice requirement when switching to a scalar operator', () => {
		expect(coerceChoiceValueForOperatorChange({ selected: [], unselected: ['A'] }, 'contains_any', 'is')).toBe('');
		expect(coerceChoiceValueForOperatorChange({ selected: ['B'], unselected: ['A'] }, 'contains_any', 'is')).toBe('B');
	});
});

describe('isSearchFilterRowComplete', () => {
	it('returns true for null value (is_empty/is_not_empty operators)', () => {
		expect(isSearchFilterRowComplete({ field: 'created_at', operator: 'is_empty', value: null })).toBe(true);
	});

	it('returns true for boolean value', () => {
		expect(isSearchFilterRowComplete({ field: 'is_published', operator: 'is', value: true })).toBe(true);
		expect(isSearchFilterRowComplete({ field: 'is_published', operator: 'is', value: false })).toBe(true);
	});

	it('returns true for non-empty string array', () => {
		expect(isSearchFilterRowComplete({ field: 'project_id', operator: 'in', value: ['uuid-1'] })).toBe(true);
	});

	it('returns false for empty string array', () => {
		expect(isSearchFilterRowComplete({ field: 'project_id', operator: 'in', value: [] })).toBe(false);
	});

	it('uses both selected and unselected choice requirements for completeness', () => {
		expect(
			isSearchFilterRowComplete({
				field: 'metadata.value',
				operator: 'contains_all',
				value: { selected: [], unselected: ['Configured but inactive'] },
			}),
		).toBe(true);
		expect(
			isSearchFilterRowComplete({
				field: 'metadata.value',
				operator: 'contains_all',
				value: { selected: [], unselected: [] },
			}),
		).toBe(false);
	});

	it('returns false for empty string value', () => {
		expect(isSearchFilterRowComplete({ field: 'name', operator: 'contains', value: '' })).toBe(false);
		expect(isSearchFilterRowComplete({ field: 'name', operator: 'contains', value: '   ' })).toBe(false);
	});

	it('returns false when field or operator is missing', () => {
		expect(isSearchFilterRowComplete({ field: '', operator: 'is', value: true })).toBe(false);
		expect(isSearchFilterRowComplete({ field: 'created_at', operator: '', value: null })).toBe(false);
	});
});

describe('getDefaultSortForTypes with conditions', () => {
	it('returns relevance sort when text input is present', () => {
		const sort = getDefaultSortForTypes(PER_TYPE_SCHEMA, ['project'], {
			searchText: 'hello',
			filters: [],
			fields: [],
		});

		expect(sort).toEqual([{ field: 'relevance', direction: 'desc' }]);
	});

	it('returns updated_at sort when no text input (otherwise condition)', () => {
		const sort = getDefaultSortForTypes(PER_TYPE_SCHEMA, ['project'], {
			searchText: '',
			filters: [],
			fields: [],
		});

		expect(sort).toEqual([{ field: 'updated_at', direction: 'desc' }]);
	});

	it('returns relevance sort when text-matching filter is active', () => {
		const fields = getFieldsForTypes(PER_TYPE_SCHEMA, ['project']);
		const sort = getDefaultSortForTypes(PER_TYPE_SCHEMA, ['project'], {
			searchText: '',
			filters: [row('headline', 'contains', 'report')],
			fields,
		});

		expect(sort).toEqual([{ field: 'relevance', direction: 'desc' }]);
	});

	it('skips unknown when values and falls through to next condition', () => {
		const schemaWithUnknownCondition = {
			...PER_TYPE_SCHEMA,
			types: {
				...PER_TYPE_SCHEMA.types,
				project: {
					...PER_TYPE_SCHEMA.types.project,
					default_sort_conditions: [
						{ when: 'unknown_future_condition', sort: [{ field: 'created_at', direction: 'asc' }] },
						{ when: 'otherwise', sort: [{ field: 'updated_at', direction: 'desc' }] },
					],
				},
			},
		} satisfies SearchSchemaResponse;

		const sort = getDefaultSortForTypes(schemaWithUnknownCondition, ['project'], {
			searchText: '',
			filters: [],
			fields: [],
		});

		expect(sort).toEqual([{ field: 'updated_at', direction: 'desc' }]);
	});

	it('falls back to default_sort when conditions array is empty', () => {
		const schemaWithNoConditions = {
			...PER_TYPE_SCHEMA,
			types: {
				...PER_TYPE_SCHEMA.types,
				project: {
					...PER_TYPE_SCHEMA.types.project,
					default_sort_conditions: [],
				},
			},
		} satisfies SearchSchemaResponse;

		const sort = getDefaultSortForTypes(schemaWithNoConditions, ['project'], {
			searchText: 'hello',
			filters: [],
			fields: [],
		});

		expect(sort).toEqual([{ direction: 'desc', field: 'updated_at' }]);
	});
});

describe('clusterModel — Metadata predicate cluster invariants', () => {
	const METADATA_KEY_FIELD: SearchSchemaField = {
		id: 'metadata.key',
		description: 'Metadata key',
		operators: ['is', 'is_not', 'in', 'not_in'],
		metadata_only: true,
		enum_values: [],
		operators_by_field_type: {},
		value_type: 'string',
	};
	const METADATA_VALUE_FIELD: SearchSchemaField = {
		id: 'metadata.value',
		description: 'Metadata value',
		operators: ['contains', 'is', 'is_not', 'lt', 'gt'],
		metadata_only: true,
		enum_values: [],
		operators_by_field_type: {},
		value_type: 'mixed',
	};
	const METADATA_FIELD_TYPE_FIELD: SearchSchemaField = {
		id: 'metadata.field_type',
		description: 'Metadata field type',
		operators: ['is'],
		metadata_only: true,
		enum_values: ['TEXT', 'INTEGER', 'DATE'],
		operators_by_field_type: {},
		value_type: 'enum',
	};

	it('creates a cluster with a single seed row using the schema field defaults', () => {
		const cluster = createClusterFromField('metadata.key', METADATA_KEY_FIELD);
		expect(cluster.kind).toBe('cluster');
		expect(cluster.id).toEqual(expect.any(String));
		expect(cluster.rows).toHaveLength(1);
		expect(cluster.rows[0]).toMatchObject({ field: 'metadata.key', operator: 'is', value: '' });
		expect(cluster.rows[0]!.id).toEqual(expect.any(String));
	});

	it('seeds metadata.field_type with the first enum value', () => {
		const cluster = createClusterFromField('metadata.field_type', METADATA_FIELD_TYPE_FIELD);
		expect(cluster.rows[0]).toMatchObject({ field: 'metadata.field_type', operator: 'is', value: 'TEXT' });
	});

	it('addRowToCluster appends a new row for an unused eligible field', () => {
		const base = createClusterFromField('metadata.key', METADATA_KEY_FIELD);
		const next = addRowToCluster(base, 'metadata.value', METADATA_VALUE_FIELD);
		expect(next.rows).toHaveLength(2);
		expect(next.rows.map((row) => row.field)).toEqual(['metadata.key', 'metadata.value']);
	});

	it('addRowToCluster throws when the field is already present', () => {
		const base = createClusterFromField('metadata.key', METADATA_KEY_FIELD);
		expect(() => addRowToCluster(base, 'metadata.key', METADATA_KEY_FIELD)).toThrow(
			/already contains a "metadata.key" row/,
		);
	});

	it('addRowToCluster throws when the field is not cluster-eligible', () => {
		const base = createClusterFromField('metadata.key', METADATA_KEY_FIELD);
		expect(() => addRowToCluster(base, 'name' as never, undefined)).toThrow(/not cluster-eligible/);
	});

	it('removeRowFromCluster returns the cluster with the row removed', () => {
		const base = addRowToCluster(
			createClusterFromField('metadata.key', METADATA_KEY_FIELD),
			'metadata.value',
			METADATA_VALUE_FIELD,
		);
		const removeKeyId = base.rows[0]!.id;
		const next = removeRowFromCluster(base, removeKeyId);
		expect(next).not.toBeNull();
		expect(next!.rows.map((row) => row.field)).toEqual(['metadata.value']);
	});

	it('removeRowFromCluster returns null when removing the last row', () => {
		const base = createClusterFromField('metadata.key', METADATA_KEY_FIELD);
		expect(removeRowFromCluster(base, base.rows[0]!.id)).toBeNull();
	});

	it('availableFieldsForCluster returns the unused subset in deterministic order', () => {
		const base = createClusterFromField('metadata.value', METADATA_VALUE_FIELD);
		expect(availableFieldsForCluster(base)).toEqual(['metadata.key', 'metadata.field_type']);
		const withKey = addRowToCluster(base, 'metadata.key', METADATA_KEY_FIELD);
		expect(availableFieldsForCluster(withKey)).toEqual(['metadata.field_type']);
		const full = addRowToCluster(withKey, 'metadata.field_type', METADATA_FIELD_TYPE_FIELD);
		expect(availableFieldsForCluster(full)).toEqual([]);
	});

	it('normalizeCluster coerces an invalid operator to the schema default', () => {
		const cluster: MetadataCluster = {
			kind: 'cluster',
			id: 'c-1',
			rows: [{ id: 'r-1', field: 'metadata.value', operator: 'unknown-op', value: 'x' }],
		};
		const next = normalizeCluster(cluster, [METADATA_VALUE_FIELD]);
		expect(next.rows[0]?.operator).toBe('contains');
	});

	it('isClusterComplete is true only when every row is complete', () => {
		expect(isClusterComplete({ kind: 'cluster', rows: [clusterRow('metadata.key', 'is', 'temp')] })).toBe(true);
		expect(
			isClusterComplete({
				kind: 'cluster',
				rows: [clusterRow('metadata.key', 'is', 'temp'), clusterRow('metadata.value', 'gt', '')],
			}),
		).toBe(false);
		expect(isClusterComplete({ kind: 'cluster', rows: [] })).toBe(false);
	});
});
