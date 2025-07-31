'use client';

import type { ReactNode } from 'react';
import {
	DateField as RACDateField,
	type DateFieldProps as RACDateFieldProps,
	DateInput as RACDateInput,
	type DateInputProps as RACDateInputProps,
	DateSegment as RACDateSegment,
	type DateValue as RACDateValue,
	type ValidationResult,
} from 'react-aria-components';
import { Description, FieldError, FieldGroup, Label } from '@/components/ui/Field';
import { cva } from '@/styles/cva';
import { composeTailwindRenderProps } from '@/styles/util';

export const segmentStyles = cva({
	base: 'type-literal:px-0 sm:text-base-md text-base-neutral-900 dark:text-base-neutral-40 text-base-lg uppercase tabular-nums caret-transparent outline-hidden forced-color-adjust-none focus:outline-hidden forced-colors:text-[ButtonText]',
	variants: {
		isPlaceholder: {
			true: 'text-base-neutral-400 dark:text-base-neutral-500',
		},
		isFocused: {
			true: 'text-base-neutral-900 dark:text-base-neutral-40 bg-base-green-lime-300 rounded-[1px] forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]',
			false: null,
		},
	},
});

export function DateInput(props: Omit<RACDateInputProps, 'children'>) {
	return (
		<RACDateInput {...props} className={composeTailwindRenderProps(props.className, 'px-3 py-2.5')}>
			{(segment) => <RACDateSegment className={segmentStyles} segment={segment} />}
		</RACDateInput>
	);
}

export type DateFieldProps<Type extends RACDateValue> = RACDateFieldProps<Type> & {
	readonly description?: string;
	readonly errorMessage?: string | ((validation: ValidationResult) => string) | undefined;
	readonly label?: ReactNode | string;
	readonly prefix?: ReactNode;
	readonly suffix?: ReactNode;
};

export function DateField<Type extends RACDateValue>(props: DateFieldProps<Type>) {
	return (
		<RACDateField
			{...props}
			className={composeTailwindRenderProps(props.className, 'group flex w-full flex-col gap-1')}
			isInvalid={Boolean(props.errorMessage)}
		>
			{props.label && <Label>{props.label}</Label>}
			<FieldGroup isDisabled={props.isDisabled!} isInvalid={Boolean(props.errorMessage)}>
				{props.prefix && typeof props.prefix === 'string' ? <span className="ml-3">{props.prefix}</span> : props.prefix}
				<DateInput />
				{props.suffix ? (
					typeof props.suffix === 'string' ? (
						<span className="mr-2">{props.suffix}</span>
					) : (
						props.suffix
					)
				) : null}
			</FieldGroup>
			{props.description && <Description>{props.description}</Description>}
			<FieldError>{props.errorMessage}</FieldError>
		</RACDateField>
	);
}
