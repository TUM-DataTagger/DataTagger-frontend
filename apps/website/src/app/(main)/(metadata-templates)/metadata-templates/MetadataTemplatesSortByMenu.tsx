'use client';

import { SortByMenu, useSortByState } from '@/components/SortByMenu';

const sortOptions = {
	name: 'Metadata template name A-Z',
	'-name': 'Metadata template name Z-A',
};

export function MetadataTemplatesSortByMenu({ isDisabled = false }: { readonly isDisabled?: boolean }) {
	const sortState = useSortByState({ defaultSort: 'name' });

	return <SortByMenu isDisabled={isDisabled} options={sortOptions} sortState={sortState} />;
}
