'use client';

import type { VariantProps } from 'cva';
import type {
	DialogProps as RACDialogProps,
	DialogTriggerProps as RACDialogTriggerProps,
	ModalOverlayProps as RACModalOverlayProps,
} from 'react-aria-components';
import {
	DialogTrigger as RACDialogTrigger,
	ModalOverlay as RACModalOverlay,
	Modal as RACModal,
	composeRenderProps,
} from 'react-aria-components';
import { Dialog, DialogCloseIndicator } from '@/components/ui/Dialog';
import { cva } from '@/styles/cva';

export function Modal(props: RACDialogTriggerProps) {
	return <RACDialogTrigger {...props} />;
}

const modalOverlayStyles = cva({
	base: 'bg-base-neutral-900/72 fixed top-0 left-0 isolate z-50 flex h-(--visual-viewport-height) w-dvw place-content-end place-items-end p-4 text-center [--visual-viewport-vertical-padding:16px] sm:place-content-center sm:place-items-center sm:[--visual-viewport-vertical-padding:32px]',
	variants: {
		isBlurred: {
			true: 'supports-backdrop-filter:backdrop-blur-xs',
		},
		isEntering: {
			true: 'fade-in animate-in duration-300 ease-out',
		},
		isExiting: {
			true: 'fade-out animate-out duration-200 ease-in',
		},
	},
});

const modalContentStyles = cva({
	base: 'bg-base-neutral-0 shadow-base-xl dark:bg-base-neutral-800 max-h-full w-full overflow-auto rounded-lg text-left align-middle',
	variants: {
		isEntering: {
			true: 'fade-in slide-in-from-bottom animate-in sm:zoom-in-95 sm:slide-in-from-bottom-0 duration-200 ease-out',
		},
		size: {
			xs: 'sm:max-w-xs',
			sm: 'sm:max-w-sm',
			md: 'sm:max-w-md',
			lg: 'sm:max-w-lg',
			xl: 'sm:max-w-xl',
			'2xl': 'sm:max-w-2xl',
			'3xl': 'sm:max-w-3xl',
			'4xl': 'sm:max-w-4xl',
			'5xl': 'sm:max-w-5xl',
		},
	},
	defaultVariants: {
		size: 'lg',
	},
});

type ModalContentProps = Omit<RACModalOverlayProps, 'children' | 'className'> &
	Pick<RACDialogProps, 'aria-label' | 'aria-labelledby' | 'children' | 'role'> &
	VariantProps<typeof modalContentStyles> & {
		readonly classNames?: {
			readonly content?: RACModalOverlayProps['className'];
			readonly overlay?: RACModalOverlayProps['className'];
		};
		readonly closeButton?: boolean;
		readonly isBlurred?: boolean;
	};

export function ModalContent({
	isDismissable: isDismissableInternal,
	isBlurred = false,
	role = 'dialog',
	closeButton = true,
	...props
}: ModalContentProps) {
	const isDismissable = isDismissableInternal ?? role !== 'alertdialog';

	return (
		<RACModalOverlay
			{...props}
			className={composeRenderProps(props.classNames?.overlay, (className, renderProps) =>
				modalOverlayStyles({
					...renderProps,
					isBlurred,
					className,
				}),
			)}
			isDismissable={isDismissable}
		>
			<RACModal
				{...props}
				className={composeRenderProps(props.classNames?.content, (className, renderProps) =>
					modalContentStyles({
						...renderProps,
						size: props.size,
						className,
					}),
				)}
				isDismissable={isDismissable}
			>
				<Dialog aria-label={props['aria-label'] ?? 'Dialog'} role={role}>
					{(values) => (
						<>
							{typeof props.children === 'function' ? props.children(values) : props.children}
							{closeButton && <DialogCloseIndicator isDismissable={isDismissable} />}
						</>
					)}
				</Dialog>
			</RACModal>
		</RACModalOverlay>
	);
}

export {
	DialogBody as ModalBody,
	DialogClose as ModalClose,
	DialogDescription as ModalDescription,
	DialogFooter as ModalFooter,
	DialogHeader as ModalHeader,
	DialogTitle as ModalTitle,
	DialogTrigger as ModalTrigger,
} from '@/components/ui/Dialog';
