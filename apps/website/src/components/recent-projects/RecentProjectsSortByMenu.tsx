'use client';

import { SortByMenu, useSortByState } from '@/components/query-controls/SortByMenu';

const sortOptions = {
	last_worked_on: 'Last worked on',
};

export function RecentProjectsSortByMenu({ isDisabled = false }: { readonly isDisabled?: boolean }) {
	const sortState = useSortByState({
		defaultSort: 'last_worked_on',
		queryKey: 'recent_projects_sort',
	});

	return <SortByMenu isDisabled={isDisabled} options={sortOptions} sortState={sortState} />;
}
