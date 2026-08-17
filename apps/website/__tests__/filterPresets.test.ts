import { describe, expect, it } from 'vitest';
import { DEFAULT_FILTER_PRESET, FILTER_PRESETS, type FilterPreset, insertFilterPreset } from '@/util/filterPresets';
import {
	hydrateItems,
	isClusterEligibleField,
	isClusterItem,
	SEARCH_FIELD_PRESENTATION,
	type SearchFilterItemInput,
	stripItemIds,
} from '@/util/globalSearch';

function makePreset(items: readonly SearchFilterItemInput[]): FilterPreset {
	return { id: 'p', label: 'Preset', items };
}

describe('FILTER_PRESETS catalog', () => {
	it('uses Metadata as the default preset', () => {
		expect(DEFAULT_FILTER_PRESET).toBe(FILTER_PRESETS[0]);
		expect(DEFAULT_FILTER_PRESET).toMatchObject({
			id: 'project-folder-and-metadata-key-value',
			label: 'Metadata',
		});
	});

	it('ships only the four requested presets in display order', () => {
		expect(FILTER_PRESETS.map(({ id, label }) => ({ id, label }))).toEqual([
			{ id: 'project-folder-and-metadata-key-value', label: 'Metadata' },
			{ id: 'metadata-template-and-key', label: 'Metadata template' },
			{ id: 'date-metadata-range', label: 'Date range' },
			{ id: 'numeric-metadata-range', label: 'Numeric range' },
		]);
	});

	it('every preset round-trips through hydrateItems → stripItemIds → hydrateItems unchanged', () => {
		expect(FILTER_PRESETS.length).toBeGreaterThan(0);
		for (const preset of FILTER_PRESETS) {
			const onceStripped = stripItemIds(hydrateItems(preset.items));
			const twiceStripped = stripItemIds(hydrateItems(onceStripped));
			expect(twiceStripped).toEqual(onceStripped);
		}
	});

	it('every cluster in every preset has at most one row per cluster-eligible field', () => {
		for (const preset of FILTER_PRESETS) {
			for (const item of preset.items) {
				if (item.kind !== 'cluster') {
					continue;
				}
				const fields = item.rows.map((row) => row.field);
				const unique = new Set(fields);
				expect(unique.size, `preset "${preset.id}" cluster has duplicate fields: ${fields.join(', ')}`).toBe(
					fields.length,
				);
			}
		}
	});

	it('"Numeric range" preset pre-fills metadata.field_type with INTEGER to engage narrowing on insert', () => {
		const preset = FILTER_PRESETS.find((p) => p.id === 'numeric-metadata-range');
		expect(preset).toBeDefined();
		const cluster = preset!.items.find((item) => item.kind === 'cluster');
		expect(cluster).toBeDefined();
		const fieldTypeRow = cluster!.rows.find((row) => row.field === 'metadata.field_type');
		expect(fieldTypeRow).toMatchObject({ field: 'metadata.field_type', operator: 'is', value: 'INTEGER' });
	});

	it('"Date range" preset pre-fills metadata.field_type with DATE to engage narrowing on insert', () => {
		const preset = FILTER_PRESETS.find((p) => p.id === 'date-metadata-range');
		expect(preset).toBeDefined();
		const cluster = preset!.items.find((item) => item.kind === 'cluster');
		expect(cluster).toBeDefined();
		const fieldTypeRow = cluster!.rows.find((row) => row.field === 'metadata.field_type');
		expect(fieldTypeRow).toMatchObject({ field: 'metadata.field_type', operator: 'is', value: 'DATE' });
	});

	it('"Metadata template" preset filters by both metadata key and value', () => {
		const preset = FILTER_PRESETS.find((p) => p.id === 'metadata-template-and-key');
		expect(preset).toBeDefined();
		const cluster = preset!.items.find((item) => item.kind === 'cluster');
		expect(cluster).toBeDefined();
		expect(cluster!.rows).toEqual([
			{ field: 'metadata.key', operator: 'is', value: '' },
			{ field: 'metadata.value', operator: 'contains', value: '' },
		]);
	});

	it('uses one optional-folder preset instead of separate project and folder variants', () => {
		expect(FILTER_PRESETS.some((preset) => preset.id === 'project-and-metadata-key')).toBe(false);
		const preset = FILTER_PRESETS.find((candidate) => candidate.id === 'project-folder-and-metadata-key-value');
		expect(preset).toMatchObject({ label: 'Metadata' });
		expect(preset?.items).toEqual([
			{ kind: 'row', field: 'project_name', operator: 'is', value: '' },
			{ kind: 'row', field: 'folder_name', operator: 'is', value: '' },
			{
				kind: 'cluster',
				rows: [
					{ field: 'metadata.key', operator: 'is', value: '' },
					{ field: 'metadata.value', operator: 'contains', value: '' },
				],
			},
		]);
	});

	it('every preset cluster with a metadata key also includes a metadata value', () => {
		for (const preset of FILTER_PRESETS) {
			for (const item of preset.items) {
				if (item.kind !== 'cluster') {
					continue;
				}
				const fields = item.rows.map((row) => row.field);
				if (!fields.includes('metadata.key')) {
					continue;
				}
				expect(fields, `preset "${preset.id}" has metadata.key without metadata.value`).toContain('metadata.value');
			}
		}
	});

	it('cluster-eligible fields never appear at the top level of any preset', () => {
		for (const preset of FILTER_PRESETS) {
			for (const item of preset.items) {
				if (item.kind === 'row') {
					expect(
						isClusterEligibleField(item.field),
						`preset "${preset.id}" places cluster-eligible field "${item.field}" at the top level`,
					).toBe(false);
				}
			}
		}
	});

	it('no preset references a field marked hidden in SEARCH_FIELD_PRESENTATION', () => {
		const hidden = new Set(
			Object.entries(SEARCH_FIELD_PRESENTATION)
				.filter(([, entry]) => entry.hidden === true)
				.map(([id]) => id),
		);
		for (const preset of FILTER_PRESETS) {
			for (const item of preset.items) {
				if (item.kind === 'cluster') {
					for (const row of item.rows) {
						expect(hidden.has(row.field), `preset "${preset.id}" references hidden field "${row.field}"`).toBe(false);
					}
				} else {
					expect(hidden.has(item.field), `preset "${preset.id}" references hidden field "${item.field}"`).toBe(false);
				}
			}
		}
	});

	it('every field id referenced by a preset is known to SEARCH_FIELD_PRESENTATION', () => {
		const known = new Set(Object.keys(SEARCH_FIELD_PRESENTATION));
		for (const preset of FILTER_PRESETS) {
			for (const item of preset.items) {
				if (item.kind === 'cluster') {
					for (const row of item.rows) {
						expect(known.has(row.field), `preset "${preset.id}" references unknown field "${row.field}"`).toBe(true);
					}
				} else {
					expect(known.has(item.field), `preset "${preset.id}" references unknown field "${item.field}"`).toBe(true);
				}
			}
		}
	});
});

