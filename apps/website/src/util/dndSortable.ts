type SortableIndices = {
	readonly index: number;
	readonly initialIndex: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

export function getSortableDragIndices(event: unknown): SortableIndices | undefined {
	if (!isRecord(event)) {
		return undefined;
	}

	const operation = event.operation;
	if (!isRecord(operation)) {
		return undefined;
	}

	const target = operation.target;
	if (!isRecord(target)) {
		return undefined;
	}

	const sortable = target.sortable;
	if (!isRecord(sortable)) {
		return undefined;
	}

	const initialIndex = sortable.initialIndex;
	const index = sortable.index;

	if (typeof initialIndex !== 'number' || typeof index !== 'number') {
		return undefined;
	}

	return { initialIndex, index };
}
