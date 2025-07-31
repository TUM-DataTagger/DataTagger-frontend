'use client';

import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import { BigLogo, BigLogoDark } from './BigLogo';

export const BigLogoIcon = () => {
	const { resolvedTheme } = useTheme();

	return resolvedTheme === 'light' ? <BigLogo aria-hidden /> : <BigLogoDark aria-hidden />;
};

export const BigLogoIconNoSSR = dynamic(async () => BigLogoIcon, { ssr: false });
