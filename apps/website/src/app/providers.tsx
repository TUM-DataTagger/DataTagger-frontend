'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Provider as JotaiProvider } from 'jotai';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { ThemeProvider } from 'next-themes';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { Suspense, useEffect, useState, type PropsWithChildren } from 'react';
import { RouterProvider } from 'react-aria-components';
import { TusClientProvider } from 'use-tus';
import { getQueryClient } from '@/util/getQueryClient';

const ReactQueryDevtoolsProduction = dynamic(async () =>
	// eslint-disable-next-line promise/prefer-await-to-then
	import('@tanstack/react-query-devtools/production').then((module) => ({
		default: module.ReactQueryDevtools,
	})),
);

export function Providers(props: PropsWithChildren) {
	const router = useRouter();
	const queryClient = getQueryClient();
	const [showDevtools, setShowDevtools] = useState(false);

	useEffect(() => {
		// @ts-expect-error: window.toggleDevtools is not typed
		window.toggleDevtools = () => setShowDevtools((old) => !old);
	}, []);

	return (
		<NuqsAdapter>
			<ThemeProvider attribute="class" storageKey="visual-mode">
				<QueryClientProvider client={queryClient}>
					<RouterProvider navigate={router.push}>
						<JotaiProvider>
							<TusClientProvider>{props.children}</TusClientProvider>
						</JotaiProvider>
					</RouterProvider>
					<ReactQueryDevtools client={queryClient} />
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
