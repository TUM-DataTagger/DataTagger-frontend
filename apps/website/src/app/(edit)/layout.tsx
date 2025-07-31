import type { PropsWithChildren } from 'react';
import { GlobalToastRegion } from '@/components/ui/Toast';

export default async function Layout({ children }: PropsWithChildren) {
	return (
		<>
			<div className="flex min-h-dvh w-full flex-1 flex-col">{children}</div>
			<GlobalToastRegion />
		</>
	);
}
