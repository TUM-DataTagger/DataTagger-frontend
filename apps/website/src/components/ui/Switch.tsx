'use client';

import type { VariantProps } from 'cva';
import { CheckIcon } from 'lucide-react';
import type { RefObject } from 'react';
import { Switch as RACSwitch } from 'react-aria-components';
import type { SwitchProps as RACSwitchProps } from 'react-aria-components';
import { compose, cva, cx } from '@/styles/cva';
import { focusRing } from '@/styles/ui/focusRing';
import { composeTailwindRenderProps } from '@/styles/util';

export const switchStyles = compose(
	focusRing,
	cva({
		base: 'text-base-md rounded-3xl border border-transparent px-px py-px transition forced-colors:bg-[Highlight]',
		variants: {
			variant: {
				default: [
					'bg-base-neutral-500 dark:bg-base-neutral-300 text-base-neutral-800 dark:text-base-neutral-100',
					'group-hover:bg-base-neutral-400',
					'group-focus-visible:bg-base-neutral-400',
					'group-disabled:bg-base-neutral-200 dark:group-disabled:bg-base-neutral-700 group-disabled:cursor-default',
					'group-selected:bg-base-neutral-800 group-selected:dark:bg-base-neutral-100',
					'group-selected:group-hover:bg-base-neutral-600 group-selected:dark:group-hover:bg-base-neutral-300',
					'group-selected:group-focus-visible:bg-base-neutral-600 group-selected:dark:group-focus-visible:bg-base-neutral-300',
					'group-selected:group-pressed:bg-base-neutral-200 group-selected:dark:group-pressed:bg-base-neutral-700',
				],
				'green-lime': [
					'bg-base-neutral-500 dark:bg-base-neutral-300 text-base-neutral-800 dark:text-base-neutral-100',
					'group-hover:bg-base-neutral-400',
					'group-focus-visible:bg-base-neutral-400',
					'group-disabled:bg-base-neutral-200 dark:group-disabled:bg-base-neutral-700 group-disabled:cursor-default',
					'group-selected:bg-base-green-lime-600 group-selected:dark:bg-base-green-lime-400',
					'group-selected:group-hover:bg-base-green-lime-400 group-selected:dark:group-hover:bg-base-green-lime-600',
					'group-selected:group-focus-visible:bg-base-green-lime-400 group-selected:dark:group-focus-visible:bg-base-green-lime-600',
					'group-selected:group-pressed:bg-base-neutral-200 group-selected:dark:group-pressed:bg-base-neutral-700',
				],
			},
			size: {
				default: 'h-6 w-10',
				sm: 'h-5 w-9',
			},
		},
		defaultVariants: {
			variant: 'default',
			size: 'default',
		},
	}),
);

export type SwitchProps = RACSwitchProps &
	VariantProps<typeof switchStyles> & {
		readonly ref?: RefObject<HTMLLabelElement>;
	};

export function Switch(props: SwitchProps) {
	return (
		<RACSwitch
			{...props}
			className={composeTailwindRenderProps(
				props.className,
				'group inline-flex touch-none place-items-center gap-2 disabled:opacity-38',
			)}
			style={{ WebkitTapHighlightColor: 'transparent' }}
		>
			{(values) => (
				<>
					<span className={switchStyles({ ...values, variant: props.variant, size: props.size })}>
						<span
							className={cx(
								'group-pressed:w-6 group-selected:ml-4 bg-base-neutral-0 dark:bg-base-neutral-800 group-selected:group-pressed:ml-2 flex size-5 origin-right place-content-center place-items-center rounded-3xl transition-all duration-200 *:data-[slot=icon]:size-4 forced-colors:disabled:outline-[GrayText]',
								props.size === 'sm' && 'group-pressed:w-5 group-selected:group-pressed:ml-3 size-4',
							)}
						>
							{values.isSelected && props.size !== 'sm' ? (
								<CheckIcon aria-hidden data-slot="icon" size={18} strokeWidth={1.5} />
							) : null}
						</span>
					</span>
					{typeof props.children === 'function' ? props.children(values) : props.children}
				</>
			)}
		</RACSwitch>
	);
}
