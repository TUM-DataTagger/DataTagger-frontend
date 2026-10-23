'use client';

import { BrandLogo } from './BrandLogo';

// The logo is configured in branding/branding.json
export const BigLogoIcon = () => <BrandLogo size="large" />;

export const BigLogoIconNoSSR = BigLogoIcon;
