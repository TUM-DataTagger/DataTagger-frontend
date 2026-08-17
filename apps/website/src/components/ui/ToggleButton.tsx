'use client';

import type { VariantProps } from 'cva';
import type { Ref } from 'react';
import { ToggleButton as ToggleRACButton, composeRenderProps } from 'react-aria-components';
import type { ToggleButtonProps as RACToggleButtonProps } from 'react-aria-components';
import { buttonStyles } from '@/styles/ui/button';

export type ToggleButtonProps = RACToggleButtonProps &
	VariantProps<typeof buttonStyles> & { readonly ref?: Ref<HTMLButtonElement> | undefined };

export function ToggleButton(props: ToggleButtonProps) {
	return (
		<ToggleRACButton
			{...props}
			className={composeRenderProps(props.className, (className, renderProps) =>
				buttonStyles({
					...renderProps,
					variant: props.variant,
					size: props.size,
					isDestructive: props.isDestructive,
					isDark: props.isDark,
					className,
				}),
			)}
			ref={props.ref}
		>
			{(values) => <>{typeof props.children === 'function' ? props.children(values) : props.children}</>}
		</ToggleRACButton>
	);
}
