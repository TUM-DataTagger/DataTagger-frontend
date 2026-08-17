'use client';

import { createContext, use, useMemo, type ComponentProps } from 'react';
import type {
	TabListProps as RACTabListProps,
	TabPanelsProps as RACTabPanelsProps,
	TabPanelProps as RACTabPanelProps,
	TabProps as RACTabProps,
	TabsProps as RACTabsProps,
} from 'react-aria-components';
import {
	TabList as RACTabList,
	TabPanels as RACTabPanels,
	TabPanel as RACTabPanel,
	Tab as RACTab,
	Tabs as RACTabs,
	composeRenderProps,
	SelectionIndicator as RACSelectionIndicator,
} from 'react-aria-components';
import { compose, cva, cx } from '@/styles/cva';
import { focusRing } from '@/styles/ui/focusRing';
import { composeTailwindRenderProps } from '@/styles/util';

const tabsStyles = cva({
	base: 'flex gap-4 forced-color-adjust-none',
	variants: {
		orientation: {
			horizontal: 'flex-col',
			vertical: 'w-full flex-row',
		},
	},
});

type TabsOrientation = NonNullable<RACTabsProps['orientation']>;

const TabsOrientationContext = createContext<TabsOrientation>('horizontal');

export function Tabs(props: RACTabsProps) {
	const orientation = props.orientation ?? 'horizontal';

	return (
		<TabsOrientationContext value={orientation}>
			<RACTabs
				{...props}
				className={composeRenderProps(props.className, (className, renderProps) =>
					tabsStyles({
						...renderProps,
						className,
					}),
				)}
				data-slot="control"
			/>
		</TabsOrientationContext>
	);
}

const tabListStyles = cva({
	base: 'relative flex border-base-neutral-100 forced-color-adjust-none dark:border-base-neutral-700',
	variants: {
		orientation: {
			horizontal:
				'min-h-16 w-full flex-row place-items-center gap-x-4 overflow-x-auto overflow-y-hidden border-b px-4 md:overflow-x-visible md:overflow-y-visible',
			vertical: 'min-w-40 flex-col place-items-start gap-y-1 border-r pr-4',
		},
	},
});

type TabListContextValue = {
	readonly selectionIndicator?: boolean;
};

const TabListContext = createContext<TabListContextValue | undefined>(undefined);

export function useTabListContext() {
	const context = use(TabListContext);
	if (context === undefined) {
		throw new Error('useTabListContext must be used within TabListContext.Provider');
	}

	return context;
}

export type TabListProps<Type extends object> = RACTabListProps<Type> & TabListContextValue;

export function TabList<Type extends object>({ selectionIndicator = true, ...props }: TabListProps<Type>) {
	const contextValue = useMemo(() => ({ selectionIndicator }), [selectionIndicator]);

	return (
		<TabListContext value={contextValue}>
			<RACTabList
				{...props}
				className={composeRenderProps(props.className, (className, renderProps) =>
					tabListStyles({ ...renderProps, className }),
				)}
				data-slot="tab-list"
			/>
		</TabListContext>
	);
}

export function TabScrollArea(props: ComponentProps<'div'>) {
	return (
		<div className="relative">
			<div {...props} className={cx('scrollbar-hidden overflow-x-auto sm:overflow-x-visible', props.className)} />
			<div
				aria-hidden
				className="pointer-events-none absolute inset-x-0 bottom-0 h-px w-full bg-base-neutral-100 dark:bg-base-neutral-700"
			/>
		</div>
	);
}

const tabStyles = compose(
	focusRing,
	cva({
		base: [
			'group/tab relative isolate flex cursor-default place-items-center gap-2 rounded-2xl px-3 py-1.5 whitespace-nowrap transition *:data-[slot=icon]:size-4',
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
			orientation: {
				horizontal: null,
				vertical: 'w-full py-0 pr-2 pl-4',
			},
			isDisabled: {
				true: 'forced-colors:text-[GrayText] forced-colors:selected:bg-[GrayText] forced-colors:selected:text-[HighlightText]',
				false: null,
			},
		},
	}),
);

export type TabProps = RACTabProps;

export function Tab(props: TabProps) {
	const { selectionIndicator } = useTabListContext();
	const orientation = use(TabsOrientationContext);

	return (
		<RACTab
			{...props}
			className={composeRenderProps(props.className, (className, renderProps) =>
				tabStyles({
					...renderProps,
					orientation,
					className: cx('href' in props && 'cursor-pointer', className),
				}),
			)}
			data-slot="tab"
		>
			{(values) => (
				<>
					{typeof props.children === 'function' ? props.children(values) : props.children}
					{selectionIndicator && (
						<RACSelectionIndicator
							className={cx(
								'absolute rounded bg-base-neutral-800 transition-[translate,width,height] duration-200 dark:bg-base-neutral-60',
								orientation === 'horizontal' ? 'inset-x-0 -bottom-4 h-0.5' : 'inset-y-0 -left-4 w-0.5',
							)}
							data-slot="selected-indicator"
						/>
					)}
				</>
			)}
		</RACTab>
	);
}

export type TabPanelsProps<Type extends object> = RACTabPanelsProps<Type>;

export function TabPanels<Type extends object>(props: TabPanelsProps<Type>) {
	return <RACTabPanels {...props} />;
}

export type TabPanelProps = RACTabPanelProps;

export function TabPanel(props: TabPanelProps) {
	return (
		<RACTabPanel
			{...props}
			className={composeTailwindRenderProps(props.className, 'flex-1 focus-visible:outline-hidden')}
			data-slot="tab-panel"
		/>
	);
}
