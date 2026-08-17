import { MessageCircleQuestionIcon } from 'lucide-react';
import type { Metadata } from 'next';
import type { PropsWithChildren } from 'react';
import { ContentRouteDocumentFrame } from '@/components/content-route/frame/ContentRouteDocumentFrame';

export const metadata: Metadata = {
	title: 'Frequently Asked Questions',
	description: 'Answers to common questions about using DataTagger.',
};

export default async function Layout({ children }: PropsWithChildren) {
	return (
		<ContentRouteDocumentFrame
			guestTopBarLabel={
				<>
					<span className="hidden place-items-end text-base-neutral-300 sm:inline dark:text-base-neutral-600">
						Frequently asked questions (FAQ)
					</span>
					<span className="place-items-end text-base-neutral-300 sm:hidden dark:text-base-neutral-600">FAQ</span>
				</>
			}
			heroGapClassName="gap-2.5"
			heroIcon={
				<MessageCircleQuestionIcon
					aria-hidden
					className="text-base-neutral-40 dark:text-base-neutral-900"
					size={48}
					strokeWidth={1.5}
				/>
			}
			heroTitle={
				<>
					<h1 className="text-base-heading-xl text-base-neutral-40 lg:hidden dark:text-base-neutral-900">FAQ</h1>
					<h1 className="hidden text-base-heading-xl text-base-neutral-40 lg:block dark:text-base-neutral-900">
						Frequently asked questions (FAQ)
					</h1>
				</>
			}
			proseClassName="prose-h3:text-base-heading-xs md:prose-h3:text-base-heading-xs prose-h4:text-base-heading-xs md:prose-h4:text-base-heading-xs"
		>
			{children}
		</ContentRouteDocumentFrame>
	);
}
