'use client';

import type { VariantProps } from 'cva';
import type { ComponentProps } from 'react';
import { alertStyles } from '@/styles/ui/alert';

export function Alert(props: ComponentProps<'div'> & VariantProps<typeof alertStyles>) {
	return (
		<div {...props} className={alertStyles({ variant: props.variant, className: props.className })} role="alert" />
	);
}
