import { describe, expect, it } from 'vitest';
import { clusterContext, filterContext, getBoundedMetadataKeys } from '@/util/filterContext';
import type {
	MetadataClusterInput,
	MetadataClusterRowInput,
	SearchFilterConnector,
	SearchFilterItemInput,
	SearchFilterValue,
} from '@/util/globalSearch';

function row(
	field: string,
	operator: string,
	value: SearchFilterValue,
	connector?: SearchFilterConnector,
): SearchFilterItemInput {
	return { kind: 'row', ...(connector ? { connector } : {}), field, operator, value };
}

let nextClusterId = 0;
function cluster(
	rows: MetadataClusterRowInput[],
	connector?: SearchFilterConnector,
): MetadataClusterInput & {
	readonly id: string;
} {
	nextClusterId += 1;
	return { kind: 'cluster', id: `cluster-${nextClusterId}`, ...(connector ? { connector } : {}), rows };
}

function clusterRow(field: MetadataClusterRowInput['field'], operator: string, value: SearchFilterValue) {
	return { field, operator, value };
}

const emptyScope = {
	projectIds: [],
	folderIds: [],
	datasetIds: [],
	templateIds: [],
	projectNames: [],
	folderNames: [],
	datasetNames: [],
	templateNames: [],
};

describe('filterContext — whole-set view', () => {
	it('returns whole-set scope from a top-level scope row', () => {
		const ctx = filterContext([row('project_id', 'is', 'proj-1')]);
		expect(ctx.scope).toEqual({ ...emptyScope, projectIds: ['proj-1'] });
	});

	it('returns undefined scope for an empty item list', () => {
		expect(filterContext([]).scope).toBeUndefined();
	});

	it('ignores clusters when computing whole-set scope (scope is top-level only)', () => {
		const ctx = filterContext([
			cluster([clusterRow('metadata.key', 'is', 'temperature'), clusterRow('metadata.value', 'gt', '30')]),
		]);
		expect(ctx.scope).toBeUndefined();
	});

	it('exposes a cluster(id) lookup for per-cluster narrowing', () => {
		const singleCluster = cluster([
			clusterRow('metadata.field_type', 'is', 'INTEGER'),
			clusterRow('metadata.value', 'gt', '30'),
		]);
		const ctx = filterContext([singleCluster]);
		expect(ctx.cluster(singleCluster.id).inferredFieldType).toBe('INTEGER');
	});

	it('returns an undefined narrowing for an unknown cluster id', () => {
		const ctx = filterContext([]);
		expect(ctx.cluster('does-not-exist').inferredFieldType).toBeUndefined();
	});

	it('per-cluster narrowing is independent across clusters', () => {
		const numericCluster = cluster([
			clusterRow('metadata.field_type', 'is', 'INTEGER'),
			clusterRow('metadata.value', 'gt', '30'),
		]);
		const textCluster = cluster([clusterRow('metadata.value', 'contains', 'abc')]);
		const ctx = filterContext([numericCluster, textCluster]);
		expect(ctx.cluster(numericCluster.id).inferredFieldType).toBe('INTEGER');
		expect(ctx.cluster(textCluster.id).inferredFieldType).toBeUndefined();
	});
});

