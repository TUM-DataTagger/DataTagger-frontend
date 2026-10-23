'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { Provider as JotaiProvider } from 'jotai';
import { ThemeProvider } from 'next-themes';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { Suspense, useEffect, useState, type PropsWithChildren } from 'react';
import { I18nProvider, RouterProvider } from 'react-aria-components';
import { TusClientProvider } from 'use-tus';
import { getQueryClient } from '@/util/getQueryClient';

const ReactQueryDevtoolsProduction = dynamic(async () => {
	const mod = await import('@tanstack/react-query-devtools/production');

	return {
		default: mod.ReactQueryDevtools,
	};
});

const ReactQueryDevtoolsDevelopment = dynamic(async () => {
	const mod = await import('@tanstack/react-query-devtools');

	return {
		default: mod.ReactQueryDevtools,
	};
});

export function Providers(props: PropsWithChildren) {
	const router = useRouter();
	const queryClient = getQueryClient();
	const [showDevtools, setShowDevtools] = useState(false);

	useEffect(() => {
		window.toggleDevtools = () => setShowDevtools((old) => !old);
		return () => {
			delete window.toggleDevtools;
		};
	}, []);

	return (
		<NuqsAdapter>
			<ThemeProvider
				attribute="class"
				// The theme script only needs to run in the server-rendered HTML. On the client, React 19 warns about
				// script tags in components, so it is marked as non-executable there.
				scriptProps={typeof window === 'undefined' ? undefined : { type: 'application/json' }}
				storageKey="visual-mode"
			>
				<QueryClientProvider client={queryClient}>
					<I18nProvider locale="en-US">
						<RouterProvider
							navigate={(href, options) => {
								router.push(href, options as Parameters<typeof router.push>[1]);
							}}
						>
							<JotaiProvider>
								<TusClientProvider>{props.children}</TusClientProvider>
							</JotaiProvider>
						</RouterProvider>
					</I18nProvider>
					{process.env.NODE_ENV !== 'production' && (
						<Suspense fallback={null}>
							<ReactQueryDevtoolsDevelopment client={queryClient} />
						</Suspense>
					)}
					{showDevtools && (
						<Suspense fallback={null}>
							<ReactQueryDevtoolsProduction />
						</Suspense>
					)}
				</QueryClientProvider>
			</ThemeProvider>
		</NuqsAdapter>
	);
}
