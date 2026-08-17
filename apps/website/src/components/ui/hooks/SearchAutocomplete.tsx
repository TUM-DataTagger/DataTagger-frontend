'use client';

import { useSearchAutocomplete, type AriaSearchAutocompleteProps } from '@react-aria/autocomplete';
import { useListBox, useOption } from '@react-aria/listbox';
import { usePopover, Overlay } from '@react-aria/overlays';
import { useResizeObserver } from '@react-aria/utils';
import { useComboBoxState } from '@react-stately/combobox';
import type { Node } from '@react-types/shared';
import { use, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react';
import { DismissButton, /* useButton,  */ useFilter } from 'react-aria';
import type { AriaComboBoxProps, AriaListBoxProps, AriaPopoverProps } from 'react-aria';
import { FormValidationContext, type OverlayTriggerState } from 'react-stately';
import { inputStyles } from '@/styles/ui/input';
import { itemStyles } from '@/styles/ui/listbox';
import { popoverStyles } from '@/styles/ui/popover';

type ListBoxProps = Omit<AriaListBoxProps<object>, 'children'> & {
	readonly className?: string;
	readonly listBoxRef: RefObject<HTMLUListElement | null>;
	readonly state: Parameters<typeof useListBox<object>>[1];
	readonly style?: CSSProperties;
};

function ListBox(props: ListBoxProps) {
	const { listBoxRef, state } = props;

	const { listBoxProps } = useListBox(props, state, listBoxRef);

	return (
		<ul {...listBoxProps} className={props.className} ref={listBoxRef} style={props.style}>
			{[...state.collection].map((item) => (
				<Option item={item} key={item.key} state={state} />
			))}
		</ul>
	);
}

function Option({
	item,
	state,
}: {
	readonly item: Node<object>;
	readonly state: Parameters<typeof useListBox<object>>[1];
}) {
	const ref = useRef(null);

	const { optionProps, isSelected, isFocusVisible, isDisabled } = useOption({ key: item.key }, state, ref);

	return (
		<li {...optionProps} className={itemStyles({ isSelected, isFocusVisible, isDisabled })} ref={ref}>
			{item.rendered}
			<div className="absolute right-4 bottom-0 left-4 hidden h-px bg-white/20 forced-colors:bg-[HighlightText] [.group[data-selected]:has(+[data-selected])_&]:block" />
		</li>
	);
}

type PopoverProps = AriaPopoverProps & {
	readonly children: ReactNode;
	readonly popoverRef?: RefObject<HTMLDivElement | null>;
	readonly state: OverlayTriggerState;
};

function Popover({ children, state, ...props }: PopoverProps) {
	const { popoverProps } = usePopover(props, state);

	return (
		<Overlay>
			<div {...popoverProps} className={popoverStyles()} ref={props.popoverRef}>
				{children}
				<DismissButton onDismiss={state.close} />
			</div>
		</Overlay>
	);
}

type SearchAutocompleteProps = AriaComboBoxProps<object> & AriaSearchAutocompleteProps<object>;

export function SearchAutocomplete(props: SearchAutocompleteProps) {
	const { contains } = useFilter({ sensitivity: 'base' });
	const state = useComboBoxState({ ...props, defaultFilter: contains });

	const inputRef = useRef<HTMLInputElement>(null);
	const listBoxRef = useRef<HTMLUListElement>(null);
	const popoverRef = useRef<HTMLDivElement>(null);
	// const buttonRef = useRef<HTMLButtonElement>(null);

	const {
		inputProps,
		listBoxProps,
		labelProps,
		/* clearButtonProps, */ descriptionProps,
		errorMessageProps,
		isInvalid,
	} = useSearchAutocomplete(
		{
			...props,
			popoverRef,
			listBoxRef,
			inputRef,
		},
		state,
	);

	// const { buttonProps } = useButton(clearButtonProps, buttonRef);

	const [menuWidth, setMenuWidth] = useState<string | null>(null);
	const onResize = () => {
		if (inputRef.current) {
			setMenuWidth(inputRef.current.offsetWidth + 'px');
		}
	};

	useResizeObserver({
		ref: inputRef,
		onResize,
	});

	const errors = use(FormValidationContext);
	const formError = typeof props.name === 'string' ? errors?.[props.name] : undefined;
	const fallbackErrorMessage = typeof props.errorMessage === 'function' ? undefined : props.errorMessage;
	const error = formError ?? fallbackErrorMessage;
	const listBoxStyle: CSSProperties & { '--trigger-width'?: string } = { '--trigger-width': menuWidth ?? undefined };

	return (
		<div className="flex flex-col gap-3">
			{props.label && (
				<label {...labelProps} className="cursor-default text-base-md transition-colors group-disabled:opacity-38">
					{props.label}
				</label>
			)}
			<div className="relative flex flex-col gap-1">
				<input
					{...inputProps}
					aria-label={props['aria-label']}
					className={inputStyles({
						isFocused: state.isOpen,
						className: 'min-w-0 flex-1 appearance-none rounded-none outline-0',
					})}
					ref={inputRef}
				/>
				{props.description && (
					<div {...descriptionProps} className="text-base-sm text-base-neutral-600 dark:text-base-neutral-300">
						{props.description}
					</div>
				)}
				{isInvalid && (
					<div
						{...errorMessageProps}
						className="flex place-items-center gap-1.5 text-base-sm text-base-sunset-500 forced-colors:text-[Mark]"
					>
						{error}
					</div>
				)}
				{state.isOpen && (
					<Popover isNonModal placement="bottom start" popoverRef={popoverRef} state={state} triggerRef={inputRef}>
						<ListBox
							{...listBoxProps}
							className="w-[calc(var(--trigger-width)-1rem)]"
							listBoxRef={listBoxRef}
							state={state}
							style={listBoxStyle}
						/>
					</Popover>
				)}
			</div>
		</div>
	);
}
