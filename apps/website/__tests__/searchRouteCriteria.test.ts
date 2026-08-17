import { describe, expect, it } from 'vitest';
import {
	buildSearchRouteRequest,
	getSearchSourceOptions,
	hasSearchRouteCriteria,
	normalizeSearchMultiSelectParam,
	serializeSearchMultiSelectParam,
	toSearchApiSort,
	getSearchSortOptions,
	getDefaultSearchSortKey,
	getResolvedSearchSortKey,
} from '@/app/(main)/search/searchRouteCriteria';
import { buildSearchFilterGroup, type SearchSchemaResponse } from '@/util/globalSearch';
import type { components } from '@/util/openapiSchema';

type SearchSchemaField = components['schemas']['SearchSchemaField'];

const PROJECT_FIELDS: SearchSchemaField[] = [
	{
		description: 'Status',
		enum_values: ['Open', 'Closed'],
		id: 'status',
		metadata_only: false,
		operators: ['eq'],
		operators_by_field_type: {},
		value_type: 'string',
	},
	{
		description: 'Created by',
		enum_values: ['me', 'others'],
		id: 'created_by',
		metadata_only: false,
		operators: ['eq'],
		operators_by_field_type: {},
		value_type: 'string',
	},
	{
		description: 'Membership',
		enum_values: ['admin', 'member'],
		id: 'membership',
		metadata_only: false,
		operators: ['eq'],
		operators_by_field_type: {},
		value_type: 'string',
	},
];

const DEFAULT_SORT_CONDITIONS = [
	{ when: 'positive_text_input_present', sort: [{ field: 'relevance', direction: 'desc' }] },
	{ when: 'otherwise', sort: [{ field: 'updated_at', direction: 'desc' }] },
];

const SHARED_TYPE_DEFAULTS = {
	default_sort: [{ direction: 'desc' as const, field: 'relevance' as const }],
	default_sort_conditions: [...DEFAULT_SORT_CONDITIONS],
	fields: [] as SearchSchemaField[],
	sort_fields: ['relevance', 'created_at'],
};

const SEARCH_SCHEMA = {
	default_result_types: ['project', 'folder', 'template'],
	response_modes: ['full', 'compact'],
	result_types: ['project', 'folder', 'template'],
	sort_directions: ['asc', 'desc'],
	types: {
		project: {
			...SHARED_TYPE_DEFAULTS,
			fields: [...PROJECT_FIELDS],
		},
		folder: { ...SHARED_TYPE_DEFAULTS },
		template: { ...SHARED_TYPE_DEFAULTS },
	},
} satisfies SearchSchemaResponse;

const EXTENDED_SEARCH_SCHEMA = {
	...SEARCH_SCHEMA,
	default_result_types: ['project', 'folder', 'dataset', 'dataset_version', 'file', 'template', 'template_version'],
	result_types: ['project', 'folder', 'dataset', 'dataset_version', 'file', 'template', 'template_version'],
	types: {
		...SEARCH_SCHEMA.types,
		dataset: { ...SHARED_TYPE_DEFAULTS },
		dataset_version: { ...SHARED_TYPE_DEFAULTS },
		file: { ...SHARED_TYPE_DEFAULTS },
		template_version: { ...SHARED_TYPE_DEFAULTS },
	},
} satisfies SearchSchemaResponse;

describe('search sort translation layer', () => {
	describe('toSearchApiSort', () => {
		it('maps each URL sort value to the correct API format', () => {
			expect(toSearchApiSort('-relevance')).toEqual([{ field: 'relevance', direction: 'desc' }]);
			expect(toSearchApiSort('-creation_date')).toEqual([{ field: 'created_at', direction: 'desc' }]);
			expect(toSearchApiSort('creation_date')).toEqual([{ field: 'created_at', direction: 'asc' }]);
		});

		it('falls back to created_at desc for unrecognized sort values', () => {
			expect(toSearchApiSort('updated_at:desc')).toEqual([{ field: 'created_at', direction: 'desc' }]);
			expect(toSearchApiSort('nonsense')).toEqual([{ field: 'created_at', direction: 'desc' }]);
			expect(toSearchApiSort('')).toEqual([{ field: 'created_at', direction: 'desc' }]);
		});
	});

	describe('getSearchSortOptions', () => {
		it('includes relevance when search text is present', () => {
			const options = getSearchSortOptions('atlas');
			expect(options).toEqual({
				'-relevance': 'Relevance',
				'-creation_date': 'Created last',
				creation_date: 'Created first',
			});
		});

		it('excludes relevance when search text is empty or absent', () => {
			expect(getSearchSortOptions('')).toEqual({
				'-creation_date': 'Created last',
				creation_date: 'Created first',
			});
			expect(getSearchSortOptions()).toEqual({
				'-creation_date': 'Created last',
				creation_date: 'Created first',
			});
		});
	});

	describe('getDefaultSearchSortKey', () => {
		it('returns -relevance when search text is present', () => {
			expect(getDefaultSearchSortKey('atlas')).toBe('-relevance');
		});

		it('returns -creation_date when search text is empty or absent', () => {
			expect(getDefaultSearchSortKey('')).toBe('-creation_date');
			expect(getDefaultSearchSortKey()).toBe('-creation_date');
		});
	});

	describe('getResolvedSearchSortKey', () => {
		it('returns valid sort params unchanged', () => {
			expect(getResolvedSearchSortKey('-creation_date', 'atlas')).toBe('-creation_date');
			expect(getResolvedSearchSortKey('creation_date', '')).toBe('creation_date');
			expect(getResolvedSearchSortKey('-relevance', 'atlas')).toBe('-relevance');
		});

		it('falls back to default for invalid sort params', () => {
			expect(getResolvedSearchSortKey('updated_at:desc', 'atlas')).toBe('-relevance');
			expect(getResolvedSearchSortKey('nonsense', '')).toBe('-creation_date');
			expect(getResolvedSearchSortKey(null, 'atlas')).toBe('-relevance');
			expect(getResolvedSearchSortKey(undefined)).toBe('-creation_date');
		});

		it('treats -relevance as invalid when there is no search text', () => {
			expect(getResolvedSearchSortKey('-relevance', '')).toBe('-creation_date');
		});
	});
});

