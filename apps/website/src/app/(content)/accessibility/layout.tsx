import { ArrowLeftIcon, HeartHandshakeIcon } from 'lucide-react';
import Link from 'next/link';
import type { PropsWithChildren } from 'react';
import { TestEnvironmentBannerNoSSR } from '@/components/TestEnvironmentBanner';
import { Separator } from '@/components/ui/Separator';
import { buttonStyles } from '@/styles/ui/button';
import { openAPIClient } from '@/util/fetch';

export default async function Layout({ children }: PropsWithChildren) {
	const { data: currentUserData } = await openAPIClient.GET('/api/v1/user/me/');

	return (
		<>
			{currentUserData ? null : (
				<>
					<TestEnvironmentBannerNoSSR />
					<div className="bg-base-neutral-800 dark:bg-base-neutral-100 flex h-16 place-items-center justify-between px-4 md:px-[132px]">
						<Link
							className={buttonStyles({
								variant: 'unset',
								className: 'text-base-neutral-40 dark:text-base-neutral-900 no-underline',
							})}
							href="/login"
						>
							<ArrowLeftIcon aria-hidden size={24} strokeWidth={1.5} />
							Back
						</Link>
						<span className="text-base-neutral-300 dark:text-base-neutral-600 place-items-end">Accessibility</span>
					</div>
					<Separator className="border-base-neutral-700 m-0" />
				</>
			)}
			<div>
				<div className="bg-base-neutral-800 dark:bg-base-neutral-100 h-[194px] px-4">
					<div className="mx-auto flex h-full max-w-(--breakpoint-md) place-items-center gap-[10px]">
						<HeartHandshakeIcon
							aria-hidden
							className="text-base-neutral-40 dark:text-base-neutral-900"
							size={48}
							strokeWidth={1.5}
						/>
						<h1 className="text-base-heading-xl text-base-neutral-40 dark:text-base-neutral-900">Accessibility</h1>
					</div>
				</div>
				<div className="prose prose-sm prose-neutral dark:prose-invert prose-h1:text-base-xl prose-h2:text-base-xl md:prose-h1:text-base-heading-xs md:prose-h2:text-base-heading-xs mx-auto max-w-sm px-4 py-9 break-words md:max-w-(--breakpoint-md)">
					{children}
				</div>
			</div>
		</>
	);
}
