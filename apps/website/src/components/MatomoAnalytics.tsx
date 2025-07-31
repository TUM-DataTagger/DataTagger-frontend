'use client';

import { init, push } from '@socialgouv/matomo-next';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

const MATOMO_URL = 'https://domain.com/';
const MATOMO_SITE_ID = '';

export function MatomoAnalytics() {
	const pathname = usePathname();
	const isInitialLoad = useRef(true);

	const isProductionEnvironment =
		typeof window !== 'undefined' && window.location.href.startsWith('https://datatagger.domain.com');

	useEffect(() => {
		if (isProductionEnvironment) {
			init({ url: MATOMO_URL, siteId: MATOMO_SITE_ID });
			return () => push(['HeatmapSessionRecording::disable']);
		}

		return () => {};
	}, [isProductionEnvironment]);

	useEffect(() => {
		if (isInitialLoad.current) {
			isInitialLoad.current = false;
		} else if (pathname && isProductionEnvironment) {
			push(['setCustomUrl', pathname]);
			push(['trackPageView']);
		}
	}, [pathname, isProductionEnvironment]);

	return null;
}
