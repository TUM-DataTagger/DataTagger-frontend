import { describe, expect, it } from 'vitest';
import {
	type AdditionInfo,
	buildAdditionsAfterMap,
	buildMetadataDiffTimeline,
	buildTimeline,
	compareAdditions,
	type DiffField,
	entryOrderValue,
	getOrderValue,
	hasMetadataFieldChanged,
	type MetadataFieldDiffTimelineEntry,
	normalizeForDiff,
	scrubMetadataField,
	stableSortFieldsByOrder,
	stableSortTimelineByOrder,
} from '@/util/metadataDiff';

function makeField(input: {
	readonly config?: unknown;
	readonly custom_key?: string | null;
	readonly field_type?: string | null;
	readonly mandatory?: boolean;
	readonly metadata_template_field?: string | null;
	readonly order?: number | null;
	readonly pk: string;
	readonly previous_version_field?: string | null;
	readonly value?: unknown;
}): DiffField {
	return {
		pk: input.pk,
		custom_key: input.custom_key ?? null,
		field_type: input.field_type as any,
		mandatory: input.mandatory ?? false,
		value: (input.value ?? '') as any,
		config: input.config ?? {},
		order: input.order ?? null,
		previous_version_field: input.previous_version_field ?? null,
		metadata_template_field: input.metadata_template_field ?? null,
	} as any;
}

const entryPk = (entry: ReturnType<typeof buildMetadataDiffTimeline>[number]) =>
	entry.type === 'added' ? entry.next.pk : entry.current.pk;

describe('buildMetadataDiffTimeline', () => {
	it('preserves input order when order ties', () => {
		const first = makeField({ pk: 'b', order: 1, custom_key: 'B' });
		const second = makeField({ pk: 'a', order: 1, custom_key: 'A' });

		const timeline = buildMetadataDiffTimeline({ currentFields: [first, second] });

		expect(timeline.map(entryPk)).toEqual(['b', 'a']);
		expect(timeline.every((entry) => entry.type === 'unchanged')).toBe(true);
	});

	it('treats metadata_template_field-only changes as changed', () => {
		const oldField = makeField({ pk: 'old', custom_key: 'Project', value: 'x', metadata_template_field: 'A' });
		const newField = makeField({ pk: 'new', custom_key: 'Project', value: 'x', metadata_template_field: 'B' });

		const timeline = buildMetadataDiffTimeline({
			currentFields: [oldField],
			compareFields: [newField],
			diffValues: [
				{
					old: { ...oldField, field: {}, metadata_template: null },
					new: { ...newField, field: {}, metadata_template: null },
				},
			] as any,
		});

		expect(timeline).toHaveLength(1);
		expect(timeline[0]?.type).toBe('changed');
	});

	it('anchors additions after previous_version_field when order ties', () => {
		const a = makeField({ pk: 'A', order: 1, custom_key: 'A' });
		const b = makeField({ pk: 'B', order: 2, custom_key: 'B' });
		// eslint-disable-next-line id-length
		const c = makeField({ pk: 'C', order: 1, custom_key: 'C', previous_version_field: 'A' });

		const timeline = buildMetadataDiffTimeline({
			currentFields: [a, b],
			compareFields: [a, c, b],
			diffValues: [{ old: null, new: { ...c, field: {}, metadata_template: null } }] as any,
		});

		expect(timeline.map(entryPk)).toEqual(['A', 'C', 'B']);
		expect(timeline.map((entry) => entry.type)).toEqual(['unchanged', 'added', 'unchanged']);
	});

	describe('empty inputs edge cases', () => {
		it('returns empty array for empty currentFields and no diffValues', () => {
			const timeline = buildMetadataDiffTimeline({ currentFields: [] });
			expect(timeline).toEqual([]);
		});

		it('returns empty array for empty currentFields and empty diffValues', () => {
			const timeline = buildMetadataDiffTimeline({ currentFields: [], diffValues: [] });
			expect(timeline).toEqual([]);
		});

		it('handles additions when currentFields is empty', () => {
			const newField = makeField({ pk: 'new', order: 1 });

			const timeline = buildMetadataDiffTimeline({
				currentFields: [],
				diffValues: [{ old: null, new: { ...newField, field: {}, metadata_template: null } }] as any,
			});

			expect(timeline).toHaveLength(1);
			expect(timeline[0]?.type).toBe('added');
			expect(entryPk(timeline[0]!)).toBe('new');
		});

		it('returns all unchanged when diffValues is empty but fields exist', () => {
			const a = makeField({ pk: 'A', order: 1 });
			const b = makeField({ pk: 'B', order: 2 });

			const timeline = buildMetadataDiffTimeline({
				currentFields: [a, b],
				diffValues: [],
			});

			expect(timeline).toHaveLength(2);
			expect(timeline.every((entry) => entry.type === 'unchanged')).toBe(true);
		});
	});

	describe('null order value handling', () => {
		it('sorts fields with null order to the end', () => {
			const withOrder = makeField({ pk: 'A', order: 1 });
			const withNullOrder = makeField({ pk: 'B', order: null });
			const withHighOrder = makeField({ pk: 'C', order: 100 });

			const timeline = buildMetadataDiffTimeline({
				currentFields: [withNullOrder, withOrder, withHighOrder],
			});

			expect(timeline.map(entryPk)).toEqual(['A', 'C', 'B']);
		});

		it('preserves input order for multiple null order fields', () => {
			const first = makeField({ pk: 'first', order: null });
			const second = makeField({ pk: 'second', order: null });
			const third = makeField({ pk: 'third', order: null });

			const timeline = buildMetadataDiffTimeline({
				currentFields: [first, second, third],
			});

			expect(timeline.map(entryPk)).toEqual(['first', 'second', 'third']);
		});
	});
});

