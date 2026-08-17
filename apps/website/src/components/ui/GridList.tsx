'use client';

import { MenuIcon } from 'lucide-react';
import type { ComponentProps } from 'react';
import type {
	GridListItemProps as RACGridListItemProps,
	GridListProps as RACGridListProps,
	GridListSectionProps as RACGridListSectionProps,
	TextProps as RACTextProps,
} from 'react-aria-components';
import {
	GridListHeader as RACGridListHeader,
	GridListItem as RACGridListItem,
	GridListSection as RACGridListSection,
	GridList as RACGridList,
	Text as RACText,
	composeRenderProps,
} from 'react-aria-components';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { compose, cva, cx } from '@/styles/cva';
import { focusRing } from '@/styles/ui/focusRing';
import { composeTailwindRenderProps } from '@/styles/util';

export function GridList<Type extends object>(props: RACGridListProps<Type>) {
	return (
		<RACGridList
			{...props}
			className={composeTailwindRenderProps(
				props.className,
				'layout-grid:flex layout-grid:flex-wrap relative max-h-none overflow-auto overscroll-contain [scrollbar-width:thin] has-data-[slot=grid-list-section]:gap-y-6 *:drop-target:border *:drop-target:border-primary',
			)}
			data-slot="grid-list"
		>
			{props.children}
		</RACGridList>
	);
}

const itemStyles = compose(
	focusRing,
	cva({
		base: [
			'group relative flex min-w-0 gap-2 rounded-lg p-1 transition select-none max-md:grow',
			'-outline-offset-2 focus-visible:outline-2',
			// 'hover:bg-base-lavender-100/36 focus-visible:bg-base-lavender-100/36 dark:hover:bg-base-lavender-900/36 dark:focus-visible:bg-base-lavender-900/36 selected:bg-base-lavender-100/36 dark:selected:bg-base-lavender-900/38',
			'dragging:opacity-70',
		],
		variants: {
			isDisabled: {
				true: 'forced-colors:text-[GrayText]',
			},
			isSelected: {
				true: null,
			},
			isHovered: {
				true: null,
			},
			isFocusVisible: {
				true: null,
			},
		},
	}),
);

export type GridListItemProps = RACGridListItemProps & {
	readonly classNames?: { checkbox?: string };
	readonly hasCheckbox?: boolean;
};

export function GridListItem({ hasCheckbox = true, ...props }: GridListItemProps) {
	const textValue = props.textValue ?? (typeof props.children === 'string' ? props.children : undefined);

	return (
		<RACGridListItem
			{...props}
			className={composeRenderProps(props.className, (className, renderProps) =>
				itemStyles({ ...renderProps, className }),
			)}
			textValue={textValue!}
		>
			{(values) => (
				<>
					{values.allowsDragging && (
						<Button className="cursor-grab dragging:cursor-grabbing" size="icon-xs" slot="drag" variant="unset">
							<MenuIcon aria-hidden data-slot="icon" size={18} strokeWidth={1.5} />
						</Button>
					)}

					{hasCheckbox && values.selectionMode !== 'none' && values.selectionBehavior === 'toggle' && (
						<Checkbox className={cx('place-items-start pt-0.5', props.classNames?.checkbox)} slot="selection" />
					)}
					{typeof props.children === 'function' ? props.children(values) : props.children}
				</>
			)}
		</RACGridListItem>
	);
}

export function GridListEmptyState(props: ComponentProps<'div'>) {
	return <div {...props} className={cx('p-6', props.className)} />;
}

export function GridListSection<Type extends object>(props: RACGridListSectionProps<Type>) {
	return <RACGridListSection {...props} className={cx('space-y-1', props.className)} data-slot="grid-list-section" />;
}

export function GridListHeader(props: ComponentProps<typeof RACGridListHeader>) {
	return (
		<RACGridListHeader
			{...props}
			className={cx('mb-2 text-base-label-md', props.className)}
			data-slot="grid-list-header"
		/>
	);
}

export function GridListSpacer(props: ComponentProps<'div'>) {
	return <div {...props} aria-hidden className={cx('-ml-4 flex-1', props.className)} />;
}

export function GridListStart(props: ComponentProps<'div'>) {
	return <div {...props} className={cx('relative flex place-items-center gap-2.5', props.className)} />;
}

export function GridListLabel(props: RACTextProps) {
	return <RACText {...props} className={cx('text-base-label-md', props.className)} />;
}

export function GridListDescription(props: RACTextProps) {
	return (
		<RACText
			{...props}
			className={cx('text-base-sm text-base-neutral-600 dark:text-base-neutral-300', props.className)}
			slot="description"
		/>
	);
}
