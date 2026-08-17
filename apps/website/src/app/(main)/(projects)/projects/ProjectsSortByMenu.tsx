'use client';

import { SortByMenu, useSortByState } from '@/components/query-controls/SortByMenu';
import { PROJECT_SORT_OPTIONS, type ProjectSort } from '@/util/userSettingsOptions';

export function ProjectsSortByMenu({
	defaultSort = 'name',
	isDisabled = false,
}: {
	readonly defaultSort?: ProjectSort;
	readonly isDisabled?: boolean;
}) {
	const sortState = useSortByState({ defaultSort });

	return <SortByMenu isDisabled={isDisabled} options={PROJECT_SORT_OPTIONS} sortState={sortState} />;
}
