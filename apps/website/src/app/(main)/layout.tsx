import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { SideSheetNoSSR } from '@/components/SideSheet';
import { TestEnvironmentBannerNoSSR } from '@/components/TestEnvironmentBanner';
import {
	SidebarInset,
	// SidebarInsetAnchor,
} from '@/components/ui/Sidebar';
import { GlobalToastRegion } from '@/components/ui/Toast';
import { GlobalUploadAssistantNoSSR } from '@/components/upload-assistant/GlobalUploadAssistant';
import { ENV } from '@/util/env';
import { $api, openAPIClient } from '@/util/fetch';
import { getQueryClient } from '@/util/getQueryClient';
import { notificationBannerQueryOptions } from '@/util/notificationBanner';
import { requireCurrentUserOrRedirect } from '@/util/serverAuth';
import { Navigation } from '../Navigation';
import { GlobalDropZone } from './GlobalDropZone';
import { MainNotificationBanner } from './MainNotificationBanner';
import { Providers } from './providers';

export default async function Layout({ children }: PropsWithChildren) {
	const queryClient = getQueryClient();
	const currentUserData = await requireCurrentUserOrRedirect();

	queryClient.setQueryData($api.queryOptions('get', '/api/v1/user/me/').queryKey, currentUserData);
	await queryClient.prefetchQuery(notificationBannerQueryOptions(openAPIClient));

	return (
		<Providers env={ENV}>
			<HydrationBoundary state={dehydrate(queryClient)}>
				{/* <SidebarInsetAnchor intent="inset" side="right" /> */}
				<SidebarInset>
					<div className="flex grow flex-col bg-base-neutral-0 dark:bg-base-neutral-800">
						<div className="sticky top-0 z-20">
							<TestEnvironmentBannerNoSSR />
							<Navigation />
						</div>
						<MainNotificationBanner />
						{children}
					</div>
					<GlobalUploadAssistantNoSSR />
					<GlobalDropZone />
					<GlobalToastRegion />
				</SidebarInset>
				<SideSheetNoSSR />
			</HydrationBoundary>
		</Providers>
	);
}
