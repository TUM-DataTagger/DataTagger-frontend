'use client';

import { ChevronDownIcon, ChevronUpIcon, MinusIcon, PlusIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import {
	NumberField as RACNumberField,
	type NumberFieldProps as RACNumberFieldProps,
	type ValidationResult,
} from 'react-aria-components';
import { useMediaQuery } from 'usehooks-ts';
import { Button, type ButtonProps } from '@/components/ui/Button';
import { Description, FieldError, FieldGroup, Input, Label } from '@/components/ui/Field';
import { cx } from '@/styles/cva';
import { composeTailwindRenderProps } from '@/styles/util';

type StepperButtonProps = ButtonProps & {
	readonly className?: string;
	readonly emblemType?: 'chevron' | 'default';
	readonly slot: 'decrement' | 'increment';
};

function StepperButton({ emblemType = 'default', ...props }: StepperButtonProps) {
	const icon =
		emblemType === 'chevron' ? (
			props.slot === 'increment' ? (
				<ChevronUpIcon aria-hidden size={18} strokeWidth={1.5} />
			) : (
				<ChevronDownIcon aria-hidden size={18} strokeWidth={1.5} />
			)
		) : props.slot === 'increment' ? (
			<PlusIcon aria-hidden size={18} strokeWidth={1.5} />
		) : (
			<MinusIcon aria-hidden size={18} strokeWidth={1.5} />
		);

	return (
		<Button
			{...props}
			className={cx(
				'size-5 shrink-0 p-0',
				'bg-base-neutral-100 dark:bg-base-neutral-700/48',
				'hover:bg-base-neutral-200 dark:hover:bg-base-neutral-700',
				'focus-visible:bg-base-neutral-200 dark:focus-visible:bg-base-neutral-700',
				'pressed:bg-base-neutral-300 dark:pressed:bg-base-neutral-600',
				'disabled:bg-base-neutral-60/32 dark:disabled:bg-base-neutral-700/32',
				props.className,
			)}
			slot={props.slot}
			variant="unset"
		>
			{icon}
		</Button>
	);
}

export type NumberFieldProps = RACNumberFieldProps & {
	readonly description?: string;
	readonly errorMessage?: string | ((validation: ValidationResult) => string) | undefined;
	readonly label?: ReactNode | string;
	readonly placeholder?: string;
};

export function NumberField(props: NumberFieldProps) {
	const isMobile = useMediaQuery('(max-width: 600px)', { initializeWithValue: false });

	return (
		<RACNumberField
			{...props}
			className={composeTailwindRenderProps(props.className, 'group flex w-full flex-col gap-1')}
			isInvalid={Boolean(props.errorMessage)}
		>
			{props.label && <Label>{props.label}</Label>}
			<FieldGroup isDisabled={props.isDisabled!} isInvalid={Boolean(props.errorMessage)}>
				{isMobile ? <StepperButton className="ml-0! size-10!" slot="decrement" /> : null}
				<Input className="tabular-nums" placeholder={props.placeholder} />
				{isMobile ? (
					<StepperButton className="mr-0! size-10!" slot="increment" />
				) : (
					<div className="flex h-full flex-col">
						<StepperButton emblemType="chevron" slot="increment" />
						<StepperButton emblemType="chevron" slot="decrement" />
					</div>
				)}
			</FieldGroup>
			{props.description && <Description>{props.description}</Description>}
			<FieldError>{props.errorMessage}</FieldError>
		</RACNumberField>
	);
}
