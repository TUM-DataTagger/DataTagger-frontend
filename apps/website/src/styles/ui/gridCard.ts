import { cva } from '@/styles/cva';

export const gridCardStyles = cva({
	base: 'border-base-neutral-200 dark:border-base-neutral-500 group-disabled:bg-base-neutral-200 dark:group-disabled:bg-base-neutral-700 flex h-full flex-col place-content-between rounded-lg border p-4 outline-0 transition-colors group-disabled:opacity-38',
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
				'data-[selected="true"]:bg-base-lavender-100/38 dark:data-[selected="true"]:bg-base-lavender-900/38 data-[selected="true"]:hover:bg-base-lavender-100/72 dark:data-[selected="true"]:hover:bg-base-lavender-900/72 data-[selected="true"]:focus-visible:bg-base-lavender-100/72 dark:data-[selected="true"]:focus-visible:bg-base-lavender-900/72 data-[selected="true"]:pressed:bg-base-lavender-100 dark:data-[selected="true"]:pressed:bg-base-lavender-900',
				'group-selected:bg-base-lavender-100/38 dark:group-selected:bg-base-lavender-900/38 group-selected:hover:bg-base-lavender-100/72 dark:group-selected:hover:bg-base-lavender-900/72 group-selected:focus-visible:bg-base-lavender-100/72 dark:group-selected:focus-visible:bg-base-lavender-900/72 group-selected:pressed:bg-base-lavender-100 dark:group-selected:pressed:bg-base-lavender-900',
			],
			'secondary-filled':
				'bg-base-lavender-100 text-base-label-md active:bg-base-lavender-300 hover:bg-base-lavender-200 hover:active:bg-base-lavender-300 focus-visible:bg-base-lavender-200 pressed:bg-base-lavender-300 dark:bg-base-lavender-800 dark:active:bg-base-lavender-600 dark:hover:bg-base-lavender-700 dark:hover:active:bg-base-lavender-600 dark:focus-visible:bg-base-lavender-700 dark:pressed:bg-base-lavender-600 rounded-lg border-0',
		},
	},
	defaultVariants: {
		variant: 'default',
	},
});
