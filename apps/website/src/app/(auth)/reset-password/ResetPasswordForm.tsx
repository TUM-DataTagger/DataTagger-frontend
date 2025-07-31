'use client';

import { valibotResolver } from '@hookform/resolvers/valibot';
import { useMutation } from '@tanstack/react-query';
import { AlertCircleIcon, Loader2Icon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { ComponentProps } from 'react';
import { Controller, useForm } from 'react-hook-form';
import type { InferInput } from 'valibot';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
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

	return (
		<form {...props} className="flex flex-col gap-6" onSubmit={handleSubmit((input) => mutate(input))}>
			{errors.root ? (
				<Alert>
					<AlertCircleIcon aria-hidden size={24} strokeWidth={1.5} />
					{errors.root?.message}
				</Alert>
			) : null}

			<Controller
				control={control}
				name="password"
				render={({ field, fieldState }) => (
					<TextField
						autoComplete="new-password"
						errorMessage={fieldState.error?.message}
						isClearable
						isDisabled={field.disabled ?? false}
						isInvalid={fieldState.invalid}
						isRevealable
						label="New password"
						onBlur={field.onBlur}
						onChange={field.onChange}
						placeholder="Enter your new password"
						type="password"
						value={field.value ?? ''}
					/>
				)}
			/>

			<Button type="submit" variant="secondary-filled">
				{isPending ? <Loader2Icon aria-hidden className="mr-2 animate-spin" size={18} strokeWidth={1.5} /> : null}
				Confirm
			</Button>
		</form>
	);
}