describe('clusterContext — per-cluster narrowing signal', () => {
	it.each(['TEXT', 'INTEGER', 'DECIMAL', 'DATE', 'DATETIME', 'TIME'] as const)(
		'returns %s for a cluster with a single metadata.field_type is %s row',
		(scalar) => {
			expect(clusterContext([clusterRow('metadata.field_type', 'is', scalar)]).inferredFieldType).toBe(scalar);
		},
	);

	it.each(['SELECTION', 'MULTI_SELECTION', 'TAG'] as const)('returns %s for a choice narrowing signal', (choice) => {
		expect(clusterContext([clusterRow('metadata.field_type', 'is', choice)]).inferredFieldType).toBe(choice);
	});

	it('returns undefined for an empty cluster', () => {
		expect(clusterContext([]).inferredFieldType).toBeUndefined();
	});

	it('returns undefined for a cluster without a metadata.field_type row', () => {
		expect(
			clusterContext([clusterRow('metadata.key', 'is', 'temp'), clusterRow('metadata.value', 'gt', '30')])
				.inferredFieldType,
		).toBeUndefined();
	});

	it('returns undefined for WYSIWYG because it has no choice or typed search semantics', () => {
		expect(clusterContext([clusterRow('metadata.field_type', 'is', 'WYSIWYG')]).inferredFieldType).toBeUndefined();
	});

	it.each(['is_not', 'in', 'not_in', 'is_empty', 'is_not_empty'] as const)(
		'returns undefined for non-is operator %s',
		(operator) => {
			expect(
				clusterContext([clusterRow('metadata.field_type', operator, 'INTEGER')]).inferredFieldType,
			).toBeUndefined();
		},
	);

	it('returns undefined when the field_type value is not a single non-empty string', () => {
		expect(clusterContext([clusterRow('metadata.field_type', 'is', ['INTEGER'])]).inferredFieldType).toBeUndefined();
		expect(clusterContext([clusterRow('metadata.field_type', 'is', null)]).inferredFieldType).toBeUndefined();
		expect(clusterContext([clusterRow('metadata.field_type', 'is', true)]).inferredFieldType).toBeUndefined();
	});
});

describe('getBoundedMetadataKeys', () => {
	it('returns exact single and set keys without duplicates', () => {
		expect(getBoundedMetadataKeys([clusterRow('metadata.key', 'is', 'status')])).toEqual(['status']);
		expect(getBoundedMetadataKeys([clusterRow('metadata.key', 'in', ['status', 'priority', 'status'])])).toEqual([
			'status',
			'priority',
		]);
	});

	it.each(['contains', 'starts_with', 'is_not', 'not_in'])(
		'returns no keys for non-bounded operator %s',
		(operator) => {
			expect(getBoundedMetadataKeys([clusterRow('metadata.key', operator, 'status')])).toEqual([]);
		},
	);
});

