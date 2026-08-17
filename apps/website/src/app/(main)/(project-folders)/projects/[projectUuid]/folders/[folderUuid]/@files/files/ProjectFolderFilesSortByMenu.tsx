'use client';

import { SortByMenu, useSortByState } from '@/components/query-controls/SortByMenu';
import { FILE_SORT_OPTIONS, type FileSort } from '@/util/userSettingsOptions';

export function ProjectFolderFilesSortByMenu({
	defaultSort = 'display_name',
	isDisabled = false,
}: {
	readonly defaultSort?: FileSort;
	readonly isDisabled?: boolean;
}) {
	const sortState = useSortByState({ defaultSort });

	return <SortByMenu isDisabled={isDisabled} options={FILE_SORT_OPTIONS} sortState={sortState} />;
}
