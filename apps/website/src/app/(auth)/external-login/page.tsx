import type { Metadata } from 'next';
import Link from 'next/link';
import { LoginForm } from './LoginForm';

export const metadata: Metadata = {
	title: 'External Login',
	description: 'Login to your account',
};

export default async function Page() {
	return (
		<div className="mx-auto flex w-full max-w-xl grow flex-col place-content-center gap-4 p-4">
			<div className="mb-10 flex flex-col gap-2">
				<h1 className="text-base-heading-xl">Login</h1>
			</div>
			<LoginForm />
			<p className="text-base-sm">
				Forgot your password?{' '}
				<Link className="text-base-lavender-500" href="/recover-password">
					Reset it.
				</Link>
			</p>
		</div>
	);
}
