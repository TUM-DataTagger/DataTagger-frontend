import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { NotificationBanner } from '@/components/NotificationBanner';
import { SideSheetNoSSR } from '@/components/SideSheet';
import { TestEnvironmentBannerNoSSR } from '@/components/TestEnvironmentBanner';
import { SidebarInset } from '@/components/ui/Sidebar';
import { GlobalToastRegion } from '@/components/ui/Toast';
import { GlobalUploadAssistantNoSSR } from '@/components/upload-assistant/GlobalUploadAssistant';
import { ENV } from '@/util/env';
import { openAPIClient } from '@/util/fetch';
import { getQueryClient } from '@/util/getQueryClient';
import { notificationBannerQueryOptions } from '@/util/notificationBanner';
import { Navigation } from '../Navigation';
import { ScrollToTopButton } from './ScrollToTopButton';
import { Providers } from './providers';

export const dynamic = 'force-dynamic';

export default async function Layout({ children }: PropsWithChildren) {
	const { response } = await openAPIClient.GET('/api/v1/user/me/');
	const queryClient = getQueryClient();
	await queryClient.prefetchQuery(notificationBannerQueryOptions(openAPIClient));

	return (
		<Providers env={ENV}>
			<HydrationBoundary state={dehydrate(queryClient)}>
				<SidebarInset>
					<div className="flex grow flex-col bg-base-neutral-0 dark:bg-base-neutral-800">
						{response.ok ? (
							<div className="sticky top-0 z-20">
								<TestEnvironmentBannerNoSSR />
								<Navigation />
							</div>
						) : null}
						<NotificationBanner containerClassName="mx-auto w-full max-w-[856px] px-4 pt-6" />
						{children}
					</div>
					{response.ok ? (
						<>
							<GlobalUploadAssistantNoSSR />
							<GlobalToastRegion />
						</>
					) : null}
					<ScrollToTopButton className="fixed right-4 bottom-16" />
				</SidebarInset>
			</HydrationBoundary>
			<SideSheetNoSSR />
		</Providers>
	);
}
