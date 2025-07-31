import { cva } from '@/styles/cva';

export const popoverStyles = cva({
	base: 'group border-base-neutral-200 bg-base-neutral-0 shadow-base-md dark:border-base-neutral-600 dark:bg-base-neutral-800 flex min-w-(--trigger-width) place-items-center overflow-hidden rounded-sm border p-2 outline-0 forced-colors:bg-[Canvas]',
	variants: {
		isEntering: {
			true: 'fade-in placement-left:slide-in-from-right-1 placement-right:slide-in-from-left-1 placement-top:slide-in-from-bottom-1 placement-bottom:slide-in-from-top-1 duration-200 ease-out',
			false: null,
		},
		isExiting: {
			true: 'animate-out fade-out placement-left:slide-out-to-right-1 placement-right:slide-out-to-left-1 placement-top:slide-out-to-bottom-1 placement-bottom:slide-out-to-top-1 duration-150 ease-in',
			false: null,
		},
	},
});
