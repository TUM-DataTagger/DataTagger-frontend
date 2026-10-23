import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { withSafeRedirectQuery } from '@/util/authRedirect';
import { redirectAuthenticatedUserFromAuthRoute } from '@/util/serverAuth';
import { LoginForm } from '../external-login/LoginForm';

export const metadata: Metadata = {
	title: 'Login',
	description: 'Login to your account',
};

export default async function Page({ searchParams }: { readonly searchParams: Promise<{ readonly next?: string }> }) {
	await redirectAuthenticatedUserFromAuthRoute();

	const { next } = await searchParams;
	const recoverPasswordHref = withSafeRedirectQuery('/recover-password', next);

	return (
		<div className="mx-auto flex w-full max-w-xl grow flex-col place-content-center gap-4 p-4">
			<div className="mb-10 flex flex-col gap-2">
				<h1 className="text-base-heading-xl">Login</h1>
			</div>
			<Suspense>
				<LoginForm />
			</Suspense>
			<p className="text-base-sm">
				Forgot your password?{' '}
				<Link className="text-base-lavender-500" href={recoverPasswordHref}>
					Reset it.
				</Link>
			</p>
		</div>
	);
}
