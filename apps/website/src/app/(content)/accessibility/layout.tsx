import { HeartHandshakeIcon } from 'lucide-react';
import type { Metadata } from 'next';
import type { PropsWithChildren } from 'react';
import { ContentRouteDocumentFrame } from '@/components/content-route/frame/ContentRouteDocumentFrame';

export const metadata: Metadata = {
	title: 'Accessibility',
	description: 'Accessibility information and support for DataTagger.',
};

export default async function Layout({ children }: PropsWithChildren) {
	return (
		<ContentRouteDocumentFrame
			guestTopBarLabel={
				<span className="place-items-end text-base-neutral-300 dark:text-base-neutral-600">Accessibility</span>
			}
			heroIcon={
				<HeartHandshakeIcon
					aria-hidden
					className="text-base-neutral-40 dark:text-base-neutral-900"
					size={48}
					strokeWidth={1.5}
				/>
			}
			heroTitle={
				<h1 className="text-base-heading-xl text-base-neutral-40 dark:text-base-neutral-900">Accessibility</h1>
			}
		>
			{children}
		</ContentRouteDocumentFrame>
	);
}
