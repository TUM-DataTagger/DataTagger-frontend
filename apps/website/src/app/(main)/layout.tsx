import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { SideSheet } from '@/components/SideSheet';
import { TestEnvironmentBannerNoSSR } from '@/components/TestEnvironmentBanner';
import {
	SidebarInset,
	// SidebarInsetAnchor,
} from '@/components/ui/Sidebar';
import { GlobalToastRegion } from '@/components/ui/Toast';
import { GlobalUploadAssistant } from '@/components/upload-assistant/GlobalUploadAssistant';
import { ENV } from '@/util/env';
import { $api } from '@/util/fetch';
import { getQueryClient } from '@/util/getQueryClient';
import { CmdK } from '../CmdK';
import { Navigation } from '../Navigation';
import { GlobalDropZone } from './GlobalDropZone';
import { Providers } from './providers';

export default async function Layout({ children }: PropsWithChildren) {
	const queryClient = getQueryClient();

	await queryClient.prefetchQuery($api.queryOptions('get', '/api/v1/user/me/'));

	return (
		<Providers env={ENV}>
			<HydrationBoundary state={dehydrate(queryClient)}>
				{/* <SidebarInsetAnchor intent="inset" side="right" /> */}
				<SidebarInset>
					<div className="bg-base-neutral-0 dark:bg-base-neutral-800 flex grow flex-col">
						<div className="sticky top-0 z-10">
							<TestEnvironmentBannerNoSSR />
							<Navigation />
						</div>
						{children}
					</div>
					<GlobalUploadAssistant />
					<GlobalDropZone />
					<GlobalToastRegion />
					<CmdK />
				</SidebarInset>
				<SideSheet />
			</HydrationBoundary>
		</Providers>
	);
}
