import { compose, cva } from '@/styles/cva';
import { focusRing } from '@/styles/ui/focusRing';

export const linkStyles = compose(
	focusRing,
	cva({
		base: 'rounded-sm text-base-sm transition-[color,opacity]',
		variants: {
			variant: {
				unset: null,
				regular: [
					'text-base-lavender-500',
					'hover:text-base-lavender-500 hover:underline',
					'focus-visible:text-base-lavender-500 focus-visible:underline',
					'pressed:text-base-lavender-600 pressed:underline dark:pressed:text-base-lavender-400',
					'dark:disabled:text-base-lavender-40/38 disabled:text-base-lavender-900/38 disabled:underline',
				],
				neutral: [
					'text-base-neutral-900 underline dark:text-base-neutral-40',
					'hover:text-base-neutral-800 dark:hover:text-base-neutral-200',
					'focus-visible:text-base-neutral-800 dark:focus-visible:text-base-neutral-200',
					'pressed:text-base-neutral-700 dark:pressed:text-base-neutral-300',
					'disabled:text-base-neutral-900 dark:disabled:text-base-neutral-300',
				],
				breadcrumb: [
					'text-base-neutral-600 dark:text-base-neutral-300',
					'hover:text-base-neutral-600 hover:underline dark:hover:text-base-neutral-300',
					'focus-visible:text-base-neutral-600 focus-visible:underline dark:focus-visible:text-base-neutral-300',
					'pressed:text-base-neutral-700 pressed:underline dark:pressed:text-base-neutral-100',
					'disabled:text-base-neutral-900 dark:disabled:text-base-neutral-300',
				],
			},
			isDisabled: {
				true: 'cursor-default opacity-38 forced-colors:text-[GrayText]',
			},
		},
		defaultVariants: {
			variant: 'regular',
		},
	}),
);
