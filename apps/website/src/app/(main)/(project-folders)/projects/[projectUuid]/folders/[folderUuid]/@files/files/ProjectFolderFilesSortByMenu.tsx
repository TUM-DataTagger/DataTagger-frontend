'use client';

import { SortByMenu, useSortByState } from '@/components/SortByMenu';

const sortOptions = {
	'-creation_date': 'Created last',
	creation_date: 'Created first',
	display_name: 'Name A-Z',
	'-display_name': 'Name Z-A',
};

export function ProjectFolderFilesSortByMenu({ isDisabled = false }: { readonly isDisabled?: boolean }) {
	const sortState = useSortByState({ defaultSort: 'display_name' });

	return <SortByMenu isDisabled={isDisabled} options={sortOptions} sortState={sortState} />;
}
