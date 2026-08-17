import type { PropsWithChildren } from 'react';
import { CreateRouteTopBar } from '@/components/create-route/frame/CreateRouteTopBar';
import { CloseButton } from './CloseButton';

export default async function Layout({ children }: PropsWithChildren) {
	return (
		<>
			<CreateRouteTopBar closeButton={<CloseButton />} title="Create metadata template" />
			{children}
		</>
	);
}
