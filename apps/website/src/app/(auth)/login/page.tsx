// import { LockIcon } from 'lucide-react';
import type { Metadata } from 'next';
// import { Separator } from '@/components/ui/Separator';
import Link from 'next/link';
import { Suspense } from 'react';
import { withSafeRedirectQuery } from '@/util/authRedirect';
import { redirectAuthenticatedUserFromAuthRoute } from '@/util/serverAuth';
import { LoginButton } from './LoginButton';

export const metadata: Metadata = {
	title: 'Login',
	description: 'Login to your account',
};

export default async function Page({ searchParams }: { readonly searchParams: Promise<{ readonly next?: string }> }) {
	await redirectAuthenticatedUserFromAuthRoute();

	const { next } = await searchParams;
	const externalLoginHref = withSafeRedirectQuery('/external-login', next);

	return (
		<div className="mx-auto flex w-full max-w-xl grow flex-col place-content-center gap-4 p-4">
			<div className="mb-10 flex flex-col gap-2">
				<h1 className="text-base-heading-xl">Login</h1>
			</div>
			<div className="mb-2 flex flex-col gap-8">
				<Suspense>
					<LoginButton />
				</Suspense>
				{/* <Separator />
				<div className="flex flex-col gap-6">
					<p className="text-base-xl">Login for users without TUM affiliation</p>
					<Button className="flex gap-2">
						<LockIcon aria-hidden size={18} strokeWidth={1.5} /> Continue via Shibboleth
					</Button>
				</div> */}
			</div>
			<p className="text-base-sm">
				External user?{' '}
				<Link className="text-base-lavender-500" href={externalLoginHref}>
					Login here.
				</Link>
			</p>
		</div>
	);
}