describe('normalizeForDiff', () => {
	it('handles primitive values', () => {
		expect(normalizeForDiff('hello')).toBe('"hello"');
		expect(normalizeForDiff(42)).toBe('42');
		expect(normalizeForDiff(true)).toBe('true');
		expect(normalizeForDiff(false)).toBe('false');
	});

	it('handles null and undefined', () => {
		expect(normalizeForDiff(null)).toBe('null');
		expect(normalizeForDiff(undefined)).toBe('null');
	});

	it('handles objects and arrays', () => {
		expect(normalizeForDiff({ a: 1, b: 2 })).toBe('{"a":1,"b":2}');
		expect(normalizeForDiff([1, 2, 3])).toBe('[1,2,3]');
	});

	it('handles BigInt values', () => {
		expect(normalizeForDiff(BigInt(9_007_199_254_740_991))).toBe('"9007199254740991"');
		expect(normalizeForDiff({ big: BigInt(123) })).toBe('{"big":"123"}');
	});

	it('handles circular references', () => {
		const obj: Record<string, unknown> = { a: 1 };
		obj.self = obj;

		const result = normalizeForDiff(obj);
		expect(result).toBe('{"a":1,"self":"[Circular]"}');
	});

	it('handles deeply nested circular references', () => {
		const obj: Record<string, unknown> = { level1: { level2: {} } };
		(obj.level1 as Record<string, unknown>).level2 = { back: obj };

		const result = normalizeForDiff(obj);
		expect(result).toContain('[Circular]');
	});

	it('handles empty objects and arrays', () => {
		expect(normalizeForDiff({})).toBe('{}');
		expect(normalizeForDiff([])).toBe('[]');
	});
});

describe('scrubMetadataField', () => {
	it('removes field and metadata_template properties', () => {
		const input = {
			pk: 'test',
			custom_key: 'key',
			field_type: 'text',
			mandatory: true,
			value: 'test value',
			config: { setting: true },
			order: 1,
			previous_version_field: null,
			metadata_template_field: 'tmpl-field',
			field: { nested: 'data' },
			metadata_template: { template: 'data' },
		} as any;

		const result = scrubMetadataField(input);

		expect(result).not.toHaveProperty('field');
		expect(result).not.toHaveProperty('metadata_template');
		expect(result.pk).toBe('test');
		expect(result.custom_key).toBe('key');
		expect(result.field_type).toBe('text');
		expect(result.mandatory).toBe(true);
		expect(result.value).toBe('test value');
		expect(result.config).toEqual({ setting: true });
		expect(result.order).toBe(1);
		// metadata_template_field exists on MetadataTemplateField but not MinimalMetadata in the union
		expect((result as Record<string, unknown>).metadata_template_field).toBe('tmpl-field');
	});

	it('handles fields without field and metadata_template', () => {
		const input = {
			pk: 'test',
			custom_key: 'key',
		} as any;

		const result = scrubMetadataField(input);

		expect(result.pk).toBe('test');
		expect(result.custom_key).toBe('key');
	});
});

