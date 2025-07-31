'use client';

import type { VariantProps } from 'cva';
import { CheckIcon, ChevronRightIcon } from 'lucide-react';
import { createContext, use, type ComponentProps, type Ref } from 'react';
import type {
	MenuItemProps as RACMenuItemProps,
	MenuProps as RACMenuProps,
	MenuSectionProps as RACMenuSectionProps,
	MenuTriggerProps as RACMenuTriggerProps,
	SubmenuTriggerProps as RACSubmenuTriggerProps,
	PopoverProps as RACPopoverProps,
} from 'react-aria-components';
import {
	Collection as RACCollection,
	Header as RACHeader,
	MenuItem as RACMenuItem,
	Menu as RACMenu,
	MenuSection as RACMenuSection,
	MenuTrigger as RACMenuTrigger,
	SubmenuTrigger as RACSubmenuTrigger,
	composeRenderProps,
} from 'react-aria-components';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { dropdownItemStyles } from '@/components/ui/Dropdown';
import { PopoverContent } from '@/components/ui/Popover';
import { cx } from '@/styles/cva';

type MenuContextProps = {
	readonly respectScreen: boolean;
};

const MenuContext = createContext<MenuContextProps>({ respectScreen: true });

type MenuProps = RACMenuTriggerProps & {
	readonly respectScreen?: boolean;
};

export function Menu({ respectScreen = true, ...props }: MenuProps) {
	return (
		<MenuContext value={{ respectScreen }}>
			<RACMenuTrigger {...props}>{props.children}</RACMenuTrigger>
		</MenuContext>
	);
}

export function MenuSubMenu({ delay = 0, ...props }: RACSubmenuTriggerProps) {
	return (
		<RACSubmenuTrigger {...props} delay={delay}>
			{props.children}
		</RACSubmenuTrigger>
	);
}

type MenuTriggerProps = ComponentProps<typeof Button> & {
	readonly className?: string;
	readonly ref?: Ref<HTMLButtonElement>;
};

export function MenuTrigger(props: MenuTriggerProps) {
	return <Button {...props} className={cx('relative', props.className)} data-slot="menu-trigger" />;
}

type MenuContentProps<Type> = Pick<
	RACPopoverProps,
	| 'arrowBoundaryOffset'
	| 'crossOffset'
	| 'isOpen'
	| 'offset'
	| 'onOpenChange'
	| 'placement'
	| 'shouldFlip'
	| 'triggerRef'
> &
	RACMenuProps<Type> & {
		readonly className?: string;
		readonly classNames?: {
			readonly popover?: RACPopoverProps['className'];
		};
		readonly respectScreen?: boolean;
		readonly showArrow?: boolean;
	};

export function MenuContent<Type extends object>({ showArrow = false, ...props }: MenuContentProps<Type>) {
	const { respectScreen: respectScreenContext } = use(MenuContext);
	const respectScreen = props.respectScreen ?? respectScreenContext;

	return (
		<PopoverContent
			arrowBoundaryOffset={props.arrowBoundaryOffset!}
			className={cx('z-50 min-w-(--trigger-width) p-0 shadow-xs outline-hidden', props.classNames?.popover)}
			crossOffset={props.crossOffset!}
			isOpen={props.isOpen!}
			offset={props.offset!}
			onOpenChange={props.onOpenChange!}
			placement={props.placement!}
			respectScreen={respectScreen}
			shouldFlip={props.shouldFlip!}
			showArrow={showArrow}
			triggerRef={props.triggerRef!}
		>
			<RACMenu
				{...props}
				className={cx(
					'grid max-h-[calc(var(--visual-viewport-height)-10rem)] grid-cols-[auto_1fr] gap-x-2 overflow-auto p-2 outline-hidden sm:max-h-[inherit] *:[[role="group"]+[role="group"]]:mt-4 *:[[role="group"]+[role="separator"]]:mt-1',
					props.className,
				)}
			/>
		</PopoverContent>
	);
}

export function StandaloneMenuContent<Type extends object>(props: RACMenuProps<Type>) {
	return (
		<RACMenu
			{...props}
			className={cx(
				'grid max-h-[calc(var(--visual-viewport-height)-10rem)] grid-cols-[auto_1fr] gap-x-2 overflow-auto p-2 outline-hidden sm:max-h-[inherit] *:[[role="group"]+[role="group"]]:mt-4 *:[[role="group"]+[role="separator"]]:mt-1',
				props.className,
			)}
		/>
	);
}

type MenuItemProps = RACMenuItemProps &
	VariantProps<typeof dropdownItemStyles> & {
		readonly disallowSelection?: boolean;
		readonly isDestructive?: boolean;
	};

export function MenuItem({ isDestructive = false, ...props }: MenuItemProps) {
	const textValue = props.textValue ?? (typeof props.children === 'string' ? props.children : undefined);

	return (
		<RACMenuItem
			{...props}
			className={composeRenderProps(props.className, (className, renderProps) =>
				dropdownItemStyles({
					...renderProps,
					className: renderProps.hasSubmenu
						? cx('', className)
						: cx(
								renderProps.selectionMode === 'multiple' &&
									'grid-cols-[auto_1fr] gap-2 supports-[grid-template-columns:subgrid]:grid-cols-[auto_1fr]',
								className,
							),
				}),
			)}
			data-destructive={isDestructive ? 'true' : undefined}
			textValue={textValue!}
		>
			{(values) => (
				<>
					{values.selectionMode === 'multiple' && !props.disallowSelection && (
						<Checkbox isSelected={values.isSelected} />
					)}

					{typeof props.children === 'function' ? props.children(values) : props.children}

					{values.isSelected && (
						<>
							{values.selectionMode === 'single' && (
								<div
									className="bg-base-lavender-600 dark:bg-base-lavender-400 flex size-[18px] place-content-center place-items-center place-self-end self-center rounded-full"
									data-slot="checked-icon"
								>
									<CheckIcon
										aria-hidden
										className="text-base-neutral-40 dark:text-base-neutral-900 size-3.5 shrink-0"
									/>
								</div>
							)}
						</>
					)}

					{values.hasSubmenu && (
						<ChevronRightIcon aria-hidden className="absolute right-2 size-3.5" data-slot="chevron" />
					)}
				</>
			)}
		</RACMenuItem>
	);
}

export type MenuHeaderProps = ComponentProps<typeof RACHeader> & {
	readonly separator?: boolean;
};

export function MenuHeader({ className, separator = false, ...props }: MenuHeaderProps) {
	return (
		<RACHeader
			{...props}
			className={cx(
				'text-base-label-sm col-span-full px-2.5 py-2',
				separator && '-mx-1 mb-1 border-b sm:px-3 sm:pb-[0.625rem]',
				className,
			)}
		/>
	);
}

type MenuSectionProps<Type> = RACMenuSectionProps<Type> & {
	readonly ref?: Ref<HTMLDivElement>;
	readonly title?: string;
};

export function MenuSection<Type extends object>(props: MenuSectionProps<Type>) {
	return (
		<RACMenuSection {...props} className={cx('col-span-full grid grid-cols-[auto_1fr]', props.className)}>
			{props.title && <RACHeader className="text-base-label-sm col-span-full px-2.5 py-1">{props.title}</RACHeader>}
			<RACCollection items={props.items!}>{props.children}</RACCollection>
		</RACMenuSection>
	);
}

export {
	DropdownSeparator as MenuSeparator,
	DropdownDescription as MenuItemDescription,
	DropdownKeyboard as MenuItemKeyboard,
	DropdownLabel as MenuItemLabel,
} from '@/components/ui/Dropdown';
