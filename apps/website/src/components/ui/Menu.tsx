'use client';

import type { VariantProps } from 'cva';
import { CheckIcon, ChevronRightIcon } from 'lucide-react';
import type { ComponentProps } from 'react';
import type {
	MenuItemProps as RACMenuItemProps,
	MenuProps as RACMenuProps,
	MenuSectionProps as RACMenuSectionProps,
	MenuTriggerProps as RACMenuTriggerProps,
	SubmenuTriggerProps as RACSubmenuTriggerProps,
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
import { Button, type ButtonProps } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { dropdownItemStyles } from '@/components/ui/Dropdown';
import { PopoverContent, type PopoverContentProps } from '@/components/ui/Popover';
import { cx } from '@/styles/cva';

export function Menu(props: RACMenuTriggerProps) {
	return <RACMenuTrigger {...props} />;
}

export function MenuSubMenu({ delay = 0, ...props }: RACSubmenuTriggerProps) {
	return (
		<RACSubmenuTrigger {...props} delay={delay}>
			{props.children}
		</RACSubmenuTrigger>
	);
}

type MenuTriggerProps = ButtonProps;

export function MenuTrigger(props: MenuTriggerProps) {
	return <Button {...props} className={cx('relative', props.className)} data-slot="menu-trigger" />;
}

type MenuContentProps<Type> = Pick<PopoverContentProps, 'placement'> &
	RACMenuProps<Type> & {
		readonly className?: string;
		readonly popover?: Pick<
			PopoverContentProps,
			| 'arrow'
			| 'arrowBoundaryOffset'
			| 'className'
			| 'crossOffset'
			| 'isOpen'
			| 'offset'
			| 'onOpenChange'
			| 'placement'
			| 'shouldFlip'
			| 'triggerRef'
		>;
	};

export function MenuContent<Type extends object>({ popover, ...props }: MenuContentProps<Type>) {
	return (
		<PopoverContent
			{...popover}
			className={cx('min-w-(--trigger-width) *:data-[slot=popover-inner]:overflow-hidden', popover?.className)}
			placement={props.placement ?? 'bottom'}
		>
			<RACMenu
				{...props}
				className={cx(
					"grid max-h-[inherit] grid-cols-[auto_1fr] gap-x-2 overflow-x-hidden overflow-y-auto overscroll-contain p-2 outline-hidden *:[[role='group']+[role='group']]:mt-2 *:[[role='group']+[role='separator']]:mt-1",
					props.className,
				)}
				data-slot="menu-content"
			/>
		</PopoverContent>
	);
}

export function StandaloneMenuContent<Type extends object>(props: RACMenuProps<Type>) {
	return (
		<RACMenu
			{...props}
			className={cx(
				"grid max-h-[inherit] grid-cols-[auto_1fr] gap-x-2 overflow-x-hidden overflow-y-auto overscroll-contain p-2 outline-hidden *:[[role='group']+[role='group']]:mt-2 *:[[role='group']+[role='separator']]:mt-1",
				props.className,
			)}
			data-slot="menu-content"
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
			data-slot="menu-item"
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
									className="flex size-4.5 place-content-center place-items-center place-self-end self-center rounded-full bg-base-lavender-600 dark:bg-base-lavender-400"
									data-slot="checked-icon"
								>
									<CheckIcon
										aria-hidden
										className="size-3.5 shrink-0 text-base-neutral-40 dark:text-base-neutral-900"
									/>
								</div>
							)}
						</>
					)}

					{values.hasSubmenu && (
						<ChevronRightIcon aria-hidden className="absolute right-2 size-4" data-slot="chevron" />
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
				'col-span-full bg-base-neutral-40 p-4 dark:bg-base-neutral-700/40',
				separator && '-mx-2 border-b border-base-neutral-100 dark:border-base-neutral-700',
				className,
			)}
		/>
	);
}

type MenuSectionProps<Type> = RACMenuSectionProps<Type> & {
	readonly label?: string;
};

export function MenuSection<Type extends object>(props: MenuSectionProps<Type>) {
	return (
		<RACMenuSection
			{...props}
			className={cx('col-span-full grid grid-cols-[auto_1fr]', props.className)}
			data-slot="menu-section"
		>
			{props.label && <RACHeader className="col-span-full px-2.5 py-1 text-base-label-sm">{props.label}</RACHeader>}
			<RACCollection items={props.items!}>{props.children}</RACCollection>
		</RACMenuSection>
	);
}

export {
	DropdownSeparator as MenuSeparator,
	DropdownDescription as MenuDescription,
	DropdownKeyboard as MenuShortcut,
	DropdownLabel as MenuLabel,
} from '@/components/ui/Dropdown';
