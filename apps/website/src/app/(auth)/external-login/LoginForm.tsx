'use client';

import { valibotResolver } from '@hookform/resolvers/valibot';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircleIcon, Loader2Icon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { /* useTransition, */ type ComponentProps } from 'react';
import { Controller, useForm } from 'react-hook-form';
import type { InferInput } from 'valibot';
// import { login } from '@/actions/login';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { LoginSchema } from '@/schemas/LoginSchema';
// import { initialState, isSuccess } from '@/util/actions';
import { $api, openAPIClient } from '@/util/clientFetch';

type LoginInput = InferInput<typeof LoginSchema>;

export function LoginForm(props: ComponentProps<'form'>) {
	const router = useRouter();
	// const [isPending, startTransition] = useTransition();
	const queryClient = useQueryClient();

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
			const { response } = await openAPIClient.POST('/api/v1/auth/', {
				body: { email: input.email, password: input.password },
			});

			if (response.status === 400) {
				throw new Error('Invalid login credentials. Please check your entries.');
			}
		},
		async onSuccess() {
			await queryClient.invalidateQueries({ queryKey: $api.queryOptions('get', '/api/v1/user/me/').queryKey });
			await queryClient.invalidateQueries({ queryKey: $api.queryOptions('post', '/api/v1/authjwtcookie/').queryKey });

			router.push('/drafts');
		},
		onError(error) {
			setError('root', {
				type: 'custom',
				message: error.message,
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
		<form {...props} className="flex flex-col gap-6" onSubmit={handleSubmit((input) => mutate(input))}>
			{errors.root ? (
				<Alert>
					<AlertCircleIcon aria-hidden size={24} strokeWidth={1.5} />
					{errors.root?.message}
				</Alert>
			) : null}

			<Controller
				control={control}
				name="email"
				render={({ field, fieldState }) => (
					<TextField
						autoComplete="email"
						errorMessage={fieldState.error?.message}
						isClearable
						isDisabled={field.disabled ?? false}
						isInvalid={fieldState.invalid}
						label="Email"
						onBlur={field.onBlur}
						onChange={field.onChange}
						placeholder="Enter your email address"
						type="email"
						value={field.value ?? ''}
					/>
				)}
			/>
			<Controller
				control={control}
				name="password"
				render={({ field, fieldState }) => (
					<TextField
						autoComplete="current-password"
						errorMessage={fieldState.error?.message}
						isClearable
						isDisabled={field.disabled ?? false}
						isInvalid={fieldState.invalid}
						isRevealable
						label="Password"
						onBlur={field.onBlur}
						onChange={field.onChange}
						placeholder="Enter your password"
						type="password"
						value={field.value ?? ''}
					/>
				)}
			/>

			<Button isDisabled={isPending} type="submit" variant="secondary-filled">
				{isPending ? <Loader2Icon aria-hidden className="mr-2 animate-spin" size={18} strokeWidth={1.5} /> : null}
				Login
			</Button>
		</form>
	);
}
