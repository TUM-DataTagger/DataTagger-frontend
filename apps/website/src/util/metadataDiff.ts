import { logger, LogCategory } from '@/util/logger';
import type { components } from '@/util/openapiSchema';

/**
 * Normalizes a value to a stable JSON string for comparison purposes.
 * Handles circular references, BigInt values, and null/undefined gracefully.
 */
export function normalizeForDiff(value: unknown): string {
	try {
		const seen = new WeakSet();
		const result = JSON.stringify(value ?? null, (_key, val) => {
			if (typeof val === 'bigint') return val.toString();
			if (typeof val === 'object' && val !== null) {
				if (seen.has(val as object)) return '[Circular]';
				seen.add(val as object);
			}

			return val;
		});
		return result ?? 'null';
	} catch (error) {
		logger.warn(LogCategory.Metadata, 'Failed to normalize value', {
			error: error instanceof Error ? error.message : 'Unknown',
		});
		return 'null';
	}
}

/**
 * Type representing a metadata field stripped of relational properties for diff comparison.
 * Excludes 'field' and 'metadata_template' which contain relationship data, not field content.
 */
export type DiffField = Omit<
	components['schemas']['MetadataTemplateField'] | components['schemas']['MinimalMetadata'],
	'field' | 'metadata_template'
>;

/**
 * Removes relational properties from a metadata field to create a clean diff-comparable object.
 * Uses object rest/spread to exclude only the relational properties while preserving all others.
 */
export function scrubMetadataField(
	field: components['schemas']['MetadataTemplateField'] | components['schemas']['MinimalMetadata'],
): DiffField {
	const { field: _ignoredField, metadata_template: _ignoredTemplate, ...rest } = field;
	return rest;
}

type ComparableMetadataKey =
	| 'config'
	| 'custom_key'
	| 'field_type'
	| 'mandatory'
	| 'metadata_template_field'
	| 'order'
	| 'value';

function getComparableValue(
	field: components['schemas']['MetadataTemplateField'] | components['schemas']['MinimalMetadata'],
	key: ComparableMetadataKey,
): unknown {
	if (!Object.hasOwn(field, key)) {
		return undefined;
	}

	return (field as Record<string, unknown>)[key];
}

/**
 * Determines if two metadata fields have meaningful differences in their content.
 * Compares key properties using normalized JSON stringification for deep equality.
 *
 * @param oldField - The previous version of the field
 * @param newField - The new version of the field
 * @returns true if any comparable property has changed
 */
export function hasMetadataFieldChanged(
	oldField: components['schemas']['MetadataTemplateField'] | components['schemas']['MinimalMetadata'],
	newField: components['schemas']['MetadataTemplateField'] | components['schemas']['MinimalMetadata'],
): boolean {
	const keysToCompare: ComparableMetadataKey[] = [
		'custom_key',
		'field_type',
		'mandatory',
		'value',
		'config',
		'order',
		'metadata_template_field',
	];

	return keysToCompare.some(
		(key) =>
			normalizeForDiff(getComparableValue(oldField, key)) !== normalizeForDiff(getComparableValue(newField, key)),
	);
}

/**
 * Extracts a numeric order value, using POSITIVE_INFINITY for null/undefined.
 * This ensures fields without explicit order sort to the end consistently.
 *
 * @internal
 */
export const getOrderValue = (order: number | null | undefined): number =>
	typeof order === 'number' ? order : Number.POSITIVE_INFINITY;

/**
 * Sorts fields by their order value, preserving input order for ties.
 * Uses a stable sort to avoid surprising UUID-based shuffles.
 *
 * @internal
 */
export const stableSortFieldsByOrder = (fields: readonly DiffField[]): DiffField[] =>
	fields
		.map((field, index) => ({ field, index }))
		.sort((a, b) => {
			const orderDelta = getOrderValue(a.field.order) - getOrderValue(b.field.order);
			if (orderDelta !== 0) {
				return orderDelta;
			}

			// Preserve input order for ties so we don't get surprising UUID-based shuffles.
			return a.index - b.index;
		})
		.map(({ field }) => field);

/**
 * Represents a single entry in the metadata diff timeline.
 *
 * - `unchanged`: Field exists in both versions with no changes
 * - `changed`: Field exists in both but has modified content (shows before/after)
 * - `added`: Field only exists in the new version
 * - `removed`: Field only exists in the old version
 */
export type MetadataFieldDiffTimelineEntry =
	| { readonly current: DiffField; readonly next: DiffField; readonly type: 'changed' }
	| { readonly current: DiffField; readonly type: 'removed' }
	| { readonly current: DiffField; readonly type: 'unchanged' }
	| { readonly next: DiffField; readonly type: 'added' };

/**
 * @internal
 */
