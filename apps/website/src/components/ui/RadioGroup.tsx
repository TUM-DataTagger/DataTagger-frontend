'use client';

import type { ReactNode } from 'react';
import { Radio as RACRadio, RadioGroup as RACRadioGroup } from 'react-aria-components';
import type {
	RadioGroupProps as RACRadioGroupProps,
	RadioProps as RACRadioProps,
	ValidationResult as RACValidationResult,
} from 'react-aria-components';
import { Description, FieldError, Label } from '@/components/ui/Field';
import { compose, cva, cx } from '@/styles/cva';
import { focusRing } from '@/styles/ui/focusRing';
import { composeTailwindRenderProps } from '@/styles/util';

export type RadioGroupProps = RACRadioGroupProps & {
	readonly classNames?: {
		readonly content?: string;
	};
	readonly description?: string;
	readonly errorMessage?: string | ((validation: RACValidationResult) => string) | undefined;
	readonly label?: ReactNode | string;
};

export function RadioGroup(props: RadioGroupProps) {
	return (
		<RACRadioGroup
			{...props}
			className={composeTailwindRenderProps(props.className, 'group flex flex-col gap-2')}
			isInvalid={Boolean(props.errorMessage)}
		>
			{props.label && <Label>{props.label}</Label>}
			<div
				className={cx(
					'group-orientation-vertical:flex-col group-orientation-horizontal:flex-wrap group-orientation-vertical:gap-2 group-orientation-horizontal:gap-4 flex gap-2 select-none',
					props.classNames?.content,
				)}
			>
				{props.children as ReactNode}
			</div>
			{props.description && <Description className="block">{props.description}</Description>}
			<FieldError>{props.errorMessage}</FieldError>
		</RACRadioGroup>
	);
}

const radioStyles = compose(
	focusRing,
	cva({
		base: 'flex shrink-0 place-content-center place-items-center transition',
		variants: {
			variant: {
				unset: null,
				default: [
					'size-4 rounded-full border-[1.5px]',
					'border-base-neutral-300 bg-base-neutral-0',
					'group-hover:border-base-neutral-200',
					'group-focus-visible:border-base-neutral-200',
					'group-pressed:border-base-neutral-100',
					'group-disabled:bg-base-neutral-200 group-disabled:border-transparent',
					'group-invalid:border-base-sunset-500',
					'group-invalid:group-hover:border-base-sunset-200 dark:group-invalid:group-hover:border-base-sunset-700',
					'group-invalid:group-focus-visible:border-base-sunset-200 dark:group-invalid:group-focus-visible:border-base-sunset-700',
					'group-invalid:group-pressed:border-base-sunset-100 dark:group-invalid:group-pressed:border-base-sunset-800',
				],
			},
			isSelected: {
				true: [
					'*:data-[slot=indicator]:bg-base-neutral-700 border-base-neutral-700',
					'group-hover:*:data-[slot=indicator]:bg-base-neutral-500 group-hover:border-base-neutral-500',
					'group-focus-visible:*:data-[slot=indicator]:bg-base-neutral-500 group-focus-visible:border-base-neutral-500',
					'group-pressed:*:data-[slot=indicator]:bg-base-neutral-400 group-pressed:border-base-neutral-400',
					'group-disabled:*:data-[slot=indicator]:bg-base-neutral-900 group-disabled:bg-base-neutral-200 group-disabled:border-transparent',
					'group-invalid:bg-base-sunset-500 group-invalid:text-base-neutral-900',
					'group-invalid:group-hover:bg-base-sunset-200 dark:group-invalid:group-hover:bg-base-sunset-700 dark:group-invalid:group-hover:text-base-neutral-40',
					'group-invalid:group-focus-visible:bg-base-sunset-200 dark:group-invalid:group-focus-visible:bg-base-sunset-700 dark:group-invalid:group-focus-visible:text-base-neutral-40',
					'group-invalid:group-pressed:bg-base-sunset-100 dark:group-invalid:group-pressed:bg-base-sunset-800 dark:group-invalid:group-pressed:text-base-neutral-40',
				],
			},
		},
		defaultVariants: {
			variant: 'default',
		},
	}),
);

export type RadioProps = RACRadioProps & {
	readonly classNames?: {
		readonly indicator?: string;
	};
	readonly description?: string;
	readonly label?: string;
	readonly showIndicator?: boolean;
};

export function Radio({ showIndicator = true, ...props }: RadioProps) {
	return (
		<RACRadio
			{...props}
			className={composeTailwindRenderProps(
				props.className,
				'group text-base-label-md flex place-items-center gap-2 transition disabled:opacity-38 forced-colors:disabled:text-[GrayText]',
			)}
		>
			{(renderProps) => (
				<div
					className={cx(
						'flex place-content-center place-items-center',
						showIndicator && 'size-10',
						showIndicator && (props.label || props.description || props.children) && 'gap-2',
						props.classNames?.indicator,
					)}
				>
					{showIndicator && (
						<div
							className={radioStyles({
								...renderProps,
								className: 'description' in props ? 'mt-1' : 'mt-0.5',
							})}
						>
							<span aria-hidden className="size-2 rounded-full" data-slot="indicator" />
						</div>
					)}

					<div className="flex flex-col gap-1">
						{props.label || props.description ? (
							<>
								{props.label && <Label>{props.label}</Label>}
								{props.description && <Description className="block">{props.description}</Description>}
							</>
						) : (
							(props.children as ReactNode)
						)}
					</div>
				</div>
			)}
		</RACRadio>
	);
}
