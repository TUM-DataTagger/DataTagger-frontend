'use client';

import dynamic from 'next/dynamic';
import { useBranding } from '@/contexts/BrandingContext';

export function TestEnvironmentBanner() {
	const { showTestEnvironmentBanner } = useBranding();
	const isProductionEnvironment =
		typeof window !== 'undefined' && window.location.href.startsWith('https://app.example.com');

	if (isProductionEnvironment || !showTestEnvironmentBanner) {
		return null;
	}

	return (
		<div className="bg-base-tangerine-500 px-8 py-2 text-center text-base-md font-medium text-base-neutral-900 print:hidden">
			You are currently on the test environment.
		</div>
	);
}

export const TestEnvironmentBannerNoSSR = dynamic(async () => TestEnvironmentBanner, { ssr: false });
