import type { Metadata } from 'next';
import Link from 'next/link';
import { buttonStyles } from '@/styles/ui/button';
import { Email } from '../Email';
import { ResendEmail } from './ResendEmail';

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
			<p className="text-base-xl">
				Please check your email <Email className="font-medium" /> for instructions.
			</p>
			<p className="text-base-md">
				Didn't receive an email? Check your spam folder or <ResendEmail>send email again</ResendEmail>.
			</p>
			<Link className={buttonStyles()} href="/login">
				Return to Login
			</Link>
		</div>
	);
}
