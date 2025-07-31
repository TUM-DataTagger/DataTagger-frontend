'use client';

import dynamic from 'next/dynamic';

export function TestEnvironmentBanner() {
	const isProductionEnvironment =
		typeof window !== 'undefined' && window.location.href.startsWith('https://datatagger.domain.com');

	if (isProductionEnvironment) {
		return null;
	}

	return (
		<div className="bg-base-tangerine-500 text-base-md text-base-neutral-900 px-8 py-2 text-center font-medium print:hidden">
			You are currently on the test environment.
		</div>
	);
}

export const TestEnvironmentBannerNoSSR = dynamic(async () => TestEnvironmentBanner, { ssr: false });
