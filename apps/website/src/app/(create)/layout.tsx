import type { PropsWithChildren } from 'react';
import { SharedProviders } from '@/components/auth/SharedProviders';
import { GlobalToastRegion } from '@/components/ui/Toast';
import { requireCurrentUserOrRedirect } from '@/util/serverAuth';

export default async function Layout({ children }: PropsWithChildren) {
	await requireCurrentUserOrRedirect();

	return (
		<>
			<div className="flex min-h-dvh w-full flex-1 flex-col">
				{children}
				<SharedProviders />
			</div>
			<GlobalToastRegion />
		</>
	);
}
