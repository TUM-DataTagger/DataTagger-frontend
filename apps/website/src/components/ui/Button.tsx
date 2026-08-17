'use client';

import type { VariantProps } from 'cva';
import type { Ref } from 'react';
import { Button as RACButton, composeRenderProps } from 'react-aria-components';
import type { ButtonProps as RACButtonProps } from 'react-aria-components';
import { buttonStyles } from '@/styles/ui/button';

export type ButtonProps = RACButtonProps &
	VariantProps<typeof buttonStyles> & { readonly ref?: Ref<HTMLButtonElement> | undefined };

export function Button(props: ButtonProps) {
	return (
		<RACButton
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
		</RACButton>
	);
}
