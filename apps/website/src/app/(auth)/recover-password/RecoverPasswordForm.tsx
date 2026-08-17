'use client';

import { valibotResolver } from '@hookform/resolvers/valibot';
import { useMutation } from '@tanstack/react-query';
import { useSetAtom } from 'jotai';
import { AlertCircleIcon, Loader2Icon, XCircleIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { ComponentProps } from 'react';
import { Controller, useForm } from 'react-hook-form';
import type { InferInput } from 'valibot';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { FieldError, Label } from '@/components/ui/Field';
import { Input, InputGroup } from '@/components/ui/Input';
import { TextField } from '@/components/ui/TextField';
import { RecoverPasswordSchema } from '@/schemas/RecoverPasswordSchema';
import { openAPIClient } from '@/util/clientFetch';
import { formatErrorMessage } from '@/util/formatErrorMessage';
import { logger, LogCategory } from '@/util/logger';
import { emailAtom } from './Email';

type RecoverPasswordInput = InferInput<typeof RecoverPasswordSchema>;

export function RecoverPasswordForm(props: ComponentProps<'form'>) {
	const router = useRouter();
	const setEmail = useSetAtom(emailAtom);

	const {
		control,
		handleSubmit,
		setError,
		formState: { errors },
	} = useForm<RecoverPasswordInput>({
		mode: 'onBlur',
		resolver: valibotResolver(RecoverPasswordSchema),
	});

	const { mutate, isPending } = useMutation({
		mutationFn: async (input: RecoverPasswordInput) => {
			const { error: resetPasswordError, response: resetPasswordResponse } = await openAPIClient.POST(
				'/api/v1/reset-password/',
				{
					body: { email: input.email },
				},
			);

			if (resetPasswordError) {
				throw new Error(formatErrorMessage(resetPasswordError, resetPasswordResponse));
			}
		},
		onSuccess(_, variables) {
			logger.info(LogCategory.Auth, 'Password reset email sent');
			setEmail(variables.email);

			router.push('/recover-password/success');
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
					<AlertCircleIcon aria-hidden className="shrink-0" size={24} strokeWidth={1.5} />
					{errors.root?.message}
				</Alert>
			) : null}

			<Controller
				control={control}
				name="email"
				render={({ field, fieldState }) => (
					<TextField isDisabled={field.disabled ?? false} isInvalid={fieldState.invalid}>
						<Label>Email</Label>
						<InputGroup>
							<Input
								autoComplete="email"
								onBlur={field.onBlur}
								onChange={field.onChange}
								placeholder="Enter your email address"
								type="email"
								value={field.value ?? ''}
							/>
							{field.value && !field.disabled && (
								<Button aria-label="Clear email" onPress={() => field.onChange('')} size="icon" variant="unset">
									<XCircleIcon aria-hidden className="size-6 shrink-0 stroke-[1.5]" />
								</Button>
							)}
						</InputGroup>
						{fieldState.error?.message && <FieldError>{fieldState.error.message}</FieldError>}
					</TextField>
				)}
			/>

			<Button isDisabled={isPending} type="submit" variant="secondary-filled">
				{isPending ? <Loader2Icon aria-hidden className="animate-spin" size={18} strokeWidth={1.5} /> : null}
				Reset password
			</Button>
		</form>
	);
}
