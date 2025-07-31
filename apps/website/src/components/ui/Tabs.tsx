'use client';

import { LayoutGroup, motion } from 'motion/react';
import { useId, type RefObject } from 'react';
import type {
	TabListProps as RACTabListProps,
	TabPanelProps as RACTabPanelProps,
	TabProps as RACTabProps,
	TabsProps as RACTabsProps,
} from 'react-aria-components';
import {
	TabList as RACTabList,
	TabPanel as RACTabPanel,
	Tab as RACTab,
	Tabs as RACTabs,
	composeRenderProps,
} from 'react-aria-components';
import { useMediaQuery } from 'usehooks-ts';
import { compose, cva, cx } from '@/styles/cva';
import { focusRing } from '@/styles/ui/focusRing';
import { composeTailwindRenderProps } from '@/styles/util';

const tabsStyles = cva({
	base: 'group/tabs flex gap-4 forced-color-adjust-none',
	variants: {
		orientation: {
			horizontal: 'flex-col',
			vertical: 'w-[800px] flex-row',
		},
	},
});

export type TabsProps = RACTabsProps & {
	readonly ref?: RefObject<HTMLDivElement>;
};

export function Tabs(props: TabsProps) {
	return (
		<RACTabs
			{...props}
			className={composeRenderProps(props.className, (className, renderProps) =>
				tabsStyles({
					...renderProps,
					className,
				}),
			)}
		/>
	);
}

const tabListStyles = cva({
	base: 'border-base-neutral-100 dark:border-base-neutral-700 flex forced-color-adjust-none',
	variants: {
		orientation: {
			horizontal:
				'h-16 w-full flex-row place-items-center gap-x-4 overflow-x-auto overflow-y-hidden border-b px-4 md:overflow-x-visible md:overflow-y-visible',
			vertical: 'flex-col place-items-start gap-y-1 border-l',
		},
	},
});

export type TabListProps<Type extends object> = RACTabListProps<Type> & {
	readonly ref?: RefObject<HTMLDivElement>;
};

export function TabList<Type extends object>(props: TabListProps<Type>) {
	const id = useId();

	return (
		<LayoutGroup id={id}>
			<RACTabList
				{...props}
				className={composeRenderProps(props.className, (className, renderProps) =>
					tabListStyles({ ...renderProps, className }),
				)}
			/>
		</LayoutGroup>
	);
}

const tabStyles = compose(
	focusRing,
	cva({
		base: [
			'relative flex cursor-default place-items-center gap-2 rounded-2xl px-3 py-1.5 whitespace-nowrap transition *:data-[slot=icon]:size-4',
			'group-orientation-vertical/tabs:w-full group-orientation-vertical/tabs:py-0 group-orientation-vertical/tabs:pr-2 group-orientation-vertical/tabs:pl-4',
			'text-base-neutral-800 dark:text-base-neutral-60',
			'hover:bg-base-neutral-200 dark:hover:bg-base-neutral-600',
			'focus-visible:bg-base-neutral-200 dark:focus-visible:bg-base-neutral-600',
			'pressed:bg-base-neutral-500 pressed:text-base-neutral-40 dark:pressed:bg-base-neutral-300 dark:pressed:text-base-neutral-900',
			'selected:bg-base-neutral-100 dark:selected:bg-base-neutral-700',
			'selected:hover:bg-base-neutral-200 dark:selected:hover:bg-base-neutral-600',
			'selected:focus-visible:bg-base-neutral-200 dark:selected:focus-visible:bg-base-neutral-600',
			'selected:pressed:bg-base-neutral-500 dark:selected:pressed:bg-base-neutral-300',
		],
		variants: {
			isDisabled: {
				true: 'forced-colors:selected:bg-[GrayText] forced-colors:selected:text-[HighlightText] forced-colors:text-[GrayText]',
				false: null,
			},
		},
	}),
);

export type TabProps = RACTabProps & {
	readonly hasIndicator?: boolean;
	readonly ref?: RefObject<HTMLButtonElement>;
};

export function Tab({ hasIndicator = true, ...props }: TabProps) {
	const isMobile = useMediaQuery('(max-width: 600px)', { initializeWithValue: false });

	return (
		<RACTab
			{...props}
			className={composeRenderProps(props.className, (className, renderProps) =>
				tabStyles({
					...renderProps,
					className: cx('href' in props && 'cursor-pointer', className),
				}),
			)}
		>
			{({ isSelected }) => (
				<>
					{props.children}
					{isSelected && hasIndicator && (
						<motion.span
							className={cx(
								'bg-base-neutral-800 dark:bg-base-neutral-60 absolute rounded',
								'group-orientation-horizontal/tabs:inset-x-0 group-orientation-horizontal/tabs:-bottom-[17px] group-orientation-horizontal/tabs:h-0.5 group-orientation-horizontal/tabs:w-full',
								'group-orientation-vertical/tabs:left-0 group-orientation-vertical/tabs:h-[calc(100%-10%)] group-orientation-vertical/tabs:w-0.5 group-orientation-vertical/tabs:transform',
								isMobile && 'group-orientation-horizontal/tabs:-bottom-[15px]',
							)}
							data-slot="selected-indicator"
							layoutId="current-selected"
							transition={{ type: 'spring', stiffness: 500, damping: 40 }}
						/>
					)}
				</>
			)}
		</RACTab>
	);
}

export type TabPanelProps = RACTabPanelProps & {
	readonly ref?: RefObject<HTMLDivElement>;
};

export function TabPanel(props: TabPanelProps) {
	return (
		<RACTabPanel
			{...props}
			className={composeTailwindRenderProps(props.className, 'flex-1 focus-visible:outline-hidden')}
		/>
	);
}
