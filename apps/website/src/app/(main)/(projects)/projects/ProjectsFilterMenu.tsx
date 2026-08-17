'use client';

import { useMediaQuery } from 'usehooks-ts';
import { useFilterState, FilterMenu } from '@/components/query-controls/FilterMenu';
import { Button } from '@/components/ui/Button';

const createdByOptions = {
	me: 'Me',
	others: 'Others',
};

const myPermissionsOptions = {
	admin: 'Project admin',
	member: 'Member',
};

export function ProjectsFilterMenu({ isDisabled = false }: { readonly isDisabled?: boolean }) {
	const isMobile = useMediaQuery('(max-width: 600px)', { initializeWithValue: false });
	const createdByFilter = useFilterState({ options: createdByOptions, queryKey: 'created_by', label: 'Created by' });
	const myPermissionsFilter = useFilterState({
		options: myPermissionsOptions,
		queryKey: 'my_permissions',
		label: 'My permissions',
	});

	return (
		<div className="flex place-items-center gap-2">
			{isMobile ? (
				<FilterMenu filterStates={[createdByFilter, myPermissionsFilter]} isDisabled={isDisabled} label="Filter" />
			) : (
				<>
					<FilterMenu filterState={createdByFilter} isDisabled={isDisabled} label="Created by" />
					<FilterMenu filterState={myPermissionsFilter} isDisabled={isDisabled} label="My permissions" />
				</>
			)}

			{!isDisabled && (createdByFilter.selected.size > 0 || myPermissionsFilter.selected.size > 0) ? (
				<Button
					className="h-8 px-3 py-2"
					onPress={async () => {
						await createdByFilter.handleSelectionChange(new Set());
						await myPermissionsFilter.handleSelectionChange(new Set());
					}}
					variant="secondary-discreet"
				>
					Reset all
				</Button>
			) : null}
		</div>
	);
}
