import { describe, expect, it } from 'vitest';
import {
	normalizeSearchMultiSelectParam,
	parseSearchMultiSelectParam,
	serializeSearchMultiSelectParam,
} from '@/app/(main)/search/searchRouteCriteria';
import {
	compressFiltersParam,
	decompressFiltersParam,
	type MetadataClusterRowInput,
	parseSearchFiltersParam,
	type SearchFilterConnector,
	type SearchFilterItemInput,
	type SearchFilterValue,
	serializeSearchFiltersParam,
} from '@/util/globalSearch';

const SOURCE_ALLOWED = ['project', 'folder', 'dataset', 'template'] as const;
const CREATED_BY_ALLOWED = ['me', 'others'] as const;
const MY_PERMISSIONS_ALLOWED = ['admin', 'member'] as const;

function row(
	field: string,
	operator: string,
	value: SearchFilterValue,
	connector?: SearchFilterConnector,
): SearchFilterItemInput {
	return { kind: 'row', ...(connector ? { connector } : {}), field, operator, value };
}

function clusterItem(rows: MetadataClusterRowInput[], connector?: SearchFilterConnector): SearchFilterItemInput {
	return { kind: 'cluster', ...(connector ? { connector } : {}), rows };
}

type SearchUrlState = {
	readonly q?: string;
	readonly filters?: readonly SearchFilterItemInput[];
	readonly source?: ReadonlySet<string>;
	readonly createdBy?: ReadonlySet<string>;
	readonly myPermissions?: ReadonlySet<string>;
	readonly sortBy?: string;
};

type SearchUrlParams = {
	readonly q?: string | null;
	readonly filters?: string | null;
	readonly source?: string | null;
	readonly created_by?: string | null;
	readonly my_permissions?: string | null;
	readonly sort_by?: string | null;
};

function encode(state: SearchUrlState): SearchUrlParams {
	return {
		q: state.q ?? null,
		filters: state.filters ? compressFiltersParam(state.filters) : null,
		source: state.source ? serializeSearchMultiSelectParam(state.source, SOURCE_ALLOWED) : null,
		created_by: state.createdBy ? serializeSearchMultiSelectParam(state.createdBy, CREATED_BY_ALLOWED) : null,
		my_permissions: state.myPermissions
			? serializeSearchMultiSelectParam(state.myPermissions, MY_PERMISSIONS_ALLOWED)
			: null,
		sort_by: state.sortBy ?? null,
	};
}

function decode(params: SearchUrlParams): SearchUrlState {
	return {
		q: params.q ?? undefined,
		filters: params.filters ? decompressFiltersParam(params.filters) : undefined,
		source: parseSearchMultiSelectParam(params.source, SOURCE_ALLOWED),
		createdBy: parseSearchMultiSelectParam(params.created_by, CREATED_BY_ALLOWED),
		myPermissions: parseSearchMultiSelectParam(params.my_permissions, MY_PERMISSIONS_ALLOWED),
		sortBy: params.sort_by ?? undefined,
	};
}

function normalizeForCompare(state: SearchUrlState) {
	return {
		q: state.q,
		filters: state.filters,
		source: state.source ? [...state.source] : [],
		createdBy: state.createdBy ? [...state.createdBy] : [],
		myPermissions: state.myPermissions ? [...state.myPermissions] : [],
		sortBy: state.sortBy,
	};
}