describe('insertFilterPreset — replace', () => {
	it('replaces a non-empty list with exactly the preset items, undefined first connector, fresh ids', () => {
		const existing = hydrateItems([
			{ kind: 'row', field: 'project_name', operator: 'is', value: 'Alpha' },
			{ kind: 'row', field: 'folder_name', operator: 'is', value: 'Beta' },
		]);
		const existingIds = existing.map((item) => item.id);
		const preset = makePreset([{ kind: 'row', field: 'dataset_name', operator: 'is', value: '' }]);

		const result = insertFilterPreset(existing, preset, 'replace');

		expect(result).toHaveLength(1);
		const only = result[0]!;
		expect(only).toMatchObject({ kind: 'row', field: 'dataset_name', operator: 'is', value: '' });
		expect(only.connector).toBeUndefined();
		expect(existingIds).not.toContain(only.kind === 'row' ? only.id : '');
	});

	it('replace on an empty list behaves identically to append on an empty list', () => {
		const preset = makePreset([
			{ kind: 'row', field: 'project_name', operator: 'is', value: '' },
			{ kind: 'row', field: 'folder_name', operator: 'is', value: '' },
		]);

		const appended = insertFilterPreset([], preset, 'append').map((item) => ({
			kind: item.kind,
			connector: item.connector,
			...(item.kind === 'row' ? { field: item.field, operator: item.operator, value: item.value } : {}),
		}));
		const replaced = insertFilterPreset([], preset, 'replace').map((item) => ({
			kind: item.kind,
			connector: item.connector,
			...(item.kind === 'row' ? { field: item.field, operator: item.operator, value: item.value } : {}),
		}));

		expect(replaced).toEqual(appended);
	});

	it('replace with a cluster preset hydrates fresh cluster id and fresh row ids', () => {
		const existing = hydrateItems([{ kind: 'row', field: 'project_name', operator: 'is', value: 'Alpha' }]);
		const preset = makePreset([
			{
				kind: 'cluster',
				rows: [
					{ field: 'metadata.key', operator: 'is', value: '' },
					{ field: 'metadata.field_type', operator: 'is', value: 'INTEGER' },
				],
			},
		]);

		const result = insertFilterPreset(existing, preset, 'replace');

		expect(result).toHaveLength(1);
		const cluster = result[0]!;
		if (!isClusterItem(cluster)) {
			throw new Error('expected cluster');
		}
		expect(cluster.id).toEqual(expect.any(String));
		expect(cluster.rows).toHaveLength(2);
		expect(cluster.rows[0]!.id).toEqual(expect.any(String));
		expect(cluster.rows[1]!.id).toEqual(expect.any(String));
		expect(cluster.rows[0]!.id).not.toBe(cluster.rows[1]!.id);
		expect(cluster.rows[1]).toMatchObject({ field: 'metadata.field_type', value: 'INTEGER' });
	});
});

