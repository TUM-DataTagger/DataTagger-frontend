'use client';

import type { DateDuration } from '@internationalized/date';
import { CalendarIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { DatePicker as RACDatePicker } from 'react-aria-components';
import type {
	DatePickerProps as RACDatePickerProps,
	DateValue as RACDateValue,
	DialogProps as RACDialogProps,
	PopoverProps as RACPopoverProps,
	ValidationResult as RACValidationResult,
} from 'react-aria-components';
import { Button } from '@/components/ui/Button';
import { Calendar } from '@/components/ui/Calendar';
import { DateInput } from '@/components/ui/DateField';
import { Description, FieldError, FieldGroup, Label } from '@/components/ui/Field';
import { PopoverClose, PopoverContent } from '@/components/ui/Popover';
import { cx } from '@/styles/cva';
import { composeTailwindRenderProps } from '@/styles/util';

export type DatePickerOverlayProps = Omit<RACDialogProps, 'children' | 'className' | 'style'> &
	Omit<RACPopoverProps, 'children' | 'className' | 'style'> & {
		readonly children?: React.ReactNode;
		readonly className?: string | ((values: { defaultClassName?: string }) => string);
		readonly closeButton?: boolean;
		readonly pageBehavior?: 'single' | 'visible';
		readonly range?: boolean;
		readonly visibleDuration?: DateDuration;
	};

export function DatePickerOverlay({
	visibleDuration = { months: 1 },
	closeButton = true,
	pageBehavior = 'visible',
	...props
}: DatePickerOverlayProps) {
	return (
		<PopoverContent
			{...props}
			className={cx('flex snap-x place-content-center rounded-lg')}
			isDismissable={false}
			showArrow={false}
		>
			{/* {props.range ? <RangeCalendar pageBehavior={pageBehavior} visibleDuration={visibleDuration} /> : <Calendar />} */}
			<Calendar />
			{closeButton && (
				<div className="mx-auto flex w-full max-w-[inherit] place-content-center py-2.5 sm:hidden">
					<PopoverClose className="w-full">Close</PopoverClose>
				</div>
			)}
		</PopoverContent>
	);
}

export type DatePickerProps<Type extends RACDateValue> = RACDatePickerProps<Type> & {
	readonly description?: string;
	readonly errorMessage?: string | ((validation: RACValidationResult) => string) | undefined;
	readonly label?: ReactNode | string;
	readonly prefix?: ReactNode | string;
};

export function DatePicker<Type extends RACDateValue>(props: DatePickerProps<Type>) {
	return (
		<RACDatePicker
			{...props}
			className={composeTailwindRenderProps(props.className, 'group/date-picker flex w-full flex-col gap-1')}
			isInvalid={Boolean(props.errorMessage)}
		>
			{props.label && <Label>{props.label}</Label>}
			<FieldGroup isDisabled={props.isDisabled!} isInvalid={Boolean(props.errorMessage)}>
				{props.prefix && typeof props.prefix === 'string' ? <span className="ml-3">{props.prefix}</span> : props.prefix}
				<DateInput />
				<Button className="mr-1! size-8!" size="icon-sm" variant="discreet">
					<CalendarIcon aria-hidden className="size-4.5!" data-slot="icon" size={18} strokeWidth={1.5} />
				</Button>
			</FieldGroup>
			{props.description && <Description>{props.description}</Description>}
			<FieldError>{props.errorMessage}</FieldError>
			<DatePickerOverlay />
		</RACDatePicker>
	);
}
