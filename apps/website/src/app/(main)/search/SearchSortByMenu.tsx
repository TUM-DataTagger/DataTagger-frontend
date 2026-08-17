'use client';

import { useEffect } from 'react';
import { SortByMenu, useSortByState } from '@/components/query-controls/SortByMenu';
import { getDefaultSearchSortKey, getSearchSortOptions } from './searchRouteCriteria';

export function SearchSortByMenu({
	isDisabled = false,
	searchText,
}: {
	readonly isDisabled?: boolean;
	readonly searchText?: string;
}) {
	const sortOptions = getSearchSortOptions(searchText);
	const defaultSort = getDefaultSearchSortKey(searchText);
	const sortState = useSortByState({ defaultSort });

	// Reset sort when the current selection is no longer available (e.g., relevance removed after clearing search text)
	// oxlint-disable-next-line typescript/no-misused-spread
	const selectedKey = [...sortState.selected].at(0) as string | undefined;
	const isSelectionValid = !selectedKey || selectedKey in sortOptions;

	useEffect(() => {
		if (!isSelectionValid) {
			void sortState.handleSort(defaultSort);
		}
	}, [isSelectionValid, defaultSort, sortState]);

	return <SortByMenu isDisabled={isDisabled} options={sortOptions} sortState={sortState} />;
}
