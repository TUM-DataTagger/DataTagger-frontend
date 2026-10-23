import type { Metadata, Viewport } from 'next/types';
import type { PropsWithChildren } from 'react';
import { BrandingProvider } from '@/contexts/BrandingContext';
import { jetBrainsMono, roboto } from '@/styles/fonts';
import { getBranding } from '@/util/branding';
import { ENV } from '@/util/env';
import { DeveloperToolbar } from './DeveloperToolbar';
import { NewVersionBanner } from './NewVersionBanner';
import { Providers } from './providers';
import 'overlayscrollbars/overlayscrollbars.css';
import '@/styles/base.css';

export const viewport: Viewport = {
	themeColor: [
		{ media: '(prefers-color-scheme: light)', color: '#ffffff' },
		{ media: '(prefers-color-scheme: dark)', color: '#333333' },
	],
	colorScheme: 'light dark',
};

export async function generateMetadata(): Promise<Metadata> {
	const { appName, icons } = await getBranding();

	return {
		icons: {
			icon: [
				...(icons.favicon ? [{ url: icons.favicon, sizes: 'any' }] : []),
				...(icons.icon ? [{ url: icons.icon }] : []),
			],
			apple: icons.appleTouchIcon ?? undefined,
		},
		metadataBase: new URL(
			ENV.IS_LOCAL_DEV ? `http://localhost:${process.env.PORT ?? 3_000}` : 'https://app.example.com',
		),
		title: {
			default: appName,
			template: `%s | ${appName}`,
		},
		description: `${appName} helps research teams organize files, projects, and metadata templates.`,

		applicationName: appName,

		openGraph: {
			title: appName,
			description: `Organize research files, projects, and metadata templates in ${appName}.`,
			siteName: appName,
			type: 'website',
		},

		appleWebApp: {
			title: appName,
		},
	};
}

export default async function RootLayout({ children }: PropsWithChildren) {
	const branding = await getBranding();

	return (
		<html className={`${roboto.variable} ${jetBrainsMono.variable} antialiased`} lang="en-US" suppressHydrationWarning>
			<body className="overscroll-y-none bg-base-neutral-0 text-base-md text-base-neutral-900 dark:bg-base-neutral-800 dark:text-base-neutral-40">
				<BrandingProvider branding={branding}>
					<Providers>
						{children}
						<DeveloperToolbar />
						<NewVersionBanner />
					</Providers>
				</BrandingProvider>
			</body>
		</html>
	);
}
