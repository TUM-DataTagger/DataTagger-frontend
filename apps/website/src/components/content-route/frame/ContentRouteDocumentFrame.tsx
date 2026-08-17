import { ArrowLeftIcon } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { TestEnvironmentBannerNoSSR } from '@/components/TestEnvironmentBanner';
import { Separator } from '@/components/ui/Separator';
import { cx } from '@/styles/cva';
import { buttonStyles } from '@/styles/ui/button';
import { openAPIClient } from '@/util/fetch';

type ContentRouteDocumentFrameProps = {
	readonly children: ReactNode;
	readonly contentContainerClassName?: string;
	readonly guestBackHref?: string;
	readonly guestTopBarLabel: ReactNode;
	readonly heroGapClassName?: string;
	readonly heroIcon: ReactNode;
	readonly heroTitle: ReactNode;
	readonly proseClassName?: string;
};

export async function ContentRouteDocumentFrame({
	children,
	contentContainerClassName,
	guestBackHref = '/login',
	guestTopBarLabel,
	heroGapClassName = 'gap-[10px]',
	heroIcon,
	heroTitle,
	proseClassName,
}: ContentRouteDocumentFrameProps) {
	const { data: currentUserData } = await openAPIClient.GET('/api/v1/user/me/');

	return (
		<>
			{currentUserData ? null : (
				<>
					<TestEnvironmentBannerNoSSR />
					<div className="flex h-16 place-items-center justify-between bg-base-neutral-800 px-4 md:px-[132px] dark:bg-base-neutral-100">
						<Link
							className={buttonStyles({
								variant: 'unset',
								className: 'text-base-neutral-40 dark:text-base-neutral-900 no-underline',
							})}
							href={guestBackHref}
						>
							<ArrowLeftIcon aria-hidden size={24} strokeWidth={1.5} />
							Back
						</Link>
						{guestTopBarLabel}
					</div>
					<Separator className="m-0 border-base-neutral-700" />
				</>
			)}
			<div className={contentContainerClassName}>
				<div className="h-[194px] bg-base-neutral-800 px-4 dark:bg-base-neutral-100">
					<div className={cx('mx-auto flex h-full max-w-(--breakpoint-md) place-items-center', heroGapClassName)}>
						{heroIcon}
						{heroTitle}
					</div>
				</div>
				<div
					className={cx(
						'mx-auto prose prose-sm max-w-sm px-4 py-9 wrap-break-word prose-neutral md:max-w-(--breakpoint-md) dark:prose-invert prose-h1:text-base-xl md:prose-h1:text-base-heading-xs prose-h2:text-base-xl md:prose-h2:text-base-heading-xs',
						proseClassName,
					)}
				>
					{children}
				</div>
			</div>
		</>
	);
}
