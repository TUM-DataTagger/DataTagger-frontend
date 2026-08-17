'use client';

import { SortByMenu, useSortByState } from '@/components/query-controls/SortByMenu';
import { FOLDER_SORT_OPTIONS, type FolderSort } from '@/util/userSettingsOptions';

export function ProjectFoldersSortByMenu({
	defaultSort = 'name',
	isDisabled = false,
}: {
	readonly defaultSort?: FolderSort;
	readonly isDisabled?: boolean;
}) {
	const sortState = useSortByState({ defaultSort });

	return <SortByMenu isDisabled={isDisabled} options={FOLDER_SORT_OPTIONS} sortState={sortState} />;
}
