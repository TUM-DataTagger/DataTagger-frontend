'use client';

import type { PropsWithChildren } from 'react';
import { MatomoAnalytics } from '@/components/MatomoAnalytics';
import { SidebarProvider } from '@/components/ui/Sidebar';
import { EnvProvider } from '@/contexts/EnvContext';
import type { ENV } from '@/util/env';

type ProvidersProps = PropsWithChildren & {
	readonly env: typeof ENV;
};

export function Providers(props: ProvidersProps) {
	return (
		<>
			<EnvProvider env={props.env}>
				<SidebarProvider defaultOpen={false}>{props.children}</SidebarProvider>
			</EnvProvider>
			<MatomoAnalytics />
		</>
	);
}
