import { ScrollTextIcon } from 'lucide-react';
import type { Metadata } from 'next';
import type { PropsWithChildren } from 'react';
import { ContentRouteDocumentFrame } from '@/components/content-route/frame/ContentRouteDocumentFrame';

export const metadata: Metadata = {
	title: 'Terms of use',
	description: 'Read the terms of use for DataTagger.',
};

export default async function Layout({ children }: PropsWithChildren) {
	return (
		<ContentRouteDocumentFrame
			guestTopBarLabel={
				<span className="place-items-end text-base-neutral-300 dark:text-base-neutral-600">Terms of use</span>
			}
			heroGapClassName="gap-2.5"
			heroIcon={
				<ScrollTextIcon
					aria-hidden
					className="text-base-neutral-40 dark:text-base-neutral-900"
					size={48}
					strokeWidth={1.5}
				/>
			}
			heroTitle={<h1 className="text-base-heading-xl text-base-neutral-40 dark:text-base-neutral-900">Terms of use</h1>}
		>
			{children}
		</ContentRouteDocumentFrame>
	);
}
