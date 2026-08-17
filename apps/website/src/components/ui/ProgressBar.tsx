'use client';

import { createContext, use } from 'react';
import type { ComponentProps, ReactNode } from 'react';
import type { ProgressBarProps as AriaProgressBarProps, ProgressBarRenderProps } from 'react-aria-components';
import { ProgressBar as AriaProgressBar } from 'react-aria-components';
import { cx, cva } from '@/styles/cva';
import { composeTailwindRenderProps } from '@/styles/util';

const ProgressBarContext = createContext<ProgressBarRenderProps | null>(null);

export type ProgressBarProps = AriaProgressBarProps & {
	readonly children?: ReactNode | ((values: ProgressBarRenderProps) => ReactNode);
};

export function ProgressBar({ children, ...props }: ProgressBarProps) {
	return (
		<AriaProgressBar
			{...props}
			className={composeTailwindRenderProps(props.className, 'flex w-full flex-col gap-1')}
			data-slot="control"
		>
			{(values) => (
				<ProgressBarContext value={values}>
					{typeof children === 'function' ? children(values) : (children ?? <ProgressBarTrack />)}
				</ProgressBarContext>
			)}
		</AriaProgressBar>
	);
}

export function ProgressBarHeader(props: ComponentProps<'div'>) {
	return (
		<div
			{...props}
			className={cx('flex place-content-between place-items-center gap-2', props.className)}
			data-slot="progress-bar-header"
		/>
	);
}

export function ProgressBarValue(props: Omit<ComponentProps<'span'>, 'children'>) {
	const context = use(ProgressBarContext);

	if (!context) {
		throw new Error('ProgressBarValue must be used within ProgressBar.');
	}

	return (
		<span
			{...props}
			className={cx('text-base-md text-base-neutral-600 dark:text-base-neutral-300', props.className)}
			data-slot="progress-bar-value"
		>
			{context.valueText}
		</span>
	);
}

const progressTrackStyles = cva({
	base: 'relative h-1 overflow-hidden rounded-xs bg-base-neutral-100 outline -outline-offset-1 outline-transparent dark:bg-base-neutral-700',
});

export function ProgressBarTrack(props: ComponentProps<'div'>) {
	const context = use(ProgressBarContext);

	if (!context) {
		throw new Error('ProgressBarTrack must be used within ProgressBar.');
	}

	return (
		<div {...props} className={cx(progressTrackStyles(), props.className)} data-slot="progress-bar-track">
			<div
				className={cx(
					'absolute top-0 h-full bg-base-lavender-500 forced-colors:bg-[Highlight]',
					context.isIndeterminate
						? 'left-full animate-in duration-1000 ease-out repeat-infinite [--tw-enter-translate-x:calc(-16rem-100%)] slide-out-to-right-full'
						: 'left-0',
				)}
				style={{ width: `${context.isIndeterminate ? 40 : context.percentage}%` }}
			/>
		</div>
	);
}
