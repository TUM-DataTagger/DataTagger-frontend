import { cva } from '@/styles/cva';

export const focusRing = cva({
	base: 'outline-offset-2 outline-base-lavender-400 dark:outline-base-lavender-600 forced-colors:outline-[Highlight]',
	variants: {
		isFocusVisible: {
			true: 'outline-2',
			false: 'outline-0',
		},
	},
});
