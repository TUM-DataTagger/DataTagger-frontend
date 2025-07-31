'use client';

import { CheckIcon, XIcon } from 'lucide-react';
import { createContext, use, type ReactNode } from 'react';
import {
	Tag as AriaTag,
	TagGroup as AriaTagGroup,
	type TagGroupProps as AriaTagGroupProps,
	type TagProps as AriaTagProps,
	Button,
	TagList,
	type TagListProps,
	Text,
	composeRenderProps,
} from 'react-aria-components';
import { Description, Label } from '@/components/ui/Field';
import { compose, cva, cx } from '@/styles/cva';
import { focusRing } from '@/styles/ui/focusRing';

const colors = {
	neutral: 'bg-base-neutral-700 dark:bg-base-neutral-100 text-base-neutral-40 dark:text-base-neutral-900',
	'neutral-lighter': 'bg-base-neutral-100 dark:bg-base-neutral-700',
	destructive: 'bg-base-sunset-100 dark:bg-base-sunset-800 text-base-sunset-800 dark:text-base-sunset-100',
	warning: 'bg-base-tangerine-100 dark:bg-base-tangerine-800 text-base-tangerine-800 dark:text-base-tangerine-100',
	info: 'bg-base-crystal-100 dark:bg-base-crystal-800 text-base-crystal-800 dark:text-base-crystal-100',
	lavender:
		'bg-base-lavender-100 dark:bg-base-lavender-700 text-base-lavender-600 dark:text-base-lavender-200 group-hover:underline group-focus-visible:underline group-pressed:underline',
	filter:
		'h-8 gap-2 rounded-lg border border-base-neutral-100 px-4 py-1 hover:bg-base-neutral-100 pressed:border-base-neutral-300 pressed:bg-base-neutral-300 pressed:outline-2 pressed:outline-offset-2 pressed:outline-base-lavender-400 dark:border-base-neutral-700 dark:hover:bg-base-neutral-700 dark:pressed:border-base-neutral-600 dark:pressed:bg-base-neutral-600 dark:pressed:outline-base-lavender-600',
};

type Color = keyof typeof colors;
const ColorContext = createContext<Color>('lavender');

const tagStyles = compose(
	focusRing,
	cva({
		base: 'text-base-sm flex h-6 max-w-fit cursor-default place-items-center gap-1 rounded-sm border border-transparent px-2 py-1 transition print:p-0',
		variants: {
			color: {
				neutral: '',
				'neutral-lighter': '',
				destructive: '',
				warning: '',
				info: '',
				lavender: '',
				filter: '',
			},
			allowsRemoving: {
				true: 'pr-1',
				false: null,
			},
			isSelected: {
				true: 'bg-base-lavender-300 hover:bg-base-lavender-500 focus-visible:bg-base-lavender-500 pressed:bg-base-lavender-600 dark:bg-base-lavender-700 dark:hover:bg-base-lavender-500 dark:focus-visible:bg-base-lavender-500 dark:pressed:bg-base-lavender-400 h-8 rounded-lg py-1 pr-4 pl-2 forced-color-adjust-none forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]',
				false: null,
			},
			isDisabled: {
				true: 'bg-neutral-100 text-neutral-300 forced-colors:text-[GrayText]',
				false: null,
			},
		},
		compoundVariants: (Object.keys(colors) as Color[]).map((color) => ({
			isSelected: false,
			color,
			class: colors[color],
		})),
	}),
);

export type TagGroupProps<Type> = Omit<AriaTagGroupProps, 'children'> &
	Pick<TagListProps<Type>, 'children' | 'items' | 'renderEmptyState'> & {
		readonly color?: Color;
		readonly description?: string;
		readonly errorMessage?: string;
		readonly label?: string;
	};

export type TagProps = AriaTagProps & {
	readonly children?: ReactNode;
	readonly color?: Color;
};

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
		<AriaTagGroup {...props} className={cx('group flex flex-col gap-2 place-self-start', props.className)}>
			{label && <Label>{label}</Label>}
			<ColorContext.Provider value={props.color ?? 'lavender'}>
				<TagList className="flex flex-wrap gap-1" items={items!} renderEmptyState={renderEmptyState!}>
					{children}
				</TagList>
			</ColorContext.Provider>
			{description && <Description>{description}</Description>}
			{errorMessage && (
				<Text className="text-sm text-red-600" slot="errorMessage">
					{errorMessage}
				</Text>
			)}
		</AriaTagGroup>
	);
}

const removeButtonStyles = compose(
	focusRing,
	cva({
		base: 'pressed:bg-black/20 dark:pressed:bg-white/20 flex cursor-default place-content-center place-items-center rounded-full p-0.5 transition-[background-color] hover:bg-black/10 dark:hover:bg-white/10',
	}),
);

export function Tag({ children, color, ...props }: TagProps) {
	const textValue = typeof children === 'string' ? children : undefined;
	const groupColor = use(ColorContext);

	return (
		<AriaTag
			textValue={textValue!}
			{...props}
			className={composeRenderProps(props.className, (className, renderProps) =>
				tagStyles({ ...renderProps, className, color: color ?? groupColor }),
			)}
		>
			{({ allowsRemoving, isSelected }) => (
				<>
					{isSelected && <CheckIcon aria-hidden size={18} strokeWidth={1.5} />}
					{children}
					{allowsRemoving && (
						<Button className={removeButtonStyles} slot="remove">
							<XIcon aria-hidden className="h-3 w-3" />
						</Button>
					)}
				</>
			)}
		</AriaTag>
	);
}
