'use client';

import type { ReactNode } from 'react';
import {
	TimeField as RACTimeField,
	type TimeFieldProps as RACTimeFieldProps,
	type TimeValue,
	type ValidationResult,
} from 'react-aria-components';
import { DateInput } from '@/components/ui/DateField';
import { Description, FieldError, FieldGroup, Label } from '@/components/ui/Field';
import { composeTailwindRenderProps } from '@/styles/util';

export type TimeFieldProps<Type extends TimeValue> = RACTimeFieldProps<Type> & {
	readonly description?: string;
	readonly errorMessage?: string | ((validation: ValidationResult) => string) | undefined;
	readonly label?: ReactNode | string;
	readonly prefix?: ReactNode;
	readonly suffix?: ReactNode;
};

export function TimeField<Type extends TimeValue>(props: TimeFieldProps<Type>) {
	return (
		<RACTimeField
			{...props}
			className={composeTailwindRenderProps(props.className, 'group/time-field flex w-full flex-col gap-1')}
		>
			{props.label && <Label>{props.label}</Label>}
			<FieldGroup>
				{props.prefix && typeof props.prefix === 'string' ? <span className="ml-3">{props.prefix}</span> : props.prefix}
				<DateInput className="flex gap-1 whitespace-nowrap sm:text-sm" />
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
		</RACTimeField>
	);
}
