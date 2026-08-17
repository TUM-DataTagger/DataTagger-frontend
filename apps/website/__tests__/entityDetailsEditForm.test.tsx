// @vitest-environment happy-dom

import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { forwardRef } from 'react';
import { useForm, type FieldErrors } from 'react-hook-form';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EntityDetailsEditForm } from '@/components/edit-route/EntityDetailsEditForm';

type TestValues = {
	readonly description: string;
	readonly name: string;
};

vi.mock('@/components/ui/Alert', () => ({
	Alert: ({ children }: { readonly children: ReactNode }) => <div role="alert">{children}</div>,
}));

vi.mock('@/components/ui/Button', () => ({
	Button: ({
		children,
		onPress,
		...props
	}: {
		readonly children: ReactNode;
		readonly onPress?: (() => void | Promise<void>) | undefined;
		readonly [key: string]: unknown;
	}) => {
		const buttonProps = props as Record<string, unknown>;
		const type = buttonProps.type;
		const commonProps = {
			...buttonProps,
			onClick: () => {
				void onPress?.();
			},
		};

		if (type === 'submit') {
			return (
				<button {...commonProps} type="submit">
					{children}
				</button>
			);
		}

		if (type === 'reset') {
			return (
				<button {...commonProps} type="reset">
					{children}
				</button>
			);
		}

		return (
			<button {...commonProps} type="button">
				{children}
			</button>
		);
	},
}));

vi.mock('@/components/ui/Field', () => ({
	FieldError: ({ children }: { readonly children: ReactNode }) => <div>{children}</div>,
	Label: ({ children, ...props }: { readonly children: ReactNode; readonly [key: string]: unknown }) => (
		<label {...(props as Record<string, unknown>)}>{children}</label>
	),
}));

vi.mock('@/components/ui/Input', () => ({
	Input: (props: Record<string, unknown>) => <input {...props} />,
	InputGroup: ({ children }: { readonly children: ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/ui/TextField', () => ({
	TextField: ({ children }: { readonly children: ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/editor/Editor', () => ({
	Editor: forwardRef<
		HTMLTextAreaElement,
		Omit<ComponentPropsWithoutRef<'textarea'>, 'onChange'> & {
			readonly content?: unknown;
			readonly editable?: boolean;
			onChange?(value: unknown): void;
		}
	>(({ content, editable: _editable, disabled, id, onBlur, onChange, placeholder, ...props }, ref) => (
		<textarea
			{...props}
			defaultValue={typeof content === 'string' ? content : ''}
			disabled={disabled}
			id={id}
			onBlur={onBlur}
			onChange={(event) => onChange?.(event.target.value)}
			placeholder={placeholder}
			ref={ref}
		/>
	)),
}));

function EntityDetailsHarness({
	onSubmit,
	rootErrorMessage,
}: {
	onSubmit(values: TestValues): void;
	readonly rootErrorMessage?: string;
}) {
	const {
		control,
		handleSubmit,
		formState: { errors },
	} = useForm<TestValues>({
		defaultValues: {
			name: 'Sample project',
			description: 'A short description',
		},
	});

	return (
		<EntityDetailsEditForm<TestValues>
			control={control}
			descriptionInputId="entity-description"
			descriptionPlaceholder="More about the entity ..."
			errors={
				rootErrorMessage ? ({ ...errors, root: { message: rootErrorMessage } } as FieldErrors<TestValues>) : errors
			}
			formId="entity-details-form"
			handleSubmit={handleSubmit}
			nameLabel="Project name"
			namePlaceholder="Name your project"
			onSubmit={onSubmit}
		/>
	);
}

describe('EntityDetailsEditForm', () => {
	afterEach(() => {
		cleanup();
	});

	it('renders configured labels, placeholders, ids, and root alert', () => {
		const onSubmit = vi.fn();
		const screen = render(<EntityDetailsHarness onSubmit={onSubmit} rootErrorMessage="Something went wrong" />);

		const form = screen.container.querySelector('form');
		expect(form?.getAttribute('id')).toBe('entity-details-form');

		expect(screen.getByText('Basic information')).toBeTruthy();
		expect(screen.getByText('Project name')).toBeTruthy();
		expect(screen.getByPlaceholderText('Name your project')).toBeTruthy();
		expect(screen.getByRole('button', { name: 'Clear project name' })).toBeTruthy();
		expect(screen.getByText('Description (optional)')).toBeTruthy();

		const editor = screen.getByPlaceholderText('More about the entity ...');
		expect(editor.getAttribute('id')).toBe('entity-description');

		expect(screen.getByRole('alert').textContent).toContain('Something went wrong');
	});

	it('submits configured form values through handleSubmit/onSubmit', async () => {
		const onSubmit = vi.fn();
		const screen = render(<EntityDetailsHarness onSubmit={onSubmit} />);

		const form = screen.container.querySelector('form');
		expect(form).toBeTruthy();
		fireEvent.submit(form as HTMLFormElement);

		await waitFor(() => {
			expect(onSubmit).toHaveBeenCalledTimes(1);
		});

		const firstCallArg = onSubmit.mock.calls[0]?.[0] as TestValues | undefined;
		expect(firstCallArg?.name).toBe('Sample project');
		expect(firstCallArg?.description).toBe('A short description');
	});
});