describe('insertFilterPreset — append', () => {
	it('appends to an empty list with fresh ids and an undefined first-item connector', () => {
		const preset = makePreset([{ kind: 'row', field: 'project_name', operator: 'is', value: '' }]);

		const result = insertFilterPreset([], preset, 'append');

		expect(result).toHaveLength(1);
		const first = result[0]!;
		expect(first).toMatchObject({ kind: 'row', field: 'project_name', operator: 'is', value: '' });
		expect(first.connector).toBeUndefined();
		expect(first.kind === 'row' && first.id).toEqual(expect.any(String));
	});

	it('hydrates a cluster-containing preset with fresh cluster and row ids', () => {
		const preset = makePreset([
			{
				kind: 'cluster',
				rows: [
					{ field: 'metadata.key', operator: 'is', value: '' },
					{ field: 'metadata.value', operator: 'contains', value: '' },
				],
			},
		]);

		const result = insertFilterPreset([], preset, 'append');

		expect(result).toHaveLength(1);
		const [first] = result;
		expect(first && isClusterItem(first)).toBe(true);
		if (!first || !isClusterItem(first)) {
			throw new Error('expected cluster');
		}
		expect(first.id).toEqual(expect.any(String));
		expect(first.rows).toHaveLength(2);
		expect(first.rows[0]!.id).toEqual(expect.any(String));
		expect(first.rows[1]!.id).toEqual(expect.any(String));
		expect(first.rows[0]!.id).not.toBe(first.rows[1]!.id);
		expect(first.rows.map((row) => row.field)).toEqual(['metadata.key', 'metadata.value']);
	});

	it('produces distinct ids across two consecutive calls', () => {
		const preset = makePreset([
			{ kind: 'row', field: 'project_name', operator: 'is', value: '' },
			{
				kind: 'cluster',
				rows: [{ field: 'metadata.key', operator: 'is', value: '' }],
			},
		]);

		const first = insertFilterPreset([], preset, 'append');
		const second = insertFilterPreset([], preset, 'append');

		const idsOf = (items: ReturnType<typeof insertFilterPreset>) =>
			items.flatMap((item) => (isClusterItem(item) ? [item.id, ...item.rows.map((row) => row.id)] : [item.id]));

		const firstIds = idsOf(first);
		const secondIds = idsOf(second);
		expect(firstIds).toHaveLength(3);
		expect(secondIds).toHaveLength(3);
		const overlap = firstIds.filter((id) => secondIds.includes(id));
		expect(overlap).toEqual([]);
	});

	it('preserves literal pre-filled values verbatim (e.g. metadata.field_type = INTEGER)', () => {
		const preset = makePreset([
			{
				kind: 'cluster',
				rows: [
					{ field: 'metadata.key', operator: 'is', value: '' },
					{ field: 'metadata.field_type', operator: 'is', value: 'INTEGER' },
					{ field: 'metadata.value', operator: 'between', value: '' },
				],
			},
		]);

		const result = insertFilterPreset([], preset, 'append');
		const cluster = result[0];
		if (!cluster || !isClusterItem(cluster)) {
			throw new Error('expected cluster');
		}
		expect(cluster.rows.map((row) => ({ field: row.field, operator: row.operator, value: row.value }))).toEqual([
			{ field: 'metadata.key', operator: 'is', value: '' },
			{ field: 'metadata.field_type', operator: 'is', value: 'INTEGER' },
			{ field: 'metadata.value', operator: 'between', value: '' },
		]);
	});

	it('appends to a non-empty list, preserving existing items and setting AND on the first appended item', () => {
		const existing = hydrateItems([{ kind: 'row', field: 'project_name', operator: 'is', value: 'Alpha' }]);
		const existingId = existing[0]!.kind === 'row' ? existing[0]!.id : '';
		const preset = makePreset([
			{ kind: 'row', field: 'folder_name', operator: 'is', value: '' },
			{ kind: 'row', field: 'dataset_name', operator: 'is', value: '' },
		]);

		const result = insertFilterPreset(existing, preset, 'append');

		expect(result).toHaveLength(3);
		expect(result[0]).toMatchObject({ kind: 'row', field: 'project_name', value: 'Alpha' });
		expect(result[0]!.kind === 'row' && result[0]!.id).toBe(existingId);
		expect(result[1]).toMatchObject({ kind: 'row', field: 'folder_name', connector: 'AND' });
		expect(result[2]).toMatchObject({ kind: 'row', field: 'dataset_name', connector: 'AND' });
	});
});
