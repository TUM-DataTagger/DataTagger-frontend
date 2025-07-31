'use client';

import { LayoutGridIcon, ListIcon } from 'lucide-react';
import { parseAsString, useQueryState } from 'nuqs';
import { Radio, RadioGroup } from '@/components/ui/RadioGroup';
import { cx } from '@/styles/cva';

export function ViewSwitch({
	isDisabled = false,
	...props
}: {
	readonly className?: string | undefined;
	readonly isDisabled?: boolean | undefined;
}) {
	const [queryState, setQueryState] = useQueryState('view', parseAsString.withDefault('grid'));

	return (
		<RadioGroup
			aria-label="View switch"
			className={cx('print:hidden', props.className)}
			classNames={{
				content: 'group-orientation-horizontal:gap-2 group-orientation-horizontal:flex-nowrap',
			}}
			isDisabled={isDisabled}
			onChange={async (value) => setQueryState(value)}
			orientation="horizontal"
			value={queryState}
		>
			<Radio
				aria-label="Grid view"
				className="hover:bg-base-neutral-80 focus-visible:bg-base-neutral-80 focus-visible:outline-base-lavender-400 pressed:bg-base-neutral-200 selected:bg-base-neutral-100 dark:outline-base-lavender-600 dark:hover:bg-base-neutral-700 dark:pressed:bg-base-neutral-600 dark:selected:bg-base-neutral-700 rounded-full p-[10px] outline-0 outline-offset-2 focus-visible:outline-2 forced-colors:outline-[Highlight]"
				showIndicator={false}
				value="grid"
			>
				<LayoutGridIcon aria-hidden size={18} strokeWidth={1.5} />
			</Radio>
			<Radio
				aria-label="Table view"
				className="hover:bg-base-neutral-80 focus-visible:bg-base-neutral-80 focus-visible:outline-base-lavender-400 pressed:bg-base-neutral-200 selected:bg-base-neutral-100 dark:outline-base-lavender-600 dark:hover:bg-base-neutral-700 dark:pressed:bg-base-neutral-600 dark:selected:bg-base-neutral-700 rounded-full p-[10px] outline-0 outline-offset-2 focus-visible:outline-2 forced-colors:outline-[Highlight]"
				showIndicator={false}
				value="table"
			>
				<ListIcon aria-hidden size={18} strokeWidth={1.5} />
			</Radio>
		</RadioGroup>
	);
}