describe('hasMetadataFieldChanged', () => {
	it('returns false for identical fields', () => {
		const field = makeField({ pk: 'A', custom_key: 'test', value: 'value', order: 1 });
		expect(hasMetadataFieldChanged(field as any, field as any)).toBe(false);
	});

	it('detects value changes', () => {
		const oldField = makeField({ pk: 'A', value: 'old' });
		const newField = makeField({ pk: 'A', value: 'new' });
		expect(hasMetadataFieldChanged(oldField as any, newField as any)).toBe(true);
	});

	it('detects order changes', () => {
		const oldField = makeField({ pk: 'A', order: 1 });
		const newField = makeField({ pk: 'A', order: 2 });
		expect(hasMetadataFieldChanged(oldField as any, newField as any)).toBe(true);
	});

	it('detects config changes', () => {
		const oldField = makeField({ pk: 'A', config: { a: 1 } });
		const newField = makeField({ pk: 'A', config: { a: 2 } });
		expect(hasMetadataFieldChanged(oldField as any, newField as any)).toBe(true);
	});

	it('detects mandatory changes', () => {
		const oldField = makeField({ pk: 'A', mandatory: false });
		const newField = makeField({ pk: 'A', mandatory: true });
		expect(hasMetadataFieldChanged(oldField as any, newField as any)).toBe(true);
	});

	it('detects field_type changes', () => {
		const oldField = makeField({ pk: 'A', field_type: 'text' });
		const newField = makeField({ pk: 'A', field_type: 'number' });
		expect(hasMetadataFieldChanged(oldField as any, newField as any)).toBe(true);
	});
});

describe('getOrderValue', () => {
	it('returns the number for numeric values', () => {
		expect(getOrderValue(0)).toBe(0);
		expect(getOrderValue(1)).toBe(1);
		expect(getOrderValue(-5)).toBe(-5);
		expect(getOrderValue(100)).toBe(100);
	});

	it('returns POSITIVE_INFINITY for null', () => {
		expect(getOrderValue(null)).toBe(Number.POSITIVE_INFINITY);
	});

	it('returns POSITIVE_INFINITY for undefined', () => {
		expect(getOrderValue(undefined)).toBe(Number.POSITIVE_INFINITY);
	});
});

describe('stableSortFieldsByOrder', () => {
	it('sorts fields by order value', () => {
		const fields = [
			makeField({ pk: 'C', order: 3 }),
			makeField({ pk: 'A', order: 1 }),
			makeField({ pk: 'B', order: 2 }),
		];

		const sorted = stableSortFieldsByOrder(fields);

		expect(sorted.map((field) => field.pk)).toEqual(['A', 'B', 'C']);
	});

	it('preserves input order for equal order values', () => {
		const fields = [
			makeField({ pk: 'first', order: 1 }),
			makeField({ pk: 'second', order: 1 }),
			makeField({ pk: 'third', order: 1 }),
		];

		const sorted = stableSortFieldsByOrder(fields);

		expect(sorted.map((field) => field.pk)).toEqual(['first', 'second', 'third']);
	});

	it('handles empty array', () => {
		expect(stableSortFieldsByOrder([])).toEqual([]);
	});

	it('places null order fields at the end', () => {
		const fields = [makeField({ pk: 'null', order: null }), makeField({ pk: 'one', order: 1 })];

		const sorted = stableSortFieldsByOrder(fields);

		expect(sorted.map((field) => field.pk)).toEqual(['one', 'null']);
	});
});

describe('compareAdditions', () => {
	it('sorts by orderValue first', () => {
		const a: AdditionInfo = { next: makeField({ pk: 'A' }), orderValue: 2, compareSortedIndex: 0 };
		const b: AdditionInfo = { next: makeField({ pk: 'B' }), orderValue: 1, compareSortedIndex: 0 };

		expect(compareAdditions(a, b)).toBeGreaterThan(0);
		expect(compareAdditions(b, a)).toBeLessThan(0);
	});

	it('sorts by compareSortedIndex when orderValue ties', () => {
		const a: AdditionInfo = { next: makeField({ pk: 'A' }), orderValue: 1, compareSortedIndex: 2 };
		const b: AdditionInfo = { next: makeField({ pk: 'B' }), orderValue: 1, compareSortedIndex: 1 };

		expect(compareAdditions(a, b)).toBeGreaterThan(0);
		expect(compareAdditions(b, a)).toBeLessThan(0);
	});

	it('sorts by pk when both orderValue and compareSortedIndex tie', () => {
		const a: AdditionInfo = { next: makeField({ pk: 'A' }), orderValue: 1, compareSortedIndex: 1 };
		const b: AdditionInfo = { next: makeField({ pk: 'B' }), orderValue: 1, compareSortedIndex: 1 };

		expect(compareAdditions(a, b)).toBeLessThan(0);
		expect(compareAdditions(b, a)).toBeGreaterThan(0);
	});

	it('returns 0 for identical additions', () => {
		const a: AdditionInfo = { next: makeField({ pk: 'A' }), orderValue: 1, compareSortedIndex: 1 };
		const b: AdditionInfo = { next: makeField({ pk: 'A' }), orderValue: 1, compareSortedIndex: 1 };

		expect(compareAdditions(a, b)).toBe(0);
	});
});

