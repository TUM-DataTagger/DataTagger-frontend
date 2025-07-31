import type { PropsWithChildren } from 'react';
import { TestEnvironmentBannerNoSSR } from '@/components/TestEnvironmentBanner';
import { GlobalToastRegion } from '@/components/ui/Toast';
import Footer from './Footer';

export default async function Layout({ children }: PropsWithChildren) {
	return (
		<>
			<div className="flex min-h-dvh w-full flex-1 flex-col">
				<TestEnvironmentBannerNoSSR />
				{children}
				<Footer />
			</div>
			<GlobalToastRegion />
		</>
	);
}
