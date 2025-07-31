'use client';

import { parseAsBoolean, parseAsString, useQueryStates } from 'nuqs';
import { NoResults } from '@/components/icons/NoResults';
import { Button } from '@/components/ui/Button';

export function ProjectsViewFilterEmpty() {
	const [, setQueryStates] = useQueryStates({
		created_by: parseAsString,
		my_permissions: parseAsString,
		reset_filters: parseAsBoolean,
	});

	return (
		<div className="flex h-[292px] flex-col place-content-center rounded-xl p-px">
			<div className="bg-base-neutral-60 dark:bg-base-neutral-700/38 h-full w-full place-content-center place-items-center rounded-xl text-center">
				<div className="flex flex-col place-items-center gap-4">
					<NoResults />
					<div className="flex flex-col gap-2">
						<span className="text-base-xl">No results</span>
						<div className="flex place-content-center place-items-center gap-2">
							<span>Try adjusting the filters or</span>
							<Button
								onPress={async () => setQueryStates({ created_by: null, my_permissions: null, reset_filters: true })}
								size="sm"
								variant="filled"
							>
								Reset all filters
							</Button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
