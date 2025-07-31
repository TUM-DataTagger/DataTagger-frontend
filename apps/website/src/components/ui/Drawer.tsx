'use client';

import {
	AnimatePresence,
	type PanInfo,
	animate,
	motion,
	useMotionTemplate,
	useMotionValue,
	useMotionValueEvent,
	useTransform,
} from 'motion/react';
import { createContext, use, useState, type ComponentProps, type ReactNode } from 'react';
import {
	Modal as RACModal,
	ModalOverlay as RACModalOverlay,
	type DialogProps as RACDialogProps,
} from 'react-aria-components';
import type { ButtonProps } from '@/components/ui/Button';
import { Dialog, DialogTrigger, DialogBody, DialogFooter, DialogHeader } from '@/components/ui/Dialog';
import { cx } from '@/styles/cva';

const inertiaTransition = {
	type: 'inertia',
	bounceStiffness: 300,
	bounceDamping: 60,
	timeConstant: 300,
};

const drawerMargin = 48;
const drawerRadius = 32;

type DrawerContextType = {
	closeDrawer(): void;
	isOpen: boolean;
	openDrawer(): void;
	withNotch?: boolean;
};

const DrawerContext = createContext<DrawerContextType | undefined>(undefined);

function useDrawerContext() {
	const context = use(DrawerContext);
	if (context === undefined) {
		throw new Error('useDrawerContext must be used within a Drawer');
	}

	return context;
}

const ModalWrapper = (props: ComponentProps<typeof RACModal>) => <RACModal {...props} />;

const ModalOverlayWrapper = (props: ComponentProps<typeof RACModalOverlay>) => <RACModalOverlay {...props} />;

const ModalPrimitive = motion.create(ModalWrapper);
const ModalOverlayPrimitive = motion.create(ModalOverlayWrapper);

type DrawerOverlayPrimitiveProps = Omit<
	ComponentProps<typeof ModalOverlayPrimitive>,
	'isOpen' | 'onOpenChange' | 'style'
> & {
	readonly 'aria-label'?: RACDialogProps['aria-label'];
	readonly 'aria-labelledby'?: RACDialogProps['aria-labelledby'];
	readonly children?: ReactNode;
	readonly role?: RACDialogProps['role'];
};

function DrawerContentPrimitive(props: DrawerOverlayPrimitiveProps) {
	const { closeDrawer, withNotch } = useDrawerContext();
	const [contentHeight, setContentHeight] = useState(0);

	const height = Math.min(contentHeight + drawerMargin, window.innerHeight - drawerMargin);
	const y = useMotionValue(height);
	const bgOpacity = useTransform(y, [0, height], [0.15, 0]);
	const bg = useMotionTemplate`rgba(0, 0, 0, ${bgOpacity})`;

	const root = document.querySelectorAll('body')[0] as HTMLElement;

	const bodyBorderRadius = useTransform(y, [0, height], [drawerRadius, 0]);

	useMotionValueEvent(bodyBorderRadius, 'change', (value) => {
		root.style.borderRadius = `${value}px`;
	});

	const onDragEnd = (_: any, { offset, velocity }: PanInfo) => {
		if (offset.y > height * 0.4 || velocity.y > 10) {
			closeDrawer();
		} else {
			animate(y, 0 as any, { ...inertiaTransition, min: 0, max: 0 } as any);
		}
	};

	return (
		<ModalOverlayPrimitive
			className={cx(
				'fixed top-0 left-0 isolate z-50 h-(--visual-viewport-height) w-full touch-none will-change-transform',
				'flex place-items-end [--visual-viewport-vertical-padding:100px]',
			)}
			isDismissable
			isOpen
			onOpenChange={closeDrawer}
			style={{
				backgroundColor: bg as any,
			}}
		>
			<ModalPrimitive
				{...props}
				animate={{ y: 0 }}
				className={cx(
					'bg-base-neutral-0 dark:bg-base-neutral-800 shadow-base-xl flex max-h-full w-full flex-col overflow-hidden rounded-t-2xl text-left align-middle',
				)}
				drag="y"
				dragConstraints={{ top: 0, bottom: height }}
				exit={{ y: height }}
				initial={{ y: height }}
				onDragEnd={onDragEnd}
				style={{
					y,
					top: 'auto',
					height: contentHeight > 0 ? `${contentHeight + drawerMargin}px` : 'auto',
					maxHeight: `calc(100% - ${drawerMargin}px)`,
				}}
				transition={{ duration: 0.15, ease: 'easeInOut' }}
			>
				<div className="overflow-hidden">
					{withNotch && (
						<div className="notch sticky top-0 mx-auto mt-2.5 h-1.5 w-10 shrink-0 touch-pan-y rounded-full" />
					)}
					<div
						className="mt-3 overflow-y-auto"
						ref={(el) => {
							if (el) {
								const resizeObserver = new ResizeObserver((entries) => {
									for (const entry of entries) {
										setContentHeight(entry.contentRect.height);
									}
								});
								resizeObserver.observe(el);
								return () => resizeObserver.disconnect();
							}

							return undefined;
						}}
					>
						{props.children}
					</div>
				</div>
			</ModalPrimitive>
		</ModalOverlayPrimitive>
	);
}

