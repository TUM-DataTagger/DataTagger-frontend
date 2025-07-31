import type { Metadata } from 'next';
import Link from 'next/link';
import { RecoverPasswordForm } from './RecoverPasswordForm';

export const metadata: Metadata = {
	title: 'Recover Password',
	description: 'Recover the password to your account',
};

export default async function Page() {
	return (
		<div className="mx-auto flex w-full max-w-xl grow flex-col gap-4 px-4 pt-48 pb-4">
			<div className="mb-8 flex flex-col gap-2">
				<h1 className="text-base-heading-xl">Reset your password</h1>
			</div>
			<RecoverPasswordForm />
			<p className="text-base-sm">
				<Link className="text-base-lavender-500" href="/login">
					Return to Login.
				</Link>
			</p>
		</div>
	);
}
