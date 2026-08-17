'use client';

import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Separator } from '@/components/ui/Separator';
import { cx } from '@/styles/cva';
import { SearchLimitMenu } from './SearchLimitMenu';
import type { SearchLimit } from './searchLimit';

export function SearchCursorPagination(props: {
	readonly count: number;
	readonly hasNextPage: boolean;
	readonly hasPreviousPage: boolean;
	readonly length: number;
	readonly limit: SearchLimit;
	onNextPage(): void;
	onLimitChange?(limit: SearchLimit): void;
	onPreviousPage(): void;
	readonly page: number;
	readonly showLimitControl?: boolean;
}) {
	const start = props.count === 0 ? 0 : (props.page - 1) * props.limit + 1;
	const end = props.count === 0 ? 0 : Math.min(start + props.length - 1, props.count);
	const pageDetails = (
		<div className="flex items-center gap-2 md:justify-self-end">
			<nav aria-label="Search pagination" className="flex items-center">
				<Button
					aria-label="Previous page"
					className={cx(
						'h-8 w-8 rounded-l-4xl border border-r-0 border-base-lavender-300 hover:bg-base-lavender-100 dark:border-base-lavender-600 dark:hover:bg-base-lavender-800 pressed:bg-base-lavender-200 dark:pressed:bg-base-lavender-700',
					)}
					isDisabled={!props.hasPreviousPage}
					onPress={props.onPreviousPage}
					variant="unset"
				>
					<ChevronLeftIcon aria-hidden size={18} strokeWidth={1.5} />
				</Button>
				<Separator
					className="h-8 bg-base-lavender-300 dark:bg-base-lavender-600"
					isDisabled={!props.hasPreviousPage && !props.hasNextPage}
					orientation="vertical"
				/>
				<Button
					aria-label="Next page"
					className={cx(
						'h-8 w-8 rounded-r-4xl border border-l-0 border-base-lavender-300 hover:bg-base-lavender-100 dark:border-base-lavender-600 dark:hover:bg-base-lavender-800 pressed:bg-base-lavender-200 dark:pressed:bg-base-lavender-700',
					)}
					isDisabled={!props.hasNextPage}
					onPress={props.onNextPage}
					variant="unset"
				>
					<ChevronRightIcon aria-hidden size={18} strokeWidth={1.5} />
				</Button>
			</nav>
		</div>
	);

	return (
		<div
			className={cx(
				'flex flex-col gap-2 md:items-center',
				props.showLimitControl ? 'md:grid md:grid-cols-[1fr_auto_1fr]' : 'md:flex-row md:justify-between',
			)}
		>
			{props.showLimitControl && props.onLimitChange ? (
				<SearchLimitMenu limit={props.limit} onLimitChange={props.onLimitChange} />
			) : null}
			<span
				className={cx(
					'text-base-sm text-base-neutral-600 dark:text-base-neutral-300',
					props.showLimitControl ? 'md:justify-self-center' : '',
				)}
			>
				Showing {start} to {end} of {props.count}
			</span>
			{pageDetails}
		</div>
	);
}
