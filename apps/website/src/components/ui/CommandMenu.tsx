'use client';

import { LoaderCircleIcon, SearchIcon } from 'lucide-react';
import { createContext, type ComponentProps, use, useEffect, useMemo } from 'react';
import type {
	AutocompleteProps as RACAutocompleteProps,
	CollectionRenderer,
	MenuProps as RACMenuProps,
	MenuSectionProps as RACMenuSectionProps,
	MenuTriggerProps as RACMenuTriggerProps,
	ModalOverlayProps as RACModalOverlayProps,
	SearchFieldProps as RACSearchFieldProps,
	MenuItemProps as RACMenuItemProps,
} from 'react-aria-components';
import {
	Autocomplete,
	Collection as RACCollection,
	CollectionRendererContext,
	DefaultCollectionRenderer,
	Dialog as RACDialog,
	Header as RACHeader,
	Input as RACInput,
	Menu as RACMenu,
	MenuItem as RACMenuItem,
	MenuSection as RACMenuSection,
	Modal as RACModal,
	ModalContext,
	ModalOverlay as RACModalOverlay,
	OverlayTriggerStateContext,
	SearchField as RACSearchField,
	composeRenderProps,
	useFilter,
} from 'react-aria-components';
import { Button } from '@/components/ui/Button';
import { MenuDescription, MenuSeparator } from '@/components/ui/Menu';
import { cva, cx } from '@/styles/cva';

const commandMenuSizes = {
	xs: 'max-w-xs',
	sm: 'max-w-sm',
	md: 'max-w-md',
	lg: 'max-w-lg',
	xl: 'max-w-xl',
	'2xl': 'max-w-2xl',
	'3xl': 'max-w-3xl',
} as const;

type CommandMenuProviderValue = {
	readonly escapeButton?: boolean;
	readonly isPending?: boolean;
};

const CommandMenuContext = createContext<CommandMenuProviderValue | null>(null);

function useCommandMenu() {
	const context = use(CommandMenuContext);

	if (!context) {
		throw new Error('useCommandMenu must be used within <CommandMenu>.');
	}

	return context;
}

export type CommandMenuProps = RACAutocompleteProps &
	RACMenuTriggerProps &
	CommandMenuProviderValue & {
		readonly 'aria-label'?: string;
		readonly className?: string;
		readonly isDismissable?: boolean;
		readonly overlay?: Pick<RACModalOverlayProps, 'className'>;
		readonly shortcut?: string;
		readonly size?: keyof typeof commandMenuSizes;
	};