describe('entryOrderValue', () => {
	it('returns next.order for added entries', () => {
		const entry: MetadataFieldDiffTimelineEntry = {
			type: 'added',
			next: makeField({ pk: 'A', order: 5 }),
		};

		expect(entryOrderValue(entry)).toBe(5);
	});

	it('returns current.order for removed entries', () => {
		const entry: MetadataFieldDiffTimelineEntry = {
			type: 'removed',
			current: makeField({ pk: 'A', order: 3 }),
		};

		expect(entryOrderValue(entry)).toBe(3);
	});

	it('returns current.order for unchanged entries', () => {
		const entry: MetadataFieldDiffTimelineEntry = {
			type: 'unchanged',
			current: makeField({ pk: 'A', order: 7 }),
		};

		expect(entryOrderValue(entry)).toBe(7);
	});

	it('returns next.order for changed entries when finite', () => {
		const entry: MetadataFieldDiffTimelineEntry = {
			type: 'changed',
			current: makeField({ pk: 'A', order: 2 }),
			next: makeField({ pk: 'B', order: 5 }),
		};

		expect(entryOrderValue(entry)).toBe(5);
	});

	it('falls back to current.order for changed entries when next.order is null', () => {
		const entry: MetadataFieldDiffTimelineEntry = {
			type: 'changed',
			current: makeField({ pk: 'A', order: 2 }),
			next: makeField({ pk: 'B', order: null }),
		};

		expect(entryOrderValue(entry)).toBe(2);
	});

	it('returns POSITIVE_INFINITY for entries with null order', () => {
		const entry: MetadataFieldDiffTimelineEntry = {
			type: 'unchanged',
			current: makeField({ pk: 'A', order: null }),
		};

		expect(entryOrderValue(entry)).toBe(Number.POSITIVE_INFINITY);
	});
});

describe('buildTimeline', () => {
	it('builds timeline with additions at start', () => {
		const additionsAfterMap = new Map<string | null, any[]>([
			[null, [{ next: makeField({ pk: 'new' }), orderValue: 0, compareSortedIndex: 0, insertAfterPk: null }]],
		]);

		const timeline = buildTimeline({
			additionsAfterMap,
			changedNextByOldPk: new Map(),
			currentFieldsSorted: [],
			removedOldPkSet: new Set(),
		});

		expect(timeline).toHaveLength(1);
		expect(timeline[0]?.type).toBe('added');
	});

	it('marks fields as unchanged when not in change/remove sets', () => {
		const current = makeField({ pk: 'A', order: 1 });

		const timeline = buildTimeline({
			additionsAfterMap: new Map(),
			changedNextByOldPk: new Map(),
			currentFieldsSorted: [current],
			removedOldPkSet: new Set(),
		});

		expect(timeline).toHaveLength(1);
		expect(timeline[0]?.type).toBe('unchanged');
	});

	it('marks fields as changed when in changedNextByOldPk', () => {
		const current = makeField({ pk: 'A', order: 1 });
		const next = makeField({ pk: 'B', order: 2 });

		const timeline = buildTimeline({
			additionsAfterMap: new Map(),
			changedNextByOldPk: new Map([['A', next]]),
			currentFieldsSorted: [current],
			removedOldPkSet: new Set(),
		});

		expect(timeline).toHaveLength(1);
		expect(timeline[0]?.type).toBe('changed');
	});

	it('marks fields as removed when in removedOldPkSet', () => {
		const current = makeField({ pk: 'A', order: 1 });

		const timeline = buildTimeline({
			additionsAfterMap: new Map(),
			changedNextByOldPk: new Map(),
			currentFieldsSorted: [current],
			removedOldPkSet: new Set(['A']),
		});

		expect(timeline).toHaveLength(1);
		expect(timeline[0]?.type).toBe('removed');
	});

	it('inserts additions after their anchor', () => {
		const current = makeField({ pk: 'A', order: 1 });
		const additionsAfterMap = new Map<string | null, any[]>([
			['A', [{ next: makeField({ pk: 'new' }), orderValue: 2, compareSortedIndex: 0, insertAfterPk: 'A' }]],
		]);

		const timeline = buildTimeline({
			additionsAfterMap,
			changedNextByOldPk: new Map(),
			currentFieldsSorted: [current],
			removedOldPkSet: new Set(),
		});

		expect(timeline).toHaveLength(2);
		expect(timeline.map((entry) => entryPk(entry))).toEqual(['A', 'new']);
	});
});

