'use client';

import { ChevronDownIcon, XCircleIcon } from 'lucide-react';
import { use, type ReactNode } from 'react';
import type {
	ComboBoxProps as RACComboBoxProps,
	InputProps as RACInputProps,
	ListBoxProps as RACListBoxProps,
	ValidationResult as RACValidationResult,
} from 'react-aria-components';
import { ComboBoxStateContext as RACComboBoxStateContext, ComboBox as RACComboBox } from 'react-aria-components';
import { Button } from '@/components/ui/Button';
import { Description, FieldError, FieldGroup, Input, Label } from '@/components/ui/Field';
import { ListBox } from '@/components/ui/ListBox';
import { PopoverContent, type PopoverContentProps } from '@/components/ui/Popover';
import { cx } from '@/styles/cva';
import { composeTailwindRenderProps } from '@/styles/util';

export type ComboBoxProps<Type extends object> = Omit<RACComboBoxProps<Type>, 'children'> & {
	readonly children: ReactNode;
	readonly description?: string | null;
	readonly errorMessage?: string | ((validation: RACValidationResult) => string) | undefined;
	readonly label?: string;
	readonly placeholder?: string;
};

export function ComboBox<Type extends object>(props: ComboBoxProps<Type>) {
	return (
		<RACComboBox
			{...props}
			className={composeTailwindRenderProps(props.className, 'group flex w-full flex-col gap-1.5')}
			data-slot="combo-box"
		>
			{props.label && <Label>{props.label}</Label>}
			{props.children}
			{props.description && <Description>{props.description}</Description>}
			<FieldError>{props.errorMessage}</FieldError>
		</RACComboBox>
	);
}

export type ComboBoxListProps<Type extends object> = Pick<PopoverContentProps, 'placement'> &
	RACListBoxProps<Type> & {
		readonly classNames?: {
			readonly popover?: PopoverContentProps['className'];
		};
	};

export function ComboBoxList<Type extends object>(props: ComboBoxListProps<Type>) {
	return (
		<PopoverContent
			className={cx(
				'w-[calc(var(--trigger-width)+var(--spacing)_*_2)] min-w-[calc(var(--trigger-width)+var(--spacing)_*_2)] scroll-py-1 overflow-y-auto overscroll-contain',
				props.classNames?.popover,
			)}
			isNonModal
			placement={props.placement!}
			respectScreen={false}
			showArrow={false}
		>
			<ListBox {...props} className={cx('grid-cols-[auto_1fr] border-0', props.className)}>
				{props.children}
			</ListBox>
		</PopoverContent>
	);
}

export function ComboBoxClearButton() {
	const state = use(RACComboBoxStateContext);

	return (
		<Button
			aria-label="Clear"
			className="flex size-6 place-items-center p-0.5"
			excludeFromTabOrder
			onPress={() => {
				state?.setSelectedKey(null);
				state?.open();
			}}
			preventFocusOnPress
			size="icon"
			slot={null}
			variant="unset"
		>
			<XCircleIcon
				aria-hidden
				className="animate-in size-6 shrink-0 transition forced-colors:text-[ButtonText] forced-colors:group-disabled:text-[GrayText]"
				size={24}
				strokeWidth={1.5}
			/>
		</Button>
	);
}

export function ComboBoxInput(props: RACInputProps) {
	const context = use(RACComboBoxStateContext);

	return (
		<FieldGroup className="relative pl-0">
			<Input {...props} placeholder={props?.placeholder} />
			{(context?.inputValue || context?.selectedKey) && <ComboBoxClearButton />}
			<Button className={cx('size-6 p-0.5', 'inputValue' in (context ?? {}) && 'ml-2')} size="icon" variant="unset">
				<ChevronDownIcon
					aria-hidden
					className="size-6 shrink-0 transition duration-200 group-open:rotate-180 forced-colors:text-[ButtonText] forced-colors:group-disabled:text-[GrayText]"
					size={24}
					strokeWidth={1.5}
				/>
			</Button>
		</FieldGroup>
	);
}

export {
	DropdownItem as ComboBoxOption,
	DropdownLabel as ComboBoxLabel,
	DropdownSection as ComboBoxSection,
	DropdownDescription as ComboBoxDescription,
} from '@/components/ui/Dropdown';
