'use client';

import {
	TimeField as RACTimeField,
	type TimeFieldProps as RACTimeFieldProps,
	type TimeValue as RACTimeValue,
} from 'react-aria-components';
import { fieldStyles } from '@/components/ui/Field';
import { composeTailwindRenderProps } from '@/styles/util';

export function TimeField<Type extends RACTimeValue>(props: RACTimeFieldProps<Type>) {
	return (
		<RACTimeField
			{...props}
			className={composeTailwindRenderProps(props.className, fieldStyles())}
			data-slot="control"
		/>
	);
}

export { DateInput as TimeInput } from '@/components/ui/DateField';
