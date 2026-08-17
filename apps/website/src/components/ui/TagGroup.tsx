'use client';

import type { VariantProps } from 'cva';
import { XIcon } from 'lucide-react';
import { createContext, use, type ReactNode } from 'react';
import {
	Tag as RACTag,
	TagGroup as RACTagGroup,
	type TagGroupProps as RACTagGroupProps,
	type TagProps as RACTagProps,
	Button,
	TagList as RACTagList,
	type TagListProps as RACTagListProps,
	Text,
	composeRenderProps,
} from 'react-aria-components';
import { Description, Label } from '@/components/ui/Field';
import { compose, cva, cx } from '@/styles/cva';
import { focusRing } from '@/styles/ui/focusRing';

const ColorContext = createContext<VariantProps<typeof tagStyles>['color']>('lavender');

export const tagStyles = compose(
	focusRing,
	cva({
		base: 'group/tag flex h-6 max-w-fit cursor-default place-items-center gap-1 rounded-sm border border-transparent px-2 py-1 text-base-sm transition print:p-0',
		variants: {
			color: {
				neutral: 'bg-base-neutral-700 text-base-neutral-40 dark:bg-base-neutral-100 dark:text-base-neutral-900',
				'neutral-lighter': 'bg-base-neutral-100 dark:bg-base-neutral-700',
				destructive: 'bg-base-sunset-100 text-base-sunset-800 dark:bg-base-sunset-800 dark:text-base-sunset-100',
				warning:
					'bg-base-tangerine-100 text-base-tangerine-800 dark:bg-base-tangerine-800 dark:text-base-tangerine-100',
				info: 'bg-base-crystal-100 text-base-crystal-800 dark:bg-base-crystal-800 dark:text-base-crystal-100',
				lavender:
					'bg-base-lavender-100 text-base-lavender-600 hover:underline focus-visible:underline dark:bg-base-lavender-700 dark:text-base-lavender-200 pressed:underline',
				filter:
					'h-8 gap-2 rounded-lg border border-base-neutral-100 px-4 py-1 hover:bg-base-neutral-100 dark:border-base-neutral-700 dark:hover:bg-base-neutral-700 pressed:border-transparent pressed:bg-base-neutral-300 pressed:outline-2 pressed:outline-offset-2 pressed:outline-base-lavender-400 dark:pressed:border-transparent dark:pressed:bg-base-neutral-600 dark:pressed:outline-base-lavender-600',
				selection:
					'h-8 rounded-2xl border-base-lavender-300 bg-base-neutral-0 px-3 py-1.5 dark:border-base-lavender-600 dark:bg-base-neutral-800',
			},
			size: {
				default: null,
				sm: null,
			},
			isSelected: {
				true: null,
				false: null,
			},
			isDisabled: {
				true: 'forced-colors:text-[GrayText]',
				false: null,
			},
			allowsRemoving: {
				true: null,
				false: null,
			},
		},
		compoundVariants: [
			{
				color: 'selection',
				allowsRemoving: true,
				className: 'pr-2',
			},
			{
				color: 'selection',
				size: 'sm',
				className:
					'h-6 border-base-neutral-300 px-2 py-1 text-base-sm hover:border-base-lavender-300 focus-visible:border-base-lavender-300 dark:border-base-neutral-500 dark:hover:border-base-lavender-600 dark:focus-visible:border-base-lavender-600 pressed:border-base-lavender-300 pressed:text-base-lavender-700 dark:pressed:border-base-lavender-600 dark:pressed:text-base-lavender-200',
			},
			{
				color: 'selection',
				size: 'sm',
				isSelected: true,
				className:
					'border-base-lavender-300 bg-base-lavender-100 text-base-lavender-700 hover:border-base-lavender-600 hover:text-base-neutral-900 focus-visible:border-base-lavender-600 focus-visible:text-base-neutral-900 dark:border-base-lavender-600 dark:bg-base-lavender-700 dark:text-base-lavender-200 dark:hover:border-base-lavender-300 dark:hover:text-base-neutral-40 dark:focus-visible:border-base-lavender-300 dark:focus-visible:text-base-neutral-40 pressed:border-base-lavender-300 pressed:text-base-neutral-800 dark:pressed:border-base-lavender-600 dark:pressed:text-base-neutral-40',
			},
			{
				color: 'selection',
				size: 'sm',
				allowsRemoving: true,
				className: 'pr-1',
			},
		],
		defaultVariants: {
			color: 'lavender',
			size: 'default',
		},
	}),
);

