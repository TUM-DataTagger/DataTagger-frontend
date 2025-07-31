'use client';

import { SortByMenu, useSortByState } from '@/components/SortByMenu';

const sortOptions = {
	'-creation_date': 'Created last',
	creation_date: 'Created first',
	display_name: 'Name A-Z',
	'-display_name': 'Name Z-A',
	'-expiry_date': 'Closer to auto-delete',
};

export function DraftsSortByMenu({ isDisabled = false }: { readonly isDisabled?: boolean }) {
	const sortState = useSortByState({ defaultSort: '-creation_date' });

	return <SortByMenu isDisabled={isDisabled} options={sortOptions} sortState={sortState} />;
}
