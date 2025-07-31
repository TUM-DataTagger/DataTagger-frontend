import { cva } from '@/styles/cva';

export const alertStyles = cva({
	base: 'text-base-label-md relative inline-flex min-h-12 w-full flex-wrap place-items-center gap-3 rounded-sm px-4 py-3',
	variants: {
		variant: {
			error:
				'bg-base-sunset-100 dark:bg-base-sunset-700 [&>svg]:text-base-sunset-500 dark:[&>svg]:text-base-sunset-300',
			warning:
				'bg-base-tangerine-100 dark:bg-base-tangerine-700 [&>svg]:text-base-tangerine-500 dark:[&>svg]:text-base-tangerine-300',
			info: 'bg-base-crystal-100 dark:bg-base-crystal-700 [&>svg]:text-base-crystal-700 dark:[&>svg]:text-base-crystal-100',
		},
	},
	defaultVariants: {
		variant: 'error',
	},
});
