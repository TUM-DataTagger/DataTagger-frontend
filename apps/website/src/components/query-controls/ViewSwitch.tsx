'use client';

import { LayoutGridIcon, ListIcon } from 'lucide-react';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { Radio, RadioGroup } from '@/components/ui/RadioGroup';
import { cx } from '@/styles/cva';

export function ViewSwitch({
	defaultView = 'grid',
	isDisabled = false,
	...props
}: {
	readonly className?: string | undefined;
	readonly defaultView?: 'grid' | 'table' | undefined;
	readonly isDisabled?: boolean | undefined;
	readonly resetPageOnChange?: boolean | undefined;
}) {
	const [queryStates, setQueryStates] = useQueryStates({
		page: parseAsInteger.withDefault(1),
		view: parseAsString.withDefault(defaultView),
	});

	return (
		<RadioGroup
			aria-label="View switch"
			className={cx('print:hidden', props.className)}
			isDisabled={isDisabled}
			onChange={async (value) => {
				await setQueryStates(props.resetPageOnChange ? { page: 1, view: value } : { view: value });
			}}
			orientation="horizontal"
			value={queryStates.view}
		>
			<Radio
				aria-label="Grid view"
				className="rounded-full p-[10px] outline-0 outline-offset-2 hover:bg-base-neutral-80 focus-visible:bg-base-neutral-80 focus-visible:outline-2 focus-visible:outline-base-lavender-400 dark:outline-base-lavender-600 dark:hover:bg-base-neutral-700 forced-colors:outline-[Highlight] pressed:bg-base-neutral-200 dark:pressed:bg-base-neutral-600 selected:bg-base-neutral-100 dark:selected:bg-base-neutral-700"
				showIndicator={false}
				value="grid"
			>
				<LayoutGridIcon aria-hidden size={18} strokeWidth={1.5} />
			</Radio>
			<Radio
				aria-label="Table view"
				className="rounded-full p-2.5 outline-0 outline-offset-2 hover:bg-base-neutral-80 focus-visible:bg-base-neutral-80 focus-visible:outline-2 focus-visible:outline-base-lavender-400 dark:outline-base-lavender-600 dark:hover:bg-base-neutral-700 forced-colors:outline-[Highlight] pressed:bg-base-neutral-200 dark:pressed:bg-base-neutral-600 selected:bg-base-neutral-100 dark:selected:bg-base-neutral-700"
				showIndicator={false}
				value="table"
			>
				<ListIcon aria-hidden size={18} strokeWidth={1.5} />
			</Radio>
		</RadioGroup>
	);
}
