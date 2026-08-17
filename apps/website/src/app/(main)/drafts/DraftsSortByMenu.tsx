'use client';

import { SortByMenu, useSortByState } from '@/components/query-controls/SortByMenu';
import { DRAFT_SORT_OPTIONS, type DraftSort } from '@/util/userSettingsOptions';

export function DraftsSortByMenu({
	defaultSort = '-creation_date',
	isDisabled = false,
}: {
	readonly defaultSort?: DraftSort;
	readonly isDisabled?: boolean;
}) {
	const sortState = useSortByState({ defaultSort });

	return <SortByMenu isDisabled={isDisabled} options={DRAFT_SORT_OPTIONS} sortState={sortState} />;
}
