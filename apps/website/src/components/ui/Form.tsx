'use client';

import { useId, type ComponentProps } from 'react';
import { Form as RACForm } from 'react-aria-components';

export type FormProps = ComponentProps<typeof RACForm>;

export function Form(props: FormProps) {
	return <RACForm {...props} />;
}

export function useDialogForm(prefix = 'dialog-form') {
	const id = `${prefix}-${useId().replaceAll(':', '')}`;

	return {
		id,
		formProps: { id },
		submitButtonProps: {
			form: id,
			type: 'submit' as const,
		},
	};
}
