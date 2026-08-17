'use client';

import { valibotResolver } from '@hookform/resolvers/valibot';
import { useMutation } from '@tanstack/react-query';
import { AlertCircleIcon, EyeIcon, EyeOffIcon, Loader2Icon, XCircleIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { type ComponentProps, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import type { InferInput } from 'valibot';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { FieldError, Label } from '@/components/ui/Field';
import { Input, InputGroup } from '@/components/ui/Input';
import { TextField } from '@/components/ui/TextField';
import { ResetPasswordSchema } from '@/schemas/ResetPasswordSchema';
import { openAPIClient } from '@/util/clientFetch';
import { formatErrorMessage } from '@/util/formatErrorMessage';

type ResetPasswordInput = InferInput<typeof ResetPasswordSchema>;

export function ResetPasswordForm({ code, ...props }: ComponentProps<'form'> & { readonly code: string }) {
	const router = useRouter();

	const {
		control,
		handleSubmit,
		setError,
		formState: { errors },
	} = useForm<ResetPasswordInput>({
		mode: 'onBlur',
		resolver: valibotResolver(ResetPasswordSchema),
	});

	const { mutate, isPending } = useMutation({
		mutationFn: async (input: ResetPasswordInput) => {
			const { error: resetPasswordError, response: resetPasswordResponse } = await openAPIClient.POST(
				'/api/v1/reset-password/confirm/',
				{
					body: { token: code, password: input.password },
				},
			);

			if (resetPasswordError) {
				throw new Error(formatErrorMessage(resetPasswordError, resetPasswordResponse));
			}
		},
		onSuccess() {
			router.push('/login');
		},
		onError(error) {
			setError('root', {
				type: 'custom',
				message: error.message,
			});
		},
	});

	const [isPasswordVisible, setIsPasswordVisible] = useState(false);

	return (
		<form {...props} className="flex flex-col gap-6" onSubmit={handleSubmit((input) => mutate(input))}>
			{errors.root ? (
				<Alert>
					<AlertCircleIcon aria-hidden className="shrink-0" size={24} strokeWidth={1.5} />
					{errors.root?.message}
				</Alert>
			) : null}

			<Controller
				control={control}
				name="password"
				render={({ field, fieldState }) => (
					<TextField isDisabled={field.disabled ?? false} isInvalid={fieldState.invalid}>
						<Label>New password</Label>
						<InputGroup className="[--input-gutter-end:--spacing(20)]">
							<Input
								autoComplete="new-password"
								onBlur={field.onBlur}
								onChange={field.onChange}
								placeholder="Enter your new password"
								type={isPasswordVisible ? 'text' : 'password'}
								value={field.value ?? ''}
							/>
							{field.value && !field.disabled && (
								<Button
									aria-label="Clear password"
									className="right-10.5"
									onPress={() => field.onChange('')}
									size="icon"
									variant="unset"
								>
									<XCircleIcon aria-hidden className="size-6 shrink-0 stroke-[1.5]" />
								</Button>
							)}
							<Button
								aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
								aria-pressed={isPasswordVisible}
								onPress={() => setIsPasswordVisible((value) => !value)}
								size="icon"
								variant="unset"
							>
								{isPasswordVisible ? (
									<EyeIcon aria-hidden className="size-6 shrink-0 stroke-[1.5]" />
								) : (
									<EyeOffIcon aria-hidden className="size-6 shrink-0 stroke-[1.5]" />
								)}
							</Button>
						</InputGroup>
						{fieldState.error?.message && <FieldError>{fieldState.error.message}</FieldError>}
					</TextField>
				)}
			/>

			<Button isDisabled={isPending} type="submit" variant="secondary-filled">
				{isPending ? <Loader2Icon aria-hidden className="animate-spin" size={18} strokeWidth={1.5} /> : null}
				Confirm
			</Button>
		</form>
	);
}
