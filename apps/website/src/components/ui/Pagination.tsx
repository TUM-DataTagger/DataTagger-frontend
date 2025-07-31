'use client';

import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { parseAsInteger, useQueryState } from 'nuqs';
import { Button } from '@/components/ui/Button';
import { Separator } from '@/components/ui/Separator';
import { cx } from '@/styles/cva';

export function Pagination(props: {
	readonly count: number;
	readonly length: number;
	readonly limit: number;
	readonly offset: number;
}) {
	const [queryState, setQueryState] = useQueryState('page', parseAsInteger.withDefault(1));

	const maxPage = Math.ceil(props.count / props.limit);

	return (
		<div className="flex place-content-between place-items-center gap-2">
			<div>
				<span className="text-base-sm text-base-neutral-600 dark:text-base-neutral-300">
					Showing {maxPage === 0 ? 0 : props.offset + 1} to {props.offset + props.length} of {props.count}
				</span>
			</div>
			<div className="flex place-items-center gap-2">
				<span className="text-base-sm text-base-neutral-600 dark:text-base-neutral-300">
					Page {queryState} of {Math.max(maxPage, 1)}
				</span>
				<nav aria-label="Pagination" className="flex place-items-center">
					<Button
						aria-label="Previous page"
						className={cx(
							'border-base-lavender-300 hover:bg-base-lavender-100 pressed:bg-base-lavender-200 dark:border-base-lavender-600 dark:hover:bg-base-lavender-800 dark:pressed:bg-base-lavender-700 h-8 w-8 rounded-l-4xl border border-r-0',
						)}
						isDisabled={queryState <= 1}
						onPress={async () => setQueryState((old) => old - 1)}
						variant="unset"
					>
						<ChevronLeftIcon aria-hidden size={18} strokeWidth={1.5} />
					</Button>
					<Separator
						className="bg-base-lavender-300 dark:bg-base-lavender-600 h-8"
						isDisabled={queryState <= 1 && queryState === maxPage}
						orientation="vertical"
					/>
					<Button
						aria-label="Next page"
						className={cx(
							'border-base-lavender-300 hover:bg-base-lavender-100 pressed:bg-base-lavender-200 dark:border-base-lavender-600 dark:hover:bg-base-lavender-800 dark:pressed:bg-base-lavender-700 h-8 w-8 rounded-r-4xl border border-l-0',
						)}
						isDisabled={maxPage === 0 || queryState === maxPage}
						onPress={async () => setQueryState((old) => old + 1)}
						variant="unset"
					>
						<ChevronRightIcon aria-hidden size={18} strokeWidth={1.5} />
					</Button>
				</nav>
			</div>
		</div>
	);
}
