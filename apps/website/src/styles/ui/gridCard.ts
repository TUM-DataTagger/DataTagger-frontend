import { cva } from '@/styles/cva';

export const gridCardStyles = cva({
	base: 'flex h-full flex-col place-content-between rounded-lg border border-base-neutral-200 p-4 outline-0 transition-colors group-disabled:bg-base-neutral-200 group-disabled:opacity-38 dark:border-base-neutral-500 dark:group-disabled:bg-base-neutral-700',
	variants: {
		variant: {
			default: [
				'bg-base-neutral-0 dark:bg-base-neutral-800',
				'group-[&:hover]:bg-base-neutral-60/38 dark:group-[&:hover]:bg-base-neutral-700/38',
				'group-focus-visible:bg-base-neutral-60/38 dark:group-focus-visible:bg-base-neutral-700/38',
			],
			link: [
				'group-hover:bg-base-lavender-100/38 dark:group-hover:bg-base-lavender-900/38',
				'group-focus-visible:bg-base-lavender-100/38 dark:group-focus-visible:bg-base-lavender-900/38',
				'group-pressed:bg-base-lavender-100 dark:group-pressed:bg-base-lavender-900',
				'data-[selected="true"]:bg-base-lavender-100/38 data-[selected="true"]:hover:bg-base-lavender-100/72 data-[selected="true"]:focus-visible:bg-base-lavender-100/72 dark:data-[selected="true"]:bg-base-lavender-900/38 dark:data-[selected="true"]:hover:bg-base-lavender-900/72 dark:data-[selected="true"]:focus-visible:bg-base-lavender-900/72 data-[selected="true"]:pressed:bg-base-lavender-100 dark:data-[selected="true"]:pressed:bg-base-lavender-900',
				'group-selected:bg-base-lavender-100/38 group-selected:hover:bg-base-lavender-100/72 group-selected:focus-visible:bg-base-lavender-100/72 dark:group-selected:bg-base-lavender-900/38 dark:group-selected:hover:bg-base-lavender-900/72 dark:group-selected:focus-visible:bg-base-lavender-900/72 group-selected:pressed:bg-base-lavender-100 dark:group-selected:pressed:bg-base-lavender-900',
			],
			'secondary-filled':
				'rounded-lg border-0 bg-base-lavender-100 text-base-label-md hover:bg-base-lavender-200 focus-visible:bg-base-lavender-200 active:bg-base-lavender-300 hover:active:bg-base-lavender-300 dark:bg-base-lavender-800 dark:hover:bg-base-lavender-700 dark:focus-visible:bg-base-lavender-700 dark:active:bg-base-lavender-600 dark:hover:active:bg-base-lavender-600 pressed:bg-base-lavender-300 dark:pressed:bg-base-lavender-600',
			'dashboard-link': [
				'border-base-neutral-100 bg-base-neutral-0 dark:border-base-neutral-700 dark:bg-base-neutral-800',
				'group-[&:hover]:border-base-neutral-200 dark:group-[&:hover]:border-base-neutral-600',
				'group-focus-visible:border-base-neutral-200 dark:group-focus-visible:border-base-neutral-600',
				'group-pressed:border-base-lavender-200 group-pressed:bg-base-neutral-80 dark:group-pressed:border-base-lavender-600 dark:group-pressed:bg-base-neutral-600/72',
			],
			'dashboard-neutral-link': [
				'border-base-neutral-100 bg-base-neutral-0 dark:border-base-neutral-700 dark:bg-base-neutral-800',
				'group-[&:hover]:border-transparent group-[&:hover]:bg-base-neutral-100 dark:group-[&:hover]:border-transparent dark:group-[&:hover]:bg-base-neutral-700',
				'group-focus-visible:border-transparent group-focus-visible:bg-base-neutral-100 dark:group-focus-visible:border-transparent dark:group-focus-visible:bg-base-neutral-700',
				'active:border-transparent active:bg-base-neutral-200 dark:active:border-transparent dark:active:bg-base-neutral-600',
			],
		},
	},
	defaultVariants: {
		variant: 'default',
	},
});
