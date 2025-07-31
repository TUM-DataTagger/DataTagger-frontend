'use client';

import type { ProgressBarProps as AriaProgressBarProps } from 'react-aria-components';
import { ProgressBar as AriaProgressBar } from 'react-aria-components';
import { Label } from '@/components/ui/Field';
import { cx } from '@/styles/cva';
import { composeTailwindRenderProps } from '@/styles/util';

export type ProgressBarProps = AriaProgressBarProps & {
	readonly folder?: string | undefined;
	readonly label?: string;
	readonly showPercentage?: boolean;
	readonly speed?: string;
};

export function ProgressBar({ label, showPercentage, speed, folder, ...props }: ProgressBarProps) {
	return (
		<AriaProgressBar {...props} className={composeTailwindRenderProps(props.className, 'flex flex-col gap-1')}>
			{({ percentage, valueText, isIndeterminate }) => (
				<>
					<div className="flex place-content-between place-items-center gap-2">
						{label && <Label>{label}</Label>}
						{showPercentage && <span className="text-sm text-neutral-600 dark:text-neutral-400">{valueText}</span>}
					</div>
					<div className="bg-base-neutral-100 dark:bg-base-neutral-700 relative h-1 overflow-hidden rounded-xs outline -outline-offset-1 outline-transparent">
						<div
							className={cx(
								'bg-base-lavender-500 absolute top-0 h-full forced-colors:bg-[Highlight]',
								isIndeterminate
									? 'animate-in slide-out-to-right-full repeat-infinite left-full duration-1000 ease-out [--tw-enter-translate-x:calc(-16rem-100%)]'
									: 'left-0',
							)}
							style={{ width: (isIndeterminate ? 40 : percentage) + '%' }}
						/>
					</div>
					{folder || speed ? (
						<div
							className={cx(
								'flex place-items-center',
								folder ? 'place-content-start' : '',
								speed ? 'place-content-end' : '',
								folder && speed ? 'place-content-between' : '',
							)}
						>
							{speed && <div className="text-sm text-neutral-600 dark:text-neutral-400">{speed}</div>}
						</div>
					) : null}
				</>
			)}
		</AriaProgressBar>
	);
}
