export const TABLE_PAGE_LIMIT = 12;

export const GRID_PAGE_LIMIT_WITH_LEADING_ACTION = 11;

export function getEffectiveListLimit({
	isGridLayout,
	hasLeadingActionItem,
}: {
	readonly hasLeadingActionItem: boolean;
	readonly isGridLayout: boolean;
}) {
	if (isGridLayout && hasLeadingActionItem) {
		return GRID_PAGE_LIMIT_WITH_LEADING_ACTION;
	}

	return TABLE_PAGE_LIMIT;
}