describe('stableSortTimelineByOrder', () => {
	it('sorts by order value', () => {
		const timeline: MetadataFieldDiffTimelineEntry[] = [
			{ type: 'unchanged', current: makeField({ pk: 'C', order: 3 }) },
			{ type: 'unchanged', current: makeField({ pk: 'A', order: 1 }) },
			{ type: 'unchanged', current: makeField({ pk: 'B', order: 2 }) },
		];

		const sorted = stableSortTimelineByOrder(timeline);

		expect(sorted.map(entryPk)).toEqual(['A', 'B', 'C']);
	});

	it('preserves input order for equal order values', () => {
		const timeline: MetadataFieldDiffTimelineEntry[] = [
			{ type: 'unchanged', current: makeField({ pk: 'first', order: 1 }) },
			{ type: 'unchanged', current: makeField({ pk: 'second', order: 1 }) },
			{ type: 'unchanged', current: makeField({ pk: 'third', order: 1 }) },
		];

		const sorted = stableSortTimelineByOrder(timeline);

		expect(sorted.map(entryPk)).toEqual(['first', 'second', 'third']);
	});

	it('handles empty timeline', () => {
		expect(stableSortTimelineByOrder([])).toEqual([]);
	});

	it('handles mixed entry types', () => {
		const timeline: MetadataFieldDiffTimelineEntry[] = [
			{ type: 'added', next: makeField({ pk: 'new', order: 2 }) },
			{ type: 'unchanged', current: makeField({ pk: 'existing', order: 1 }) },
			{ type: 'removed', current: makeField({ pk: 'old', order: 3 }) },
		];

		const sorted = stableSortTimelineByOrder(timeline);

		expect(sorted.map(entryPk)).toEqual(['existing', 'new', 'old']);
	});
});

describe('buildAdditionsAfterMap', () => {
	it('places additions using previous_version_field anchor', () => {
		const currentA = makeField({ pk: 'A', order: 1 });
		const newField = makeField({ pk: 'new', order: 2, previous_version_field: 'A' });

		const result = buildAdditionsAfterMap({
			additions: [{ next: newField, orderValue: 2, compareSortedIndex: 0 }],
			compareFieldsSorted: [],
			currentFieldsSorted: [currentA],
			currentOrderIndexByPk: new Map([['A', 0]]),
		});

		expect(result.get('A')).toHaveLength(1);
		expect(result.get('A')![0]?.next.pk).toBe('new');
	});

	it('places additions at start when no anchor found', () => {
		const newField = makeField({ pk: 'new', order: 0 });

		const result = buildAdditionsAfterMap({
			additions: [{ next: newField, orderValue: 0, compareSortedIndex: 0 }],
			compareFieldsSorted: [],
			currentFieldsSorted: [],
			currentOrderIndexByPk: new Map(),
		});

		expect(result.get(null)).toHaveLength(1);
		expect(result.get(null)![0]?.next.pk).toBe('new');
	});

	it('uses order-based fallback when no previous_version_field', () => {
		const currentA = makeField({ pk: 'A', order: 1 });
		const currentB = makeField({ pk: 'B', order: 5 });
		const newField = makeField({ pk: 'new', order: 3 });

		const result = buildAdditionsAfterMap({
			additions: [{ next: newField, orderValue: 3, compareSortedIndex: Number.POSITIVE_INFINITY }],
			compareFieldsSorted: [],
			currentFieldsSorted: [currentA, currentB],
			currentOrderIndexByPk: new Map([
				['A', 0],
				['B', 1],
			]),
		});

		// Should be placed after 'A' (order 1 <= 3) but before 'B' (order 5 > 3)
		expect(result.get('A')).toHaveLength(1);
		expect(result.get('A')![0]?.next.pk).toBe('new');
	});

	it('handles multiple additions sorted correctly', () => {
		const currentA = makeField({ pk: 'A', order: 1 });
		const newX = makeField({ pk: 'X', order: 2, previous_version_field: 'A' });
		const newY = makeField({ pk: 'Y', order: 3, previous_version_field: 'A' });

		const result = buildAdditionsAfterMap({
			additions: [
				{ next: newY, orderValue: 3, compareSortedIndex: 1 },
				{ next: newX, orderValue: 2, compareSortedIndex: 0 },
			],
			compareFieldsSorted: [],
			currentFieldsSorted: [currentA],
			currentOrderIndexByPk: new Map([['A', 0]]),
		});

		const afterA = result.get('A');
		expect(afterA).toHaveLength(2);
		expect(afterA![0]?.next.pk).toBe('X');
		expect(afterA![1]?.next.pk).toBe('Y');
	});
});
