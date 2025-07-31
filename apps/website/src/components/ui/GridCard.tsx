'use client';

import type { VariantProps } from 'cva';
import Link from 'next/link';
import type { ComponentProps } from 'react';
import { Button, type PressEvent } from 'react-aria-components';
import { cx } from '@/styles/cva';
import { gridCardStyles } from '@/styles/ui/gridCard';

export function GridCard(
	props: ComponentProps<'div'> & { readonly className?: string; readonly isDisabled?: boolean | undefined },
) {
	const { className, isDisabled = false, ...additionalProps } = props;

	return (
		<div
			{...additionalProps}
			className={gridCardStyles({
				variant: 'default',
				className,
			})}
		/>
	);
}

export function LinkGridCard({
	variant = 'link',
	isSelected = false,
	...props
}: ComponentProps<typeof Link> &
	VariantProps<typeof gridCardStyles> & {
		readonly className?: string;
		readonly isSelected?: boolean | undefined;
	}) {
	if (!props.href) {
		return (
			<Button
				className={gridCardStyles({
					variant,
					className: cx('w-full text-left', props.className),
				})}
				data-selected={isSelected}
				onPress={props.onClick as unknown as (e: PressEvent) => void}
			>
				{props.children}
			</Button>
		);
	}

	return (
		<Link
			{...props}
			className={gridCardStyles({
				variant,
				className: props.className,
			})}
		/>
	);
}