describe('search route criteria helpers', () => {
	it('normalizes multi-select params and clears equivalent all-selected state', () => {
		expect(normalizeSearchMultiSelectParam('folder,project', ['project', 'folder', 'template'])).toBe('project,folder');
		expect(
			serializeSearchMultiSelectParam(new Set(['project', 'folder', 'template']), ['project', 'folder', 'template']),
		).toBeNull();
	});

	it('merges simple filters, source filters, and sort into the structured search request', () => {
		const request = buildSearchRouteRequest({
			createdByParam: 'me',
			filters: [{ kind: 'row', field: 'status', operator: 'eq', value: 'Open' }],
			myPermissionsParam: 'admin',
			schema: SEARCH_SCHEMA,
			searchText: 'atlas',
			sortParam: '-creation_date',
			sourceParam: 'project,folder',
		});

		expect(request.group).toEqual(
			buildSearchFilterGroup([
				{ kind: 'row', field: 'status', operator: 'eq', value: 'Open' },
				{ kind: 'row', connector: 'AND', field: 'created_by', operator: 'eq', value: 'me' },
				{ kind: 'row', connector: 'AND', field: 'membership', operator: 'eq', value: 'admin' },
			]),
		);
		expect(request.result_types).toEqual(['project', 'folder']);
		expect(request.sort).toEqual([{ direction: 'desc', field: 'created_at' }]);
	});

	it('falls back to default sort when sort param is unrecognized and simple filters are unsupported', () => {
		const schemaWithoutMembership = {
			...SEARCH_SCHEMA,
			types: {
				...SEARCH_SCHEMA.types,
				project: {
					...SEARCH_SCHEMA.types.project,
					fields: PROJECT_FIELDS.filter((field) => field.id !== 'membership'),
				},
			},
		} satisfies SearchSchemaResponse;

		const request = buildSearchRouteRequest({
			createdByParam: 'me',
			filters: [],
			myPermissionsParam: 'admin',
			schema: schemaWithoutMembership,
			sortParam: 'updated_at:desc',
			sourceParam: null,
		});

		expect(request.group).toEqual(
			buildSearchFilterGroup([{ kind: 'row', field: 'created_by', operator: 'eq', value: 'me' }]),
		);
		expect(request.result_types).toEqual(SEARCH_SCHEMA.default_result_types);
		expect(request.sort).toEqual([{ direction: 'desc', field: 'created_at' }]);
	});

	it('keeps all schema-provided source types available', () => {
		expect(getSearchSourceOptions(EXTENDED_SEARCH_SCHEMA)).toEqual({
			project: 'Projects',
			folder: 'Folders',
			dataset: 'Files',
			dataset_version: 'Versions',
			file: 'File attachments',
			template: 'Metadata templates',
			template_version: 'Metadata template versions',
		});
	});

	it('uses all default result types in the built request', () => {
		const request = buildSearchRouteRequest({
			createdByParam: null,
			filters: [],
			myPermissionsParam: null,
			schema: EXTENDED_SEARCH_SCHEMA,
			searchText: 'test',
			sortParam: null,
			sourceParam: null,
		});

		expect(request.result_types).toEqual(EXTENDED_SEARCH_SCHEMA.default_result_types);
	});

	it('treats source-only and simple-filter-only queries as searchable criteria', () => {
		expect(
			hasSearchRouteCriteria({
				createdByParam: null,
				filters: [],
				myPermissionsParam: null,
				searchText: '',
				sourceParam: 'project',
			}),
		).toBe(true);
		expect(
			hasSearchRouteCriteria({
				createdByParam: 'me',
				filters: [],
				myPermissionsParam: null,
				searchText: '',
				sourceParam: null,
			}),
		).toBe(true);
	});
});
