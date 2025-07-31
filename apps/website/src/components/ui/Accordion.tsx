'use client';

import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { MinusIcon, PlusIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cx } from '@/styles/cva';

export const Accordion = AccordionPrimitive.Root;

export function AccordionItem(props: AccordionPrimitive.AccordionItemProps) {
	const { className, ...additionalProps } = props;

	return <AccordionPrimitive.Item {...additionalProps} className={cx('', className)} />;
}

export function AccordionTrigger(
	props: AccordionPrimitive.AccordionTriggerProps & { readonly append?: ReactNode; readonly prepend?: ReactNode },
) {
	const { className, prepend, children, append, ...additionalProps } = props;

	return (
		<AccordionPrimitive.Header>
			<AccordionPrimitive.Trigger
				{...additionalProps}
				className={cx(
					'text-base-label-sm text-base-neutral-600 hover:text-base-neutral-700 focus-visible:text-base-neutral-700 pressed:text-base-neutral-800 focus-visible:outline-base-lavender-400 dark:outline-base-lavender-600 dark:text-base-neutral-300 dark:hover:text-base-neutral-200 dark:focus-visible:text-base-neutral-200 dark:pressed:text-base-neutral-100 group print:text-base-label-xl flex w-full place-content-between place-items-center rounded-xs py-3 outline-0 outline-offset-2 transition focus-visible:outline-2 disabled:pointer-events-none disabled:opacity-38 disabled:grayscale print:border-0 forced-colors:outline-[Highlight]',
					className,
				)}
			>
				<div className="flex place-items-center gap-2">
					{prepend ?? null}
					{children}
				</div>
				{append ?? (
					<>
						<PlusIcon aria-hidden className="group-data-[state=open]:hidden print:hidden" size={18} strokeWidth={1.5} />
						<MinusIcon
							aria-hidden
							className="group-data-[state=closed]:hidden print:hidden"
							size={18}
							strokeWidth={1.5}
						/>
					</>
				)}
			</AccordionPrimitive.Trigger>
		</AccordionPrimitive.Header>
	);
}

export function AccordionContent(props: AccordionPrimitive.AccordionContentProps) {
	const { className, children, ...additionalProps } = props;

	return (
		<AccordionPrimitive.Content {...additionalProps}>
			<div
				className={cx('border-base-neutral-100 dark:border-base-neutral-700 border-t py-3 print:border-0', className)}
			>
				{children}
			</div>
		</AccordionPrimitive.Content>
	);
}
