'use client';

import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import { Logo, LogoDark } from './Logo';

export const LogoIcon = () => {
	const { resolvedTheme } = useTheme();

	return resolvedTheme === 'light' ? <Logo aria-hidden /> : <LogoDark aria-hidden />;
};

export const LogoIconNoSSR = dynamic(async () => LogoIcon, { ssr: false });
