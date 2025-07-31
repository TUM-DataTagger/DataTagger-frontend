'use client';

import { SortByMenu, useSortByState } from '@/components/SortByMenu';

const sortOptions = {
	name: 'Project name A-Z',
	'-name': 'Project name Z-A',
	creation_date: 'Created first',
	'-creation_date': 'Created last',
};

export function ProjectsSortByMenu({ isDisabled = false }: { readonly isDisabled?: boolean }) {
	const sortState = useSortByState({ defaultSort: 'name' });

	return <SortByMenu isDisabled={isDisabled} options={sortOptions} sortState={sortState} />;
}
