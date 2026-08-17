'use client';

import { valibotResolver } from '@hookform/resolvers/valibot';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircleIcon, EyeIcon, EyeOffIcon, Loader2Icon, XCircleIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { parseAsString, useQueryState } from 'nuqs';
import { useState, /* useTransition, */ type ComponentProps } from 'react';
import { Controller, useForm } from 'react-hook-form';
import type { InferInput } from 'valibot';
// import { login } from '@/actions/login';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { FieldError, Label } from '@/components/ui/Field';
import { Input, InputGroup } from '@/components/ui/Input';
import { TextField } from '@/components/ui/TextField';
import { LoginSchema } from '@/schemas/LoginSchema';
import { login } from '@/server/actions/auth';
// import { initialState, isSuccess } from '@/util/actions';
import { $api } from '@/util/clientFetch';
import { logger, LogCategory } from '@/util/logger';

type LoginInput = InferInput<typeof LoginSchema>;

export function LoginForm(props: ComponentProps<'form'>) {
	const [nextTarget] = useQueryState('next', parseAsString);
	const router = useRouter();
	// const [isPending, startTransition] = useTransition();
	const queryClient = useQueryClient();
	const [isPasswordVisible, setIsPasswordVisible] = useState(false);

	const {
		control,
		handleSubmit,
		setError,
		formState: { errors },
	} = useForm<LoginInput>({
		mode: 'onBlur',
		resolver: valibotResolver(LoginSchema),
	});

	const { mutate, isPending } = useMutation({
		mutationFn: async (input: LoginInput) => {
			const [error, data] = await login({
				email: input.email,
				password: input.password,
				next: nextTarget,
			});

			if (error) {
				throw Object.assign(new Error(error.message), { code: error.code, data: error.data });
			}

			if (!data) {
				throw new Error('Login failed. Please try again.');
			}

			return data;
		},
		async onSuccess(result) {
			await queryClient.invalidateQueries({ queryKey: $api.queryOptions('get', '/api/v1/user/me/').queryKey });
			await queryClient.invalidateQueries({ queryKey: $api.queryOptions('post', '/api/v1/authjwtcookie/').queryKey });

			logger.info(LogCategory.Auth, 'External login successful');
			router.replace(result.redirectTo);
			router.refresh();
		},
		onError(error) {
			const detail = error as Error & { code?: string; data?: unknown };
			console.error('[Auth] External login failed', {
				message: error.message,
				code: detail.code,
				data: detail.data,
			});
			const errorMessage = error instanceof Error ? error.message : 'Login failed. Please try again.';
			setError('root', {
				type: 'custom',
				message: errorMessage,
			});
		},
	});

	// async function onSubmit(input: LoginInput) {
	// 	startTransition(async () => {
	// 		const formData = new FormData();
	// 		formData.set('username', input.username);
	// 		formData.set('password', input.password);
	// 		const result = await login(initialState, formData);
	// 		if (isSuccess(result)) {
	// 			setToken(result.data!);
	// 			router.push('/');
	// 		} else {
	// 			setError('root', {
	// 				type: 'custom',
	// 				message: result.errors?.root ?? '',
	// 			});
	// 		}
	// 	});
	// }

	return (
		<form {...props} className="flex flex-col gap-6" onSubmit={handleSubmit((input) => mutate(input))} ref={props.ref}>
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
			<Controller
				control={control}
				name="password"
				render={({ field, fieldState }) => (
					<TextField isDisabled={field.disabled ?? false} isInvalid={fieldState.invalid}>
						<Label>Password</Label>
						<InputGroup className="[--input-gutter-end:--spacing(20)]">
							<Input
								autoComplete="current-password"
								onBlur={field.onBlur}
								onChange={field.onChange}
								placeholder="Enter your password"
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
				Login
			</Button>
		</form>
	);
}
