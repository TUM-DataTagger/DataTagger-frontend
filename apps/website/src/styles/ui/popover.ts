import { cva } from '@/styles/cva';

export const popoverStyles = cva({
	base: 'group flex min-w-(--trigger-width) place-items-center overflow-hidden rounded-sm border border-base-neutral-200 bg-base-neutral-0 p-2 shadow-base-md outline-0 dark:border-base-neutral-600 dark:bg-base-neutral-800 forced-colors:bg-[Canvas]',
	variants: {
		isEntering: {
			true: 'duration-200 ease-out fade-in placement-left:slide-in-from-right-1 placement-right:slide-in-from-left-1 placement-top:slide-in-from-bottom-1 placement-bottom:slide-in-from-top-1',
			false: null,
		},
		isExiting: {
			true: 'animate-out duration-150 ease-in fade-out placement-left:slide-out-to-right-1 placement-right:slide-out-to-left-1 placement-top:slide-out-to-bottom-1 placement-bottom:slide-out-to-top-1',
			false: null,
		},
	},
});
