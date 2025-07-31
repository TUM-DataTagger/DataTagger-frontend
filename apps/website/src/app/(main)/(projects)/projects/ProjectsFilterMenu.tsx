'use client';

import { useMediaQuery } from 'usehooks-ts';
import { useFilterState, FilterMenu } from '@/components/FilterMenu';
import { Button } from '@/components/ui/Button';

const createdByOptions = {
	me: 'Me',
	others: 'Others',
};

const myPermissionsOptions = {
	admin: 'Project admin',
	member: 'Member',
};

export function ProjectsFilterMenu() {
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
				<FilterMenu filterStates={[createdByFilter, myPermissionsFilter]} label="Filter" />
			) : (
				<>
					<FilterMenu filterState={createdByFilter} label="Created by" />
					<FilterMenu filterState={myPermissionsFilter} label="My permissions" />
				</>
			)}

			{(createdByFilter.selected as Set<string>).size || (myPermissionsFilter.selected as Set<string>).size ? (
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
