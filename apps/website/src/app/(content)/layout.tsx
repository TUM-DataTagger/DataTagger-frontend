import type { PropsWithChildren } from 'react';
import { TestEnvironmentBannerNoSSR } from '@/components/TestEnvironmentBanner';
import { GlobalToastRegion } from '@/components/ui/Toast';
import { GlobalUploadAssistant } from '@/components/upload-assistant/GlobalUploadAssistant';
import { ENV } from '@/util/env';
import { openAPIClient } from '@/util/fetch';
import { CmdK } from '../CmdK';
import { Navigation } from '../Navigation';
import { ScrollToTopButton } from './ScrollToTopButton';
import { Providers } from './providers';

export const dynamic = 'force-dynamic';

export default async function Layout({ children }: PropsWithChildren) {
	const { response } = await openAPIClient.GET('/api/v1/user/me/');

	return (
		<div className="flex min-h-dvh w-full flex-1 flex-col">
			{response.ok ? (
				<div className="bg-base-neutral-0 dark:bg-base-neutral-800 sticky top-0 z-10">
					<TestEnvironmentBannerNoSSR />
					<Navigation />
				</div>
			) : null}
			{children}
			{response.ok ? (
				<Providers env={ENV}>
					<GlobalUploadAssistant />
					<GlobalToastRegion />
					<CmdK />
				</Providers>
			) : null}
			<ScrollToTopButton className="fixed right-4 bottom-16" />
		</div>
	);
}
