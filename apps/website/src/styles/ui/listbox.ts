import { compose, cva } from '@/styles/cva';
import { focusRing } from '@/styles/ui/focusRing';

export const itemStyles = compose(
	focusRing,
	cva({
		base: 'group hover:bg-base-neutral-80 focus-visible:bg-base-neutral-80 pressed:bg-base-neutral-100 dark:bg-base-neutral-800 dark:hover:bg-base-neutral-700 dark:focus-visible:bg-base-neutral-700 dark:pressed:bg-base-neutral-700 relative flex min-h-10 cursor-default place-items-center gap-2 px-2 py-1.5 text-sm -outline-offset-2 transition-colors will-change-transform forced-color-adjust-none select-none',
		variants: {
			isSelected: {
				true: 'bg-base-neutral-100 hover:bg-base-neutral-200 focus-visible:bg-base-neutral-200 pressed:bg-base-neutral-300 dark:bg-base-neutral-700 dark:hover:bg-base-neutral-600 dark:focus-visible:bg-base-neutral-600 dark:pressed:bg-base-neutral-500',
				false: null,
			},
			isDisabled: {
				true: 'forced-colors:text-[GrayText]',
				false: null,
			},
		},
	}),
);
