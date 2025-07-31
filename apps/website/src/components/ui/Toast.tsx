'use client';

import { useToast, useToastRegion } from '@react-aria/toast';
import type { AriaToastProps, AriaToastRegionProps } from '@react-aria/toast';
import type { ToastState } from '@react-stately/toast';
import { ToastQueue, useToastQueue } from '@react-stately/toast';
import { AlertCircleIcon, CheckCircleIcon } from 'lucide-react';
import { useRef } from 'react';

export const enum ToastType {
	Success,
	Error,
	TextOnly,
}

export type IToast = {
	message: string;
	type: ToastType;
};

function getToastTypeIcon(type: ToastType) {
	switch (type) {
		case ToastType.Success:
			return <CheckCircleIcon aria-hidden className="text-base-green-lime-400 shrink-0" size={24} strokeWidth={1.5} />;
		case ToastType.Error:
			return <AlertCircleIcon aria-hidden className="text-base-sunset-400 shrink-0" size={24} strokeWidth={1.5} />;
		case ToastType.TextOnly:
			return null;
		default:
			return null;
	}
}

type ToastProps = AriaToastProps<IToast> & { readonly state: ToastState<IToast> };

export const Toast = <Type extends ToastProps>(props: Type) => {
	const { state, toast } = props;
	const ref = useRef(null);
	const { toastProps, titleProps } = useToast(props, state, ref);

	return (
		<div
			{...toastProps}
			className="text-base-md text-base-neutral-40 data-[animation=entering]:animate-in data-[animation=exiting]:animate-out data-[animation=entering]:fade-in data-[animation=exiting]:fade-out data-[animation=entering]:slide-in-from-bottom-1 data-[animation=exiting]:slide-out-to-bottom-1 dark:text-base-neutral-900 bg-base-neutral-900 dark:bg-base-neutral-40 flex w-lg place-items-center gap-3 rounded-sm p-4 data-[animation=entering]:duration-200 data-[animation=entering]:ease-out data-[animation=exiting]:duration-150 data-[animation=exiting]:ease-in"
			ref={ref}
		>
			{getToastTypeIcon(toast.content.type)}
			<div {...titleProps}>{toast.content.message}</div>
		</div>
	);
};

type ToastRegionProps = AriaToastRegionProps & { readonly state: ToastState<IToast> };

export const ToastRegion = <Type extends ToastRegionProps>(props: Type) => {
	const { state } = props;
	const ref = useRef(null);

	const { regionProps } = useToastRegion(props, state, ref);

	return (
		<div {...regionProps} className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2" ref={ref}>
			{state.visibleToasts.map((toast) => (
				<Toast key={toast.key} state={state} toast={toast} />
			))}
		</div>
	);
};

export const globalToastQueue = new ToastQueue<IToast>({
	maxVisibleToasts: 1,
});

export const GlobalToastRegion = () => {
	const state = useToastQueue(globalToastQueue);

	return state.visibleToasts.length ? <ToastRegion state={state} /> : null;
};
