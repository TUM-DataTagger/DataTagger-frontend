'use client';

import { BrandLogo } from './BrandLogo';

// The logo is configured in branding/branding.json
export const LogoIcon = () => <BrandLogo size="small" />;

export const LogoIconNoSSR = LogoIcon;
