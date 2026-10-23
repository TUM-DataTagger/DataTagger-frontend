'use client';

import { createContext, use, type PropsWithChildren } from 'react';
import type { Branding } from '@/util/branding';

const BrandingContext = createContext<Branding | null>(null);

export function BrandingProvider(props: PropsWithChildren<{ readonly branding: Branding }>) {
	return <BrandingContext value={props.branding}>{props.children}</BrandingContext>;
}

export function useBranding(): Branding {
	const branding = use(BrandingContext);

	if (!branding) {
		throw new Error('useBranding must be used within a BrandingProvider');
	}

	return branding;
}
