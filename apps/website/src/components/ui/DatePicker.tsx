'use client';

import type { DateDuration } from '@internationalized/date';
import { CalendarIcon } from 'lucide-react';
import { DatePicker as RACDatePicker } from 'react-aria-components';
import type {
	DatePickerProps as RACDatePickerProps,
	DateValue as RACDateValue,
	PopoverProps as RACPopoverProps,
	GroupProps as RACGroupProps,
} from 'react-aria-components';
import { useMediaQuery } from 'usehooks-ts';
import { Button } from '@/components/ui/Button';
import { Calendar } from '@/components/ui/Calendar';
import { DateInput } from '@/components/ui/DateField';
import { fieldStyles } from '@/components/ui/Field';
import { InputGroup } from '@/components/ui/Input';
import { ModalContent } from '@/components/ui/Modal';
import { PopoverClose, PopoverContent } from '@/components/ui/Popover';
import { cx } from '@/styles/cva';
import { composeTailwindRenderProps } from '@/styles/util';

export type DatePickerOverlayProps = Omit<RACPopoverProps, 'children'> & {
	readonly closeButton?: boolean;
	readonly pageBehavior?: 'single' | 'visible';
	readonly range?: boolean;
	readonly visibleDuration?: DateDuration;
};

export function DatePickerOverlay({
	closeButton = true,
	placement = 'bottom',
	range: _range,
	pageBehavior: _pageBehavior = 'visible',
	visibleDuration: _visibleDuration = { months: 1 },
	...props
}: DatePickerOverlayProps) {
	const isMobile = useMediaQuery('(max-width: 600px)', { initializeWithValue: false });

	if (isMobile) {
		return (
			<ModalContent aria-label={props['aria-label'] ?? 'Date picker'} className="sm:max-w-2xs" closeButton={false}>
				<div className="flex place-content-center p-4">
					<Calendar />
				</div>
			</ModalContent>
		);
	}

	return (
		<PopoverContent
			{...props}
			className={cx('flex min-w-auto snap-x place-content-center rounded-lg')}
			placement={placement}
			arrow={false}
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
	readonly popover?: Omit<RACPopoverProps, 'children'>;
};

export function DatePicker<Type extends RACDateValue>({ popover, ...props }: DatePickerProps<Type>) {
	return (
		<RACDatePicker
			{...props}
			className={composeTailwindRenderProps(props.className, fieldStyles())}
			data-slot="control"
		>
			{(values) => (
				<>
					{typeof props.children === 'function' ? props.children(values) : props.children}
					<DatePickerOverlay {...popover} />
				</>
			)}
		</RACDatePicker>
	);
}

export function DatePickerTrigger(props: RACGroupProps) {
	return (
		<InputGroup {...props} className={cx('*:data-[slot=control]:w-full', props.className)}>
			<DateInput />
			<Button data-slot="date-picker-trigger" size="icon" variant="unset">
				<CalendarIcon aria-hidden className="size-6 shrink-0 stroke-[1.5]" />
			</Button>
		</InputGroup>
	);
}
