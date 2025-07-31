'use client';

import { format } from '@formkit/tempo';
import { getLocalTimeZone, today } from '@internationalized/date';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { use, type ComponentProps } from 'react';
import type { CalendarProps as RACCalendarProps, DateValue as RACDateValue } from 'react-aria-components';
import {
	CalendarCell as RACCalendarCell,
	CalendarGrid as RACCalendarGrid,
	CalendarGridBody as RACCalendarGridBody,
	CalendarGridHeader as RACCalendarGridHeader,
	CalendarHeaderCell as RACCalendarHeaderCell,
	Calendar as RACCalendar,
	Text as RACText,
	composeRenderProps,
	useLocale,
	CalendarStateContext,
} from 'react-aria-components';
import { Button } from '@/components/ui/Button';
import { cx } from '@/styles/cva';

export function CalendarHeader(props: ComponentProps<'header'> & { readonly isRange?: boolean }) {
	const { direction } = useLocale();
	const state = use(CalendarStateContext);

	return (
		<header {...props} className={cx('', props.className)} data-slot="calendar-header">
			{/* {!props.isRange && (
				<>
					<SelectMonth state={state} />
					<SelectYear state={state} />
				</>
			)} */}
			<div className="flex flex-1 place-content-between place-items-center gap-1">
				<Button size="icon-sm" slot="previous" variant="filled">
					{direction === 'rtl' ? <ChevronRightIcon /> : <ChevronLeftIcon />}
				</Button>
				<span className="text-base-xl">
					{format(new Date(state?.focusedDate.toDate(getLocalTimeZone()) ?? Date.now()), 'MMMM YYYY')}
				</span>
				<Button size="icon-sm" slot="next" variant="filled">
					{direction === 'rtl' ? <ChevronLeftIcon /> : <ChevronRightIcon />}
				</Button>
			</div>
		</header>
	);
}

export function CalendarGridHeader() {
	return (
		<RACCalendarGridHeader>
			{(day) => <RACCalendarHeaderCell className="text-base-label-md size-10 p-1">{day}</RACCalendarHeaderCell>}
		</RACCalendarGridHeader>
	);
}

export type CalendarProps<Type extends RACDateValue> = Omit<RACCalendarProps<Type>, 'visibleDuration'> & {
	readonly className?: string;
	readonly errorMessage?: string;
};

export function Calendar<Type extends RACDateValue>(props: CalendarProps<Type>) {
	const now = today(getLocalTimeZone());

	return (
		<RACCalendar {...props} className="flex flex-col gap-3 p-3 pt-4">
			<CalendarHeader />
			<RACCalendarGrid>
				<CalendarGridHeader />
				<RACCalendarGridBody>
					{(date) => (
						<RACCalendarCell
							className={composeRenderProps(props.className as string, (className, { isSelected, isDisabled }) =>
								cx(
									[
										'bg-base-neutral-0 dark:bg-base-neutral-800 relative m-1 flex size-8 cursor-default place-content-center place-items-center rounded-full tabular-nums forced-colors:text-[ButtonText]',
										'hover:bg-base-neutral-100 dark:hover:bg-base-neutral-700',
										'focus-visible:bg-base-neutral-100 focus-visible:outline-base-lavender-400 dark:focus-visible:outline-base-lavender-600 dark:focus-visible:bg-base-neutral-700 focus-visible:outline-2 focus-visible:outline-offset-2',
										'pressed:bg-base-neutral-200 dark:pressed:bg-base-neutral-600',
									],
									isSelected && [
										'bg-base-lavender-300 dark:bg-base-lavender-700 text-base-label-md forced-colors:bg-[Highlight] forced-colors:text-[Highlight] forced-colors:data-invalid:bg-[Mark]',
										'hover:bg-base-lavender-500 dark:hover:bg-base-lavender-500 dark:hover:text-base-neutral-900',
										'focus-visible:bg-base-lavender-500 dark:focus-visible:bg-base-lavender-500 dark:focus-visible:text-base-neutral-900',
										'pressed:bg-base-lavender-600 pressed:text-base-neutral-40 dark:pressed:bg-base-lavender-400 dark:pressed:text-base-neutral-900',
										'disabled:bg-base-neutral-200 dark:disabled:bg-base-neutral-700',
									],
									isDisabled &&
										'text-base-neutral-900 dark:text-base-neutral-40 opacity-38 forced-colors:text-[GrayText]',
									date.compare(now) === 0 && [
										'border-base-lavender-500 border',
										'disabled:border-base-neutral-900 dark:disabled:border-base-neutral-40',
									],
									className,
								),
							)}
							date={date}
						/>
					)}
				</RACCalendarGridBody>
			</RACCalendarGrid>
			{props.errorMessage && (
				<RACText className="text-base-sunset-500 text-base-sm forced-colors:text-[Mark]" slot="errorMessage">
					{props.errorMessage}
				</RACText>
			)}
		</RACCalendar>
	);
}
