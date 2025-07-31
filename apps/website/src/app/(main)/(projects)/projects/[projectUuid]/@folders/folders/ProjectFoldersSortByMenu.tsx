'use client';

import { SortByMenu, useSortByState } from '@/components/SortByMenu';

const sortOptions = {
	name: 'Name A-Z',
	'-name': 'Name Z-A',
};

export function ProjectFoldersSortByMenu({ isDisabled = false }: { readonly isDisabled?: boolean }) {
	const sortState = useSortByState({ defaultSort: 'name' });

	return <SortByMenu isDisabled={isDisabled} options={sortOptions} sortState={sortState} />;
}