export type TagGroupProps<Type> = Omit<RACTagGroupProps, 'children'> &
	Pick<RACTagListProps<Type>, 'children' | 'items' | 'renderEmptyState'> & {
		readonly color?: VariantProps<typeof tagStyles>['color'];
		readonly description?: string;
		readonly errorMessage?: string;
		readonly label?: string;
	};

export function TagList<Type extends object>(props: RACTagListProps<Type>) {
	return <RACTagList {...props} className={cx('flex flex-wrap gap-1', props.className)} />;
}

export function TagGroup<Type extends object>({
	label,
	description,
	errorMessage,
	items,
	children,
	renderEmptyState,
	...props
}: TagGroupProps<Type>) {
	return (
		<RACTagGroup
			{...props}
			className={cx('group/tag-group flex flex-col gap-2 place-self-start', props.className)}
			data-slot="control"
		>
			{label && <Label>{label}</Label>}
			<ColorContext.Provider value={props.color ?? 'lavender'}>
				<TagList items={items!} renderEmptyState={renderEmptyState!}>
					{children}
				</TagList>
			</ColorContext.Provider>
			{description && <Description>{description}</Description>}
			{errorMessage && (
				<Text className="text-sm text-red-600" slot="errorMessage">
					{errorMessage}
				</Text>
			)}
		</RACTagGroup>
	);
}

const removeButtonStyles = compose(
	focusRing,
	cva({
		base: 'flex size-4.5 cursor-default place-content-center place-items-center rounded-full transition-[background-color] group-hover/tag:bg-base-neutral-100 focus-visible:bg-base-neutral-100 dark:group-hover/tag:bg-base-neutral-700 dark:focus-visible:bg-base-neutral-700 pressed:bg-base-neutral-200 dark:pressed:bg-base-neutral-600',
		variants: {
			size: {
				default: null,
				sm: 'size-3.75 bg-base-neutral-100 group-pressed/tag:bg-base-neutral-200 dark:bg-base-neutral-700 dark:group-pressed/tag:bg-base-neutral-600 pressed:bg-base-neutral-200 dark:pressed:bg-base-neutral-600',
			},
			isSelected: {
				true: null,
				false: null,
			},
		},
		compoundVariants: [
			{
				size: 'sm',
				isSelected: true,
				className:
					'bg-base-lavender-600 text-base-neutral-40 group-hover/tag:bg-base-lavender-600 group-pressed/tag:bg-base-lavender-700 focus-visible:bg-base-lavender-600 dark:bg-base-lavender-400 dark:text-base-neutral-900 dark:group-hover/tag:bg-base-lavender-400 dark:group-pressed/tag:bg-base-lavender-200 dark:focus-visible:bg-base-lavender-400 pressed:bg-base-lavender-700 dark:pressed:bg-base-lavender-200',
			},
		],
	}),
);

export type TagProps = RACTagProps &
	VariantProps<typeof tagStyles> & {
		readonly children?: ReactNode;
	};

export function Tag({ children, ...props }: TagProps) {
	const textValue = props.textValue ?? (typeof children === 'string' ? children : undefined);
	const groupColor = use(ColorContext);

	return (
		<RACTag
			{...props}
			className={composeRenderProps(props.className, (className, renderProps) =>
				tagStyles({ ...renderProps, className, color: props.color ?? groupColor, size: props.size }),
			)}
			textValue={textValue!}
		>
			{({ allowsRemoving, isSelected }) => (
				<>
					{children}
					{allowsRemoving && (
						<Button className={removeButtonStyles({ size: props.size, isSelected })} slot="remove">
							<XIcon
								aria-hidden
								className="shrink-0"
								size={props.size === 'sm' ? 10 : 16}
								strokeWidth={props.size === 'sm' ? 3 : 1.5}
							/>
						</Button>
					)}
				</>
			)}
		</RACTag>
	);
}