export function CommandMenu({
	onOpenChange,
	className,
	isDismissable = true,
	escapeButton = true,
	isPending,
	overlay,
	size = 'xl',
	shortcut,
	...props
}: CommandMenuProps) {
	const { contains } = useFilter({ sensitivity: 'base' });
	const filter = (textValue: string, inputValue: string) => contains(textValue, inputValue);
	const commandMenuContextValue = useMemo(() => ({ isPending, escapeButton }), [escapeButton, isPending]);
	const modalContextValue = useMemo(() => ({ isOpen: props.isOpen, onOpenChange }), [onOpenChange, props.isOpen]);

	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			const key = event.key.toLowerCase();
			const isShortcut = shortcut && key === shortcut.toLowerCase() && (event.metaKey || event.ctrlKey);

			if (isShortcut) {
				event.preventDefault();
				onOpenChange?.(props.isOpen === undefined ? true : !props.isOpen);
				return;
			}

			if (event.key === 'Escape' && props.isOpen) {
				const target = event.target;
				if (target instanceof HTMLInputElement && target.value.length > 0) {
					return;
				}

				event.preventDefault();
				onOpenChange?.(false);
			}
		};

		window.addEventListener('keydown', onKeyDown, { capture: true });

		return () => {
			window.removeEventListener('keydown', onKeyDown, { capture: true });
		};
	}, [shortcut, onOpenChange, props.isOpen]);

	return (
		<CommandMenuContext value={commandMenuContextValue}>
			<ModalContext value={modalContextValue}>
				<RACModalOverlay
					{...props}
					className={cx(
						'fixed inset-0 z-50 grid h-(--visual-viewport-height,100vh) grid-rows-[1fr_auto] place-items-center bg-base-neutral-900/72 p-4 sm:grid-rows-[1fr_auto_3fr]',
						'entering:animate-in entering:duration-300 entering:ease-out entering:fade-in',
						'exiting:animate-out exiting:duration-200 exiting:ease-in exiting:fade-out',
						overlay?.className,
					)}
					data-slot="command-menu-overlay"
					isDismissable={isDismissable}
				>
					<RACModal
						className={cx(
							'relative row-start-2 max-h-full w-full overflow-hidden rounded-lg bg-base-neutral-0 text-left align-middle shadow-base-xl [--visual-viewport-vertical-padding:16px] sm:[--visual-viewport-vertical-padding:32px] dark:bg-base-neutral-800',
							commandMenuSizes[size],
							'entering:animate-in entering:duration-200 entering:ease-out entering:fade-in entering:slide-in-from-bottom md:entering:zoom-in-95',
							'exiting:animate-out exiting:duration-200 exiting:ease-in exiting:fade-out exiting:slide-out-to-bottom md:exiting:zoom-out-95',
							className,
						)}
						data-slot="command-menu-content"
					>
						<RACDialog
							aria-label={props['aria-label'] ?? 'Command Menu'}
							className="peer/dialog group/dialog relative flex max-h-[calc(var(--visual-viewport-height)-var(--visual-viewport-vertical-padding))] [scrollbar-width:thin] flex-col overflow-hidden outline-hidden [--dialog-gutter:--spacing(6)]"
							data-slot="command-menu"
						>
							<Autocomplete filter={filter} {...props} />
						</RACDialog>
					</RACModal>
				</RACModalOverlay>
			</ModalContext>
		</CommandMenuContext>
	);
}

const commandMenuRenderer: CollectionRenderer = {
	CollectionRoot(props) {
		if (props.collection.size === 0) {
			return (
				<div
					className="flex flex-col place-content-center place-items-center gap-2 px-6 py-12"
					role="presentation"
					data-slot="command-menu-empty-state"
				>
					<span className="text-base-lg text-base-neutral-600 dark:text-base-neutral-300">
						No matching results found
					</span>
					<span className="text-base-neutral-600 dark:text-base-neutral-300">Please try other search inputs.</span>
				</div>
			);
		}

		return <DefaultCollectionRenderer.CollectionRoot {...props} />;
	},
	CollectionBranch: DefaultCollectionRenderer.CollectionBranch,
};

export type CommandMenuSearchProps = RACSearchFieldProps & {
	readonly className?: string;
	readonly placeholder?: string;
};

export function CommandMenuSearch({ className, placeholder, ...props }: CommandMenuSearchProps) {
	const state = use(OverlayTriggerStateContext);
	const { isPending, escapeButton } = useCommandMenu();

	return (
		<RACSearchField
			{...props}
			autoFocus
			aria-label={props['aria-label'] ?? 'Quick search'}
			className={cx(
				'relative flex w-full items-center gap-3 border-b border-base-neutral-100 px-6 py-5 dark:border-base-neutral-700',
				className,
			)}
			data-slot="command-menu-search"
		>
			{isPending ? (
				<LoaderCircleIcon
					aria-hidden
					className="size-5 shrink-0 animate-spin text-base-neutral-600 dark:text-base-neutral-300"
					data-slot="command-menu-search-spinner"
					strokeWidth={1.5}
				/>
			) : (
				<SearchIcon
					aria-hidden
					className="size-5 shrink-0 text-base-neutral-600 dark:text-base-neutral-300"
					data-slot="command-menu-search-icon"
					strokeWidth={1.5}
				/>
			)}
			<RACInput
				className="w-full min-w-0 bg-transparent text-base-md text-base-neutral-900 outline-hidden placeholder:text-base-neutral-500 focus:outline-hidden dark:text-base-neutral-40 dark:placeholder:text-base-neutral-400"
				placeholder={placeholder ?? 'Search...'}
			/>
			{escapeButton && (
				<Button
					onPress={() => state?.close()}
					className="hidden cursor-default rounded-sm border border-base-neutral-300 px-1.5 py-0.5 text-base-sm text-base-neutral-700 hover:bg-base-neutral-80 md:inline dark:border-base-neutral-500 dark:text-base-neutral-100 dark:hover:bg-base-neutral-700/72"
					type="button"
					variant="unset"
				>
					Esc
				</Button>
			)}
		</RACSearchField>
	);
}

