'use client';

import { HomeIcon } from 'lucide-react';
import Link from 'next/link';
import { TestEnvironmentBannerNoSSR } from '@/components/TestEnvironmentBanner';
import { NotFoundIcon } from '@/components/icons/NotFoundIcon';
import { jetBrainsMono, roboto } from '@/styles/fonts';
import { buttonStyles } from '@/styles/ui/button';
import { logger, LogCategory } from '@/util/logger';
import { Navigation } from './Navigation';

export default function GlobalError({ error }: { readonly error: Error & { digest?: string } }) {
	logger.error(LogCategory.Error, 'Unhandled error', { digest: error.digest, message: error.message });

	return (
		<html className={`${roboto.variable} ${jetBrainsMono.variable} antialiased`} lang="en-US" suppressHydrationWarning>
			<body className="overscroll-y-none bg-base-neutral-0 text-base-md text-base-neutral-900 dark:bg-base-neutral-800 dark:text-base-neutral-40">
				<div className="mx-auto flex min-h-dvh">
					<div className="flex grow flex-col">
						<div className="sticky top-0 z-20 bg-base-neutral-0 dark:bg-base-neutral-800">
							<TestEnvironmentBannerNoSSR />
							<Navigation notFound />
						</div>
						<div className="grow bg-base-neutral-60 dark:bg-base-neutral-700">
							<div className="mx-auto flex max-w-[820px] flex-col place-items-center gap-4 px-4 pt-44">
								<NotFoundIcon />
								<div className="flex flex-col gap-8">
									<div className="flex flex-col gap-2">
										<h1 className="text-center text-base-lg md:text-base-heading-xs">Error 500: Global error</h1>
										<p className="text-center text-base-md md:text-base-lg">
											This page is not available. Check the URL or navigate to another page.
										</p>
									</div>
									<Link className={buttonStyles({ variant: 'filled', className: 'place-self-center' })} href="/drafts">
										<HomeIcon aria-hidden size={18} strokeWidth={1.5} /> Home
									</Link>
								</div>
							</div>
						</div>
					</div>
				</div>
			</body>
		</html>
	);
}
