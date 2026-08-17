'use client';

import type { PropsWithChildren } from 'react';
import { MatomoAnalytics } from '@/components/MatomoAnalytics';
import { SharedProviders } from '@/components/auth/SharedProviders';
import { SidebarProvider } from '@/components/ui/Sidebar';
import { EnvProvider } from '@/contexts/EnvContext';
import { WebSocketProvider } from '@/contexts/WebSocket';
import type { ENV } from '@/util/env';

type ProvidersProps = PropsWithChildren & {
	readonly env: typeof ENV;
};

export function Providers(props: ProvidersProps) {
	return (
		<>
			<EnvProvider env={props.env}>
				<WebSocketProvider>
					<SidebarProvider defaultOpen={false}>{props.children}</SidebarProvider>
					<SharedProviders />
				</WebSocketProvider>
			</EnvProvider>
			<MatomoAnalytics />
		</>
	);
}
