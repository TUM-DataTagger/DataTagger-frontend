'use client';

import { AlertCircleIcon, XCircleIcon } from 'lucide-react';
import type { ComponentProps } from 'react';
import {
	Controller,
	type Control,
	type FieldErrors,
	type FieldValues,
	type Path,
	type UseFormHandleSubmit,
} from 'react-hook-form';
import { Editor } from '@/components/editor/Editor';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { FieldError, Label } from '@/components/ui/Field';
import { Input, InputGroup } from '@/components/ui/Input';
import { TextField } from '@/components/ui/TextField';

type EntityDetailsEditValues = FieldValues & {
	readonly description?: unknown;
	readonly name?: string;
};

type EntityDetailsEditFormProps<Type extends EntityDetailsEditValues> = Omit<
	ComponentProps<'form'>,
	'id' | 'onSubmit'
> & {
	readonly control: Control<Type>;
	readonly descriptionInputId: string;
	readonly descriptionPlaceholder: string;
	readonly errors: FieldErrors<Type>;
	readonly formId: string;
	readonly handleSubmit: UseFormHandleSubmit<Type>;
	readonly nameLabel: string;
	readonly namePlaceholder: string;
	onSubmit(values: Type): void;
};

export function EntityDetailsEditForm<Type extends EntityDetailsEditValues>({
	control,
	descriptionInputId,
	descriptionPlaceholder,
	errors,
	formId,
	handleSubmit,
	nameLabel,
	namePlaceholder,
	onSubmit,
	...props
}: EntityDetailsEditFormProps<Type>) {
	const rootMessage = typeof errors.root?.message === 'string' ? errors.root.message : undefined;

	return (
		<form {...props} id={formId} onSubmit={handleSubmit(onSubmit)} ref={props.ref}>
			<div className="flex flex-col gap-8">
				{rootMessage ? (
					<Alert>
						<AlertCircleIcon aria-hidden className="shrink-0" size={24} strokeWidth={1.5} />
						{rootMessage}
					</Alert>
				) : null}

				<div className="flex flex-col gap-4">
					<h1 className="text-base-xl">Basic information</h1>

					<div className="grid gap-6">
						<div className="grid gap-2">
							<Controller
								control={control}
								name={'name' as Path<Type>}
								render={({ field, fieldState }) => (
									<TextField
										autoComplete="off"
										isDisabled={field.disabled ?? false}
										isInvalid={fieldState.invalid}
										onBlur={field.onBlur}
										onChange={field.onChange}
										value={(field.value as string | undefined) ?? ''}
									>
										<Label>{nameLabel}</Label>
										<InputGroup>
											<Input placeholder={namePlaceholder} />
											{field.value && !field.disabled && (
												<Button
													aria-label={`Clear ${nameLabel.toLowerCase()}`}
													onPress={() => field.onChange('')}
													size="icon"
													variant="unset"
												>
													<XCircleIcon aria-hidden className="size-6 shrink-0 stroke-[1.5]" />
												</Button>
											)}
										</InputGroup>
										{fieldState.error?.message ? <FieldError>{fieldState.error.message}</FieldError> : null}
									</TextField>
								)}
							/>
						</div>

						<div className="grid gap-2">
							<Label htmlFor={descriptionInputId}>Description (optional)</Label>
							<Controller
								control={control}
								name={'description' as Path<Type>}
								render={({ field, fieldState }) => (
									<Editor
										aria-invalid={fieldState.invalid}
										autoComplete="off"
										content={field.value ?? ''}
										disabled={field.disabled ?? false}
										editable
										id={descriptionInputId}
										onBlur={field.onBlur}
										onChange={field.onChange}
										placeholder={descriptionPlaceholder}
										ref={field.ref}
									/>
								)}
							/>
						</div>
					</div>
				</div>
			</div>
		</form>
	);
}
