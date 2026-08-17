'use client';

import { parseAsArrayOf, parseAsBoolean, parseAsString, useQueryStates } from 'nuqs';
import type { PropsWithChildren } from 'react';
import { useMediaQuery } from 'usehooks-ts';
import { Switch } from '@/components/ui/Switch';
import { cx } from '@/styles/cva';

export function BulkActionsToolbar(
	props: PropsWithChildren<{ readonly count: number; readonly isDisabled?: boolean }>,
) {
	const [queryStates, setQueryStates] = useQueryStates({
		bulk_edit: parseAsBoolean.withDefault(false),
		selected: parseAsArrayOf(parseAsString).withDefault([]),
	});
	const isMobile = useMediaQuery('(max-width: 600px)', { initializeWithValue: false });

	return (
		<div
			className={cx(
				'flex h-14 place-items-center rounded-sm border border-base-neutral-100 px-4 py-4.5 dark:border-base-neutral-700',
				queryStates.bulk_edit && 'border-transparent bg-base-neutral-80 dark:bg-base-neutral-700/72',
				isMobile && 'flex-col-reverse place-content-center gap-4',
				queryStates.bulk_edit && isMobile && 'h-[104px]',
			)}
		>
			{queryStates.bulk_edit ? (
				<div className="flex w-full place-items-center gap-4">
					<div>
						<span className="h-4 rounded-2xl bg-base-lavender-200 px-1 py-px text-base-label-xs text-base-neutral-900 tabular-nums dark:bg-base-lavender-700 dark:text-base-neutral-40">
							{queryStates.selected.length}
						</span>{' '}
						<span className="text-base-xs">of {props.count} selected</span>
					</div>
					{props.children}
				</div>
			) : null}
			<div className={cx('flex w-full place-items-center', !isMobile && 'place-content-end')}>
				<Switch
					isDisabled={props.isDisabled}
					isSelected={queryStates.bulk_edit}
					onChange={async () => {
						const nextBulkMode = !queryStates.bulk_edit;
						await setQueryStates({
							bulk_edit: nextBulkMode,
							selected: nextBulkMode ? queryStates.selected : [],
						});
					}}
					size="sm"
					variant="green-lime"
				>
					Bulk actions
				</Switch>
			</div>
		</div>
	);
}