describe('searchUrlRoundTrip — combined URL contract', () => {
	it('round-trips an empty URL (every codec yields null)', () => {
		const params = encode({});
		expect(params).toEqual({
			q: null,
			filters: null,
			source: null,
			created_by: null,
			my_permissions: null,
			sort_by: null,
		});
		expect(normalizeForCompare(decode(params))).toEqual(normalizeForCompare({}));
	});

	it('round-trips text-only state', () => {
		const state: SearchUrlState = { q: 'budget Q2' };
		const params = encode(state);
		expect(params.q).toBe('budget Q2');
		expect(normalizeForCompare(decode(params))).toEqual(normalizeForCompare(state));
	});

	it('round-trips simple chip filters only', () => {
		const state: SearchUrlState = {
			source: new Set(['project', 'folder']),
			createdBy: new Set(['me']),
		};
		const params = encode(state);
		expect(params.source).toBe('project,folder');
		expect(params.created_by).toBe('me');
		expect(normalizeForCompare(decode(params))).toEqual(normalizeForCompare(state));
	});

	it('round-trips advanced filter rows only', () => {
		const state: SearchUrlState = {
			filters: [
				row('name', 'contains', 'budget'),
				clusterItem(
					[
						{ field: 'metadata.field_type', operator: 'is', value: 'INTEGER' },
						{ field: 'metadata.value', operator: 'gt', value: '100' },
					],
					'OR',
				),
			],
		};
		const params = encode(state);
		expect(params.filters).not.toBeNull();
		const decoded = decode(params);
		expect(decoded.filters).toEqual(state.filters);
	});

	it('round-trips choice literals and operators without suggestion provenance', () => {
		const filters = [
			clusterItem([
				{ field: 'metadata.key', operator: 'in', value: ['status', 'legacy_status'] },
				{ field: 'metadata.field_type', operator: 'is', value: 'TAG' },
				{
					field: 'metadata.value',
					operator: 'is_exactly',
					value: { selected: ['First', 'Third'], unselected: ['Second'] },
				},
			]),
		];
		const serialized = serializeSearchFiltersParam(filters);
		expect(serialized).not.toContain('template');
		expect(serialized).not.toContain('source');
		expect(decompressFiltersParam(compressFiltersParam(filters))).toEqual(filters);
	});

	it('round-trips sort-only state', () => {
		const state: SearchUrlState = { sortBy: '-creation_date' };
		const params = encode(state);
		expect(params.sort_by).toBe('-creation_date');
		expect(normalizeForCompare(decode(params))).toEqual(normalizeForCompare(state));
	});

	it('round-trips a fully populated URL (text + filters + partial chips + sort)', () => {
		const state: SearchUrlState = {
			q: 'budget',
			filters: [
				clusterItem([
					{ field: 'metadata.field_type', operator: 'is', value: 'DECIMAL' },
					{ field: 'metadata.value', operator: 'between', value: ['10', '20'] },
				]),
				row('folder_id', 'is', 'fol-7', 'AND'),
			],
			source: new Set(['dataset']),
			createdBy: new Set(['me']),
			myPermissions: new Set(['admin']),
			sortBy: '-relevance',
		};
		const params = encode(state);
		const decoded = decode(params);
		expect(decoded.filters).toEqual(state.filters);
		expect(normalizeForCompare(decoded)).toEqual(normalizeForCompare(state));
	});

	it("collapses full chip selections to 'all' on round-trip (deliberate normalization)", () => {
		const state: SearchUrlState = { createdBy: new Set(['me', 'others']) };
		const params = encode(state);
		expect(params.created_by).toBeNull();
		const decoded = decode(params);
		expect([...decoded.createdBy!]).toEqual([]);
	});

	it('normalizes empty selection sets to null in the URL', () => {
		const params = encode({ source: new Set<string>() });
		expect(params.source).toBeNull();
		expect(normalizeSearchMultiSelectParam('', SOURCE_ALLOWED)).toBeNull();
	});

	it('normalizes full selection sets to null in the URL (no value beyond all)', () => {
		const params = encode({ source: new Set(SOURCE_ALLOWED) });
		expect(params.source).toBeNull();
		expect(normalizeSearchMultiSelectParam('project,folder,dataset,template', SOURCE_ALLOWED)).toBeNull();
	});

	it('drops unknown chip values on decode (defends against link tampering)', () => {
		const decoded = decode({ source: 'project,malware,folder' });
		expect([...decoded.source!].sort((a, b) => a.localeCompare(b))).toEqual(['folder', 'project']);
	});

	it('first filter row never serializes a connector even if one is on the input', () => {
		const filters: SearchFilterItemInput[] = [
			row('name', 'contains', 'foo', 'OR'),
			row('name', 'contains', 'bar', 'AND'),
		];
		const serialized = serializeSearchFiltersParam(filters);
		expect(serialized).not.toBeNull();
		const parsed = parseSearchFiltersParam(serialized!);
		expect(parsed[0]?.connector).toBeUndefined();
		expect(parsed[1]?.connector).toBe('AND');
	});

	it('round-trips a filter row with connector: undefined as the first row', () => {
		const filters: SearchFilterItemInput[] = [row('name', 'contains', 'foo'), row('name', 'contains', 'bar', 'AND')];
		const compressed = compressFiltersParam(filters);
		expect(compressed).not.toBeNull();
		expect(decompressFiltersParam(compressed)).toEqual(filters);
	});

	it('returns empty filters from a malformed compressed param (decompress is resilient)', () => {
		expect(decompressFiltersParam('this-is-not-valid')).toEqual([]);
	});
});
