import type { Metadata, Viewport } from 'next/types';
import type { PropsWithChildren } from 'react';
import { jetBrainsMono, roboto } from '@/styles/fonts';
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

export const metadata: Metadata = {
	metadataBase: new URL(
		ENV.IS_LOCAL_DEV ? `http://localhost:${process.env.PORT ?? 3_000}` : 'https://app.example.com',
	),
	title: {
		default: 'DataTagger',
		template: '%s | DataTagger',
	},
	description: 'DataTagger helps research teams organize files, projects, and metadata templates.',

	applicationName: 'DataTagger',

	openGraph: {
		title: 'DataTagger',
		description: 'Organize research files, projects, and metadata templates in DataTagger.',
		siteName: 'DataTagger',
		type: 'website',
	},

	appleWebApp: {
		title: 'DataTagger',
	},
};

export default async function RootLayout({ children }: PropsWithChildren) {
	return (
		<html className={`${roboto.variable} ${jetBrainsMono.variable} antialiased`} lang="en-US" suppressHydrationWarning>
			<body className="overscroll-y-none bg-base-neutral-0 text-base-md text-base-neutral-900 dark:bg-base-neutral-800 dark:text-base-neutral-40">
				<Providers>
					{children}
					<DeveloperToolbar />
					<NewVersionBanner />
				</Providers>
			</body>
		</html>
	);
}