type DrawerPrimitiveProps = Omit<ComponentProps<typeof RACModal>, 'children'> & {
	// eslint-disable-next-line react/no-unused-prop-types
	readonly 'aria-label'?: RACDialogProps['aria-label'];
	// eslint-disable-next-line react/no-unused-prop-types
	readonly 'aria-labelledby'?: RACDialogProps['aria-labelledby'];
	readonly children?: RACDialogProps['children'];
	// eslint-disable-next-line react/no-unused-prop-types
	readonly role?: RACDialogProps['role'];
};

function DrawerPrimitive(props: DrawerPrimitiveProps) {
	const { isOpen } = useDrawerContext();

	const height = window.innerHeight - drawerMargin;
	const y = useMotionValue(height);
	const bodyBorderRadius = useTransform(y, [0, height], [drawerRadius, 0]);

	return (
		<motion.div
			style={{
				borderRadius: bodyBorderRadius,
				transformOrigin: 'center 0',
			}}
		>
			<AnimatePresence>{isOpen && (props.children as ReactNode)}</AnimatePresence>
		</motion.div>
	);
}

export function DrawerTrigger(props: ButtonProps) {
	const { openDrawer } = useDrawerContext();

	return <DialogTrigger onPress={openDrawer} {...props} />;
}

export type DrawerProps = {
	readonly children: ReactNode;
	readonly isOpen?: boolean;
	onOpenChange?(isOpen: boolean): void;
	readonly withNotch?: boolean;
};

export function Drawer({ children, withNotch = true, isOpen: controlledIsOpen, onOpenChange }: DrawerProps) {
	const [internalIsOpen, setInternalIsOpen] = useState(false);

	const isControlled = controlledIsOpen !== undefined;
	const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

	const openDrawer = () => {
		if (isControlled && onOpenChange) {
			onOpenChange(true);
		} else {
			setInternalIsOpen(true);
		}
	};

	const closeDrawer = () => {
		if (isControlled && onOpenChange) {
			onOpenChange(false);
		} else {
			setInternalIsOpen(false);
		}
	};

	if (typeof window === 'undefined') {
		return null;
	}

	return (
		// eslint-disable-next-line react/jsx-no-constructed-context-values
		<DrawerContext.Provider value={{ isOpen, openDrawer, closeDrawer, withNotch }}>{children}</DrawerContext.Provider>
	);
}

export type DrawerContentProps = ComponentProps<typeof DrawerPrimitive>;

export function DrawerContent({ children, ...props }: DrawerContentProps) {
	return (
		<DrawerPrimitive>
			<DrawerContentPrimitive {...props}>
				<Dialog
					aria-label={props['aria-label'] ?? undefined!}
					aria-labelledby={props['aria-labelledby'] ?? undefined!}
					className="mx-auto sm:max-w-lg"
					role={props.role ?? 'dialog'}
				>
					{(values) => <>{typeof children === 'function' ? children(values) : children}</>}
				</Dialog>
			</DrawerContentPrimitive>
		</DrawerPrimitive>
	);
}

export function DrawerHeader(props: ComponentProps<typeof DialogHeader>) {
	return <DialogHeader {...props} className={cx('pt-2', props.className)} />;
}

export function DrawerBody(props: ComponentProps<typeof DialogBody>) {
	return (
		<DialogBody {...props} className={cx('gap-0 px-4', props.className)}>
			{props.children}
		</DialogBody>
	);
}

export function DrawerFooter(props: ComponentProps<typeof DialogFooter>) {
	return (
		<DialogFooter {...props} className={cx('pb-2', props.className)}>
			{props.children}
		</DialogFooter>
	);
}

export {
	DialogClose as DrawerClose,
	DialogDescription as DrawerDescription,
	DialogTitle as DrawerTitle,
} from '@/components/ui/Dialog';
