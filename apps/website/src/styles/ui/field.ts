import { cva } from '@/styles/cva';

export const fieldBorderStyles = cva({
	variants: {
		isFocusWithin: {
			true: 'outline-2 forced-colors:border-[Highlight]',
			false: 'outline-0 forced-colors:border-[ButtonBorder]',
		},
		isInvalid: {
			true: 'border-base-sunset-500 hover:border-base-sunset-200 dark:border-base-sunset-500 dark:hover:border-base-sunset-700 forced-colors:border-[Mark]',
			false: null,
		},
		isDisabled: {
			true: 'border-transparent bg-base-neutral-100 opacity-38 hover:border-transparent forced-colors:border-[GrayText]',
			false: null,
		},
	},
});
