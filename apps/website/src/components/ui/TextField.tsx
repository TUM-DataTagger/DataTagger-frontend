'use client';

import type { TextFieldProps as RACTextFieldProps } from 'react-aria-components';
import { TextField as RACTextField } from 'react-aria-components';
import { fieldStyles } from '@/components/ui/Field';
import { composeTailwindRenderProps } from '@/styles/util';

export function TextField(props: RACTextFieldProps) {
	return (
		<RACTextField
			{...props}
			className={composeTailwindRenderProps(props.className, fieldStyles())}
			data-slot="control"
		/>
	);
}
