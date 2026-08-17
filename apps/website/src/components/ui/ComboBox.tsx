'use client';

import { ChevronDownIcon } from 'lucide-react';
import type { ReactNode, UIEvent } from 'react';
import type {
	ComboBoxValueProps as RACComboBoxValueProps,
	PopoverProps,
	ComboBoxProps as RACComboBoxProps,
	InputProps as RACInputProps,
	ListBoxProps as RACListBoxProps,
} from 'react-aria-components';
import {
	ComboBoxContext as RACComboBoxContext,
	ComboBox as RACComboBox,
	ComboBoxValue as RACComboBoxValue,
	ListBox as RACListBox,
	ListBoxItem as RACListBoxItem,
	useSlottedContext,
} from 'react-aria-components';
import { Button } from '@/components/ui/Button';
import { fieldStyles } from '@/components/ui/Field';
import { Input, InputGroup } from '@/components/ui/Input';
import { PopoverContent } from '@/components/ui/Popover';
import { cx } from '@/styles/cva';
import { composeTailwindRenderProps } from '@/styles/util';

export type ComboBoxProps<Type extends object> = Omit<RACComboBoxProps<Type>, 'children'> & {
	readonly children: ReactNode;
};

export function ComboBox<Type extends object>(props: ComboBoxProps<Type>) {
	return (
		<RACComboBox
			{...props}
			className={composeTailwindRenderProps(props.className, fieldStyles())}
			data-slot="control"
		/>
	);
}

type ComboBoxListProps<Type extends object> = Omit<RACListBoxProps<Type>, 'layout' | 'orientation'> &
	Pick<PopoverProps, 'placement'> & {
		readonly loadMore?: {
			readonly hasMore: boolean;
			readonly isLoadingMore: boolean;
			onLoadMore(): void;
		};
		readonly popover?: Omit<PopoverProps, 'children'>;
	};

export function ComboBoxContent<Type extends object>({ loadMore, popover, ...props }: ComboBoxListProps<Type>) {
	const handleScrollCapture = (event: UIEvent<HTMLDivElement>) => {
		(popover as { onScrollCapture?(event: UIEvent<HTMLDivElement>): void } | undefined)?.onScrollCapture?.(event);
		if (!loadMore?.hasMore || loadMore.isLoadingMore) {
			return;
		}

		const target = event.target instanceof HTMLElement ? event.target : event.currentTarget;
		const distanceFromBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
		if (distanceFromBottom <= Math.max(target.clientHeight, 64)) {
			loadMore.onLoadMore();
		}
	};

	return (
		<PopoverContent
			{...popover}
			className={cx('min-w-(--trigger-width) scroll-py-1 overflow-y-auto overscroll-contain', popover?.className)}
			onScrollCapture={handleScrollCapture}
			placement={popover?.placement ?? 'bottom'}
			arrow={false}
		>
			<RACListBox
				{...props}
				className={cx(
					"grid max-h-96 w-full grid-cols-[auto_1fr] flex-col gap-y-1 p-1 outline-hidden *:[[role='group']+[role='separator']]:mt-1",
					props.className,
				)}
				layout="stack"
				orientation="vertical"
			>
				{typeof props.children === 'function' ? (
					props.children
				) : (
					<>
						{props.children}
						{loadMore?.isLoadingMore ? (
							<RACListBoxItem
								id="__combobox-loading-more__"
								isDisabled
								textValue="Loading more results"
								className="col-span-full px-3 py-2 text-base-label-sm text-base-neutral-600 dark:text-base-neutral-300"
							>
								Loading more...
							</RACListBoxItem>
						) : null}
					</>
				)}
			</RACListBox>
		</PopoverContent>
	);
}

export function ComboBoxInput(props: RACInputProps) {
	const context = useSlottedContext(RACComboBoxContext);

	return (
		<InputGroup>
			<Input {...props} placeholder={props?.placeholder ?? ''} />
			<Button className="*:data-[slot=icon]:size-6" size="icon" variant="unset">
				{!context?.inputValue && (
					<ChevronDownIcon
						className="transition duration-200 group-open:rotate-180 forced-colors:text-[ButtonText] forced-colors:group-disabled:text-[GrayText]"
						data-slot="icon"
						size={24}
						strokeWidth={1.5}
					/>
				)}
			</Button>
		</InputGroup>
	);
}

export function ComboBoxValue<Type extends object>(props: RACComboBoxValueProps<Type>) {
	return <RACComboBoxValue {...props} data-slot="control" />;
}

export {
	DropdownItem as ComboBoxItem,
	DropdownLabel as ComboBoxLabel,
	DropdownSection as ComboBoxSection,
	DropdownDescription as ComboBoxDescription,
} from '@/components/ui/Dropdown';
