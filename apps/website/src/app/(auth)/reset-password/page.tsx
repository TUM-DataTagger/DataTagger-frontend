import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { openAPIClient } from '@/util/fetch';
import { ResetPasswordForm } from './ResetPasswordForm';

export const metadata: Metadata = {
	title: 'Reset password',
	description: 'Reset the password to your account',
};

export default async function Page({
	searchParams,
}: {
	readonly searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
	const { token } = await searchParams;

	if (!token) {
		redirect('/recover-password');
	}

	const { data: resetPasswordData, error } = await openAPIClient.POST('/api/v1/reset-password/validate/', {
		body: { token },
	});

	if (error) {
		redirect('/recover-password');
	}

	return (
		<div className="mx-auto flex w-full max-w-xl grow flex-col gap-4 px-4 pt-48 pb-4">
			<div className="mb-8 flex flex-col gap-2">
				<h1 className="text-base-heading-xl">Password recovery</h1>
			</div>
			<p className="text-base-md">
				Enter a new password for <span className="font-medium">{resetPasswordData.email}</span>.
			</p>
			<ResetPasswordForm code={token} />
		</div>
	);
}