describe('filterContext.scope — scope row recognition (top-level only)', () => {
	it('returns project scope for one project_id is X row', () => {
		expect(filterContext([row('project_id', 'is', 'proj-1')]).scope).toEqual({
			...emptyScope,
			projectIds: ['proj-1'],
		});
	});

	it('returns folder scope for one folder_id is X row', () => {
		expect(filterContext([row('folder_id', 'is', 'fol-1')]).scope).toEqual({
			...emptyScope,
			folderIds: ['fol-1'],
		});
	});

	it('returns dataset scope for one dataset_id is X row', () => {
		expect(filterContext([row('dataset_id', 'is', 'ds-1')]).scope).toEqual({
			...emptyScope,
			datasetIds: ['ds-1'],
		});
	});

	it('aggregates two scope rows of the same kind', () => {
		expect(filterContext([row('project_id', 'is', 'proj-1'), row('project_id', 'is', 'proj-2')]).scope).toEqual({
			...emptyScope,
			projectIds: ['proj-1', 'proj-2'],
		});
	});

	it('aggregates scope rows of different kinds (backend dedupes intersections)', () => {
		expect(filterContext([row('project_id', 'is', 'proj-1'), row('folder_id', 'is', 'fol-1')]).scope).toEqual({
			...emptyScope,
			projectIds: ['proj-1'],
			folderIds: ['fol-1'],
		});
	});

	it.each(['is_not', 'not_in', 'is_empty', 'is_not_empty', 'contains'] as const)(
		'returns undefined when the scope-eligible field uses operator %s',
		(operator) => {
			expect(filterContext([row('project_id', operator, 'proj-1')]).scope).toBeUndefined();
		},
	);

	it('returns scope for a single-value in operator on an id field', () => {
		expect(filterContext([row('folder_id', 'in', ['fol-1'])]).scope).toEqual({
			...emptyScope,
			folderIds: ['fol-1'],
		});
	});

	it('returns scope for a single-value in operator on a name field', () => {
		expect(filterContext([row('folder_name', 'in', ['My Folder'])]).scope).toEqual({
			...emptyScope,
			folderNames: ['My Folder'],
		});
	});

	it('returns scope for a multi-value in operator', () => {
		expect(filterContext([row('folder_id', 'in', ['fol-1', 'fol-2'])]).scope).toEqual({
			...emptyScope,
			folderIds: ['fol-1', 'fol-2'],
		});
	});

	it('returns undefined for an empty-array in operator', () => {
		expect(filterContext([row('folder_id', 'in', [])]).scope).toBeUndefined();
	});

	it('merges id and name rows for the same kind', () => {
		expect(filterContext([row('folder_id', 'is', 'fol-1'), row('folder_name', 'in', ['Foo', 'Bar'])]).scope).toEqual({
			...emptyScope,
			folderIds: ['fol-1'],
			folderNames: ['Foo', 'Bar'],
		});
	});

	it('skips empty-string and non-string array entries', () => {
		expect(filterContext([row('folder_id', 'in', ['fol-1', '', 'fol-2'])]).scope).toEqual({
			...emptyScope,
			folderIds: ['fol-1', 'fol-2'],
		});
	});

	it('returns undefined when the value is not a non-empty string for is operator', () => {
		expect(filterContext([row('project_id', 'is', '')]).scope).toBeUndefined();
		expect(filterContext([row('project_id', 'is', null)]).scope).toBeUndefined();
		expect(filterContext([row('project_id', 'is', true)]).scope).toBeUndefined();
	});

	it('returns template scope for a metadata.template_id is X row', () => {
		expect(filterContext([row('metadata.template_id', 'is', 'tpl-1')]).scope).toEqual({
			...emptyScope,
			templateIds: ['tpl-1'],
		});
	});

	it('returns undefined for an empty rows array', () => {
		expect(filterContext([]).scope).toBeUndefined();
	});

	it('returns project scope by name for a project_name is X row', () => {
		expect(filterContext([row('project_name', 'is', 'My Project')]).scope).toEqual({
			...emptyScope,
			projectNames: ['My Project'],
		});
	});

	it('returns folder scope by name for a folder_name is X row', () => {
		expect(filterContext([row('folder_name', 'is', 'My Folder')]).scope).toEqual({
			...emptyScope,
			folderNames: ['My Folder'],
		});
	});

	it('returns dataset scope by name for a dataset_name is X row', () => {
		expect(filterContext([row('dataset_name', 'is', 'My Dataset')]).scope).toEqual({
			...emptyScope,
			datasetNames: ['My Dataset'],
		});
	});

	it('returns template scope by name for a metadata.template_name is X row', () => {
		expect(filterContext([row('metadata.template_name', 'is', 'Compliance')]).scope).toEqual({
			...emptyScope,
			templateNames: ['Compliance'],
		});
	});

	it('aggregates two metadata.template_id is X rows into templateIds', () => {
		expect(
			filterContext([row('metadata.template_id', 'is', 'tpl-1'), row('metadata.template_id', 'is', 'tpl-2')]).scope,
		).toEqual({
			...emptyScope,
			templateIds: ['tpl-1', 'tpl-2'],
		});
	});

	it('combines template scope with entity scope independently', () => {
		expect(
			filterContext([row('project_id', 'is', 'proj-1'), row('metadata.template_id', 'is', 'tpl-1')]).scope,
		).toEqual({
			...emptyScope,
			projectIds: ['proj-1'],
			templateIds: ['tpl-1'],
		});
	});

	it('accepts in operator with multi-value array on metadata.template_id', () => {
		expect(filterContext([row('metadata.template_id', 'in', ['tpl-1', 'tpl-2'])]).scope).toEqual({
			...emptyScope,
			templateIds: ['tpl-1', 'tpl-2'],
		});
	});

	it.each(['is_not', 'not_in', 'is_empty', 'contains'] as const)(
		'ignores metadata.template_id rows whose operator is %s (not scope-eligible)',
		(operator) => {
			expect(filterContext([row('metadata.template_id', operator, 'tpl-1')]).scope).toBeUndefined();
		},
	);

	it('keeps both id and name entries when project_id and project_name rows coexist', () => {
		expect(filterContext([row('project_id', 'is', 'proj-1'), row('project_name', 'is', 'My Project')]).scope).toEqual({
			...emptyScope,
			projectIds: ['proj-1'],
			projectNames: ['My Project'],
		});
	});

	it('ignores non-scope-eligible rows and resolves the eligible row alongside them', () => {
		expect(filterContext([row('name', 'contains', 'foo'), row('folder_id', 'is', 'fol-1')]).scope).toEqual({
			...emptyScope,
			folderIds: ['fol-1'],
		});
	});
});
