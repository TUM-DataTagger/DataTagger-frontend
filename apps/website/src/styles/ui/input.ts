import { compose, cva } from '@/styles/cva';
import { fieldBorderStyles } from '@/styles/ui/field';
import { focusRing } from '@/styles/ui/focusRing';

export const inputStyles = compose(
	focusRing,
	fieldBorderStyles,
	cva({
		base: 'border-base-neutral-300 bg-base-neutral-0 placeholder:text-base-neutral-400 hover:border-base-neutral-200 dark:border-base-neutral-500 dark:bg-base-neutral-800 dark:text-base-neutral-40 dark:placeholder:text-base-neutral-500 dark:hover:border-base-neutral-600 h-10 rounded-sm border px-3 py-[10px] transition',
		variants: {
			isFocused: {
				true: 'outline-2 forced-colors:border-[Highlight]',
				false: 'outline-0 forced-colors:border-[ButtonBorder]',
			},
		},
	}),
);