export type AdditionInfo = {
	readonly compareSortedIndex: number;
	readonly next: DiffField;
	readonly orderValue: number;
};

/**
 * @internal
 */
export type AdditionPlacement = AdditionInfo & { readonly insertAfterPk: string | null };

/**
 * Comparator for sorting additions by order value, then compare index, then pk.
 *
 * @internal
 */
export const compareAdditions = (a: AdditionInfo, b: AdditionInfo): number => {
	if (a.orderValue !== b.orderValue) {
		return a.orderValue - b.orderValue;
	}

	if (a.compareSortedIndex !== b.compareSortedIndex) {
		return a.compareSortedIndex - b.compareSortedIndex;
	}

	return a.next.pk.localeCompare(b.next.pk);
};

/**
 * Extracts the effective order value from a timeline entry.
 * For changed entries, prefers the next order; falls back to current.
 *
 * @internal
 */
export const entryOrderValue = (entry: MetadataFieldDiffTimelineEntry): number => {
	if (entry.type === 'added') {
		return getOrderValue(entry.next.order);
	}

	if (entry.type === 'changed') {
		const nextOrder = getOrderValue(entry.next.order);
		if (Number.isFinite(nextOrder)) {
			return nextOrder;
		}

		return getOrderValue(entry.current.order);
	}

	return getOrderValue(entry.current.order);
};

/**
 * Builds a map of where to insert added fields in the timeline.
 *
 * ## Anchor-Finding Strategy (Three-Tier Fallback)
 *
 * For each new field, we determine the best position using this priority:
 *
 * 1. **previous_version_field**: If the new field declares a predecessor and that
 *    predecessor exists in the current fields, place after it. This provides the
 *    most reliable positioning from explicit lineage.
 *
 * 2. **Compare Array Position**: Walk backwards through the compare array from the
 *    new field's position. If we find a field that has a previous_version_field
 *    in current, use that as the anchor. This maintains relative ordering from
 *    the compare version.
 *
 * 3. **Order-Based Fallback**: If neither above works, find the last current field
 *    with an order value less than or equal to the new field's order. This preserves
 *    the `order` property's intent when explicit lineage is unavailable.
 *
 * @returns Map from anchor pk (or null for start) to list of additions after that anchor
 * @internal
 */
export function buildAdditionsAfterMap(args: {
	readonly additions: readonly AdditionInfo[];
	readonly compareFieldsSorted: readonly DiffField[];
	readonly currentFieldsSorted: readonly DiffField[];
	readonly currentOrderIndexByPk: ReadonlyMap<string, number>;
}): Map<string | null, AdditionPlacement[]> {
	const additions = args.additions.slice().sort(compareAdditions);

	const placementByAddedPk = new Map<string, string | null>();

	const tryFindAnchorFromCompare = (addition: AdditionInfo) => {
		if (!Number.isFinite(addition.compareSortedIndex)) {
			return null;
		}

		for (let idx = addition.compareSortedIndex - 1; idx >= 0; idx -= 1) {
			const candidate = args.compareFieldsSorted[idx];
			if (!candidate) {
				continue;
			}

			if (placementByAddedPk.has(candidate.pk)) {
				return placementByAddedPk.get(candidate.pk) ?? null;
			}

			if (candidate.previous_version_field && args.currentOrderIndexByPk.has(candidate.previous_version_field)) {
				return candidate.previous_version_field;
			}
		}

		return null;
	};

	const additionsAfterMap = new Map<string | null, AdditionPlacement[]>();

	for (const addition of additions) {
		let insertAfterPk: string | null = null;

		if (addition.next.previous_version_field && args.currentOrderIndexByPk.has(addition.next.previous_version_field)) {
			insertAfterPk = addition.next.previous_version_field;
		} else if (args.compareFieldsSorted.length) {
			insertAfterPk = tryFindAnchorFromCompare(addition);
		}

		if (insertAfterPk === null && args.currentFieldsSorted.length) {
			for (let idx = args.currentFieldsSorted.length - 1; idx >= 0; idx -= 1) {
				const candidate = args.currentFieldsSorted[idx];
				if (!candidate) {
					continue;
				}

				const candidateOrderValue = getOrderValue(candidate.order);
				if (candidateOrderValue <= addition.orderValue) {
					insertAfterPk = candidate.pk;
					break;
				}
			}
		}

		const placement: AdditionPlacement = {
			next: addition.next,
			insertAfterPk,
			orderValue: addition.orderValue,
			compareSortedIndex: addition.compareSortedIndex,
		};

		const anchor = insertAfterPk ?? null;
		const list = additionsAfterMap.get(anchor) ?? [];
		list.push(placement);
		additionsAfterMap.set(anchor, list);

		placementByAddedPk.set(addition.next.pk, insertAfterPk);
	}

	for (const list of additionsAfterMap.values()) {
		list.sort(compareAdditions);
	}

	return additionsAfterMap;
}

