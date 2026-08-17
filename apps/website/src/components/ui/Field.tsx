'use client';

import { AlertCircleIcon } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import type {
	LabelProps as RACLabelProps,
	TextProps as RACTextProps,
	FieldErrorProps as RACFieldErrorProps,
} from 'react-aria-components';
import { Label as RACLabel, Text as RACText, FieldError as RACFieldError } from 'react-aria-components';
import { cva, cx } from '@/styles/cva';
import { composeTailwindRenderProps } from '@/styles/util';

export const fieldStyles = cva({ base: ['group flex w-full flex-col gap-1'] });

export function Label(props: RACLabelProps) {
	return (
		<RACLabel
			{...props}
			className={cx(
				'w-fit text-base-label-md text-base-neutral-800 select-none group-invalid:text-base-sunset-500 group-disabled:text-base-neutral-900 group-disabled:opacity-38 in-disabled:opacity-38 dark:text-base-neutral-100 dark:group-disabled:text-base-neutral-40',
				props.className,
			)}
			data-slot="label"
		/>
	);
}

export function Description(props: RACTextProps) {
	return (
		<RACText
			{...props}
			className={cx(
				'text-base-sm text-pretty break-all text-base-neutral-600 group-disabled:opacity-38 in-disabled:opacity-38 dark:text-base-neutral-300',
				props.className,
			)}
			slot="description"
		/>
	);
}

export function FieldError(props: RACFieldErrorProps) {
	return (
		<RACFieldError
			{...props}
			className={composeTailwindRenderProps(
				props.className,
				'text-base-sunset-500 text-base-sm flex place-items-center gap-1.5 group-disabled:opacity-38 in-disabled:opacity-38 forced-colors:text-[Mark]',
			)}
		>
			<AlertCircleIcon aria-hidden className="shrink-0" data-slot="icon" size={18} strokeWidth={1.5} />
			{props.children as ReactNode}
		</RACFieldError>
	);
}

export function Fieldset(props: ComponentProps<'fieldset'>) {
	return (
		<fieldset {...props} className={cx('*:data-[slot=text]:mt-1 [&>*+[data-slot=control]]:mt-6', props.className)} />
	);
}

export function FieldGroup(props: ComponentProps<'div'>) {
	return <div {...props} className={cx('space-y-6', props.className)} data-slot="control" />;
}

export function Legend(props: ComponentProps<'legend'>) {
	return (
		<legend
			{...props}
			className={cx(
				'text-base-label-md text-base-neutral-800 data-disabled:opacity-38 dark:text-base-neutral-100',
				props.className,
			)}
			data-slot="legend"
		/>
	);
}