export function CommandMenuList<Type extends object>(props: RACMenuProps<Type>) {
	return (
		<CollectionRendererContext.Provider value={commandMenuRenderer}>
			<RACMenu
				{...props}
				className={cx('flex h-full w-full flex-col overflow-y-auto outline-hidden', props.className)}
				data-slot="command-menu-list"
			/>
		</CollectionRendererContext.Provider>
	);
}

export type CommandMenuSectionProps<Type extends object> = RACMenuSectionProps<Type> & {
	readonly label?: string;
};

export function CommandMenuSection<Type extends object>(props: CommandMenuSectionProps<Type>) {
	return (
		<RACMenuSection
			{...props}
			className={cx('flex w-full flex-col gap-1', props.className)}
			data-slot="command-menu-section"
		>
			{props.label && (
				<RACHeader className="h-8 px-3 py-2 text-base-label-sm text-base-neutral-600 dark:text-base-neutral-300">
					{props.label}
				</RACHeader>
			)}
			<RACCollection items={props.items}>{props.children}</RACCollection>
		</RACMenuSection>
	);
}

const commandMenuItemStyles = cva({
	base: [
		'flex min-h-10 cursor-default place-items-center gap-2 rounded-sm px-3 py-2.5 text-base-md outline-hidden select-none forced-colors:text-[CanvasText]',
	],
	variants: {
		isDisabled: {
			true: 'opacity-38 forced-colors:text-[GrayText]',
		},
		isFocused: {
			true: 'bg-base-neutral-80 dark:bg-base-neutral-700/72',
		},
		isHovered: {
			true: 'bg-base-neutral-80 dark:bg-base-neutral-700/72',
		},
		isPressed: {
			true: 'bg-base-neutral-100 dark:bg-base-neutral-700/84',
		},
	},
});

export function CommandMenuItem(props: RACMenuItemProps) {
	const textValue = props.textValue ?? (typeof props.children === 'string' ? props.children : undefined);

	return (
		<RACMenuItem
			{...props}
			className={composeRenderProps(props.className, (className, renderProps) =>
				commandMenuItemStyles({
					...renderProps,
					className,
				}),
			)}
			textValue={textValue!}
		/>
	);
}

export function CommandMenuDescription(props: ComponentProps<typeof MenuDescription>) {
	return <MenuDescription {...props} className={cx('ms-auto', props.className)} />;
}

export function CommandMenuSeparator(props: ComponentProps<typeof MenuSeparator>) {
	return <MenuSeparator {...props} className={cx('mx-6 my-2', props.className)} />;
}

export function CommandMenuFooter(props: ComponentProps<'div'>) {
	return (
		<div
			{...props}
			className={cx(
				'flex place-content-between place-items-center rounded-b-lg border-t border-base-neutral-100 bg-base-neutral-60 px-6 py-4 dark:border-base-neutral-700 dark:bg-base-neutral-700/40',
				props.className,
			)}
			data-slot="command-menu-footer"
		/>
	);
}

export function CommandMenuShortcut(props: ComponentProps<'span'>) {
	return (
		<span
			{...props}
			className={cx(
				'rounded-sm bg-base-neutral-100 px-2 py-1 text-base-sm text-base-neutral-900 dark:bg-base-neutral-700 dark:text-base-neutral-100',
				props.className,
			)}
		/>
	);
}

export { MenuLabel as CommandMenuLabel } from '@/components/ui/Menu';