/**
 * Constructs the timeline from classified field maps.
 * Interleaves additions, changes, removals, and unchanged entries.
 *
 * @internal
 */
export function buildTimeline(args: {
	readonly additionsAfterMap: ReadonlyMap<string | null, readonly AdditionPlacement[]>;
	readonly changedNextByOldPk: ReadonlyMap<string, DiffField>;
	readonly currentFieldsSorted: readonly DiffField[];
	readonly removedOldPkSet: ReadonlySet<string>;
}): MetadataFieldDiffTimelineEntry[] {
	const timeline: MetadataFieldDiffTimelineEntry[] = [];

	const appendAdditions = (anchor: string | null) => {
		const list = args.additionsAfterMap.get(anchor ?? null);
		if (!list) {
			return;
		}

		for (const addition of list) {
			timeline.push({ type: 'added', next: addition.next });
		}
	};

	appendAdditions(null);

	for (const current of args.currentFieldsSorted) {
		const next = args.changedNextByOldPk.get(current.pk);
		if (next) {
			timeline.push({ type: 'changed', current, next });
		} else if (args.removedOldPkSet.has(current.pk)) {
			timeline.push({ type: 'removed', current });
		} else {
			timeline.push({ type: 'unchanged', current });
		}

		appendAdditions(current.pk);
	}

	return timeline;
}

/**
 * Stable sort of timeline entries by their order values.
 * Preserves input order for entries with identical order values.
 *
 * @internal
 */
export const stableSortTimelineByOrder = (
	timeline: readonly MetadataFieldDiffTimelineEntry[],
): MetadataFieldDiffTimelineEntry[] =>
	timeline
		.map((entry, index) => ({ entry, index, orderValue: entryOrderValue(entry) }))
		.sort((a, b) => {
			if (a.orderValue !== b.orderValue) {
				return a.orderValue - b.orderValue;
			}

			return a.index - b.index;
		})
		.map(({ entry }) => entry);

/**
 * Type representing diff values from either metadata template or uploads version schemas.
 */
type DiffValueType =
	| components['schemas']['MetadataTemplateDiffValue'][]
	| components['schemas']['UploadsVersionDiffValue'][];

/**
 * Builds a diff timeline showing changes between two versions of metadata fields.
 *
 * The timeline is ordered to maintain visual coherence, interleaving added, changed,
 * removed, and unchanged entries based on their order values and positional relationships.
 *
 * @param options - Configuration object
 * @param options.currentFields - The base/previous version fields (displayed as "current")
 * @param options.compareFields - Optional newer version fields for anchor reference
 * @param options.diffValues - Array of diff entries describing old-to-new field mappings
 * @returns Ordered timeline of diff entries suitable for rendering
 */
export function buildMetadataDiffTimeline(options: {
	readonly compareFields?: readonly DiffField[] | undefined;
	readonly currentFields: readonly DiffField[];
	readonly diffValues?: DiffValueType | undefined;
}): MetadataFieldDiffTimelineEntry[] {
	if (!options.currentFields.length && !options.diffValues?.length) {
		return [];
	}

	const currentFieldsSorted = stableSortFieldsByOrder(options.currentFields);
	const compareFieldsSorted = stableSortFieldsByOrder(options.compareFields ?? []);
	const diffValues = options.diffValues ?? [];

	const currentOrderIndexByPk = new Map(currentFieldsSorted.map((field, index) => [field.pk, index] as const));
	const compareOrderIndexByPk = new Map(compareFieldsSorted.map((field, index) => [field.pk, index] as const));

	const changedNextByOldPk = new Map<string, DiffField>();
	const removedOldPkSet = new Set<string>();
	const additions: AdditionInfo[] = [];

	for (const value of diffValues) {
		if (value.old && value.new) {
			if (hasMetadataFieldChanged(value.old, value.new)) {
				changedNextByOldPk.set(value.old.pk, scrubMetadataField(value.new));
			}
		} else if (value.old && !value.new) {
			removedOldPkSet.add(value.old.pk);
		} else if (!value.old && value.new) {
			const next = scrubMetadataField(value.new);
			const orderValue = getOrderValue(next.order);
			const compareSortedIndex = compareOrderIndexByPk.get(next.pk) ?? Number.POSITIVE_INFINITY;
			additions.push({ next, orderValue, compareSortedIndex });
		}
	}

	const additionsAfterMap = buildAdditionsAfterMap({
		additions,
		compareFieldsSorted,
		currentFieldsSorted,
		currentOrderIndexByPk,
	});

	const timeline = buildTimeline({
		additionsAfterMap,
		changedNextByOldPk,
		currentFieldsSorted,
		removedOldPkSet,
	});

	return stableSortTimelineByOrder(timeline);
}
