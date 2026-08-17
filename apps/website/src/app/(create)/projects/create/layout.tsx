import type { PropsWithChildren } from 'react';
import { CreateRouteTopBar } from '@/components/create-route/frame/CreateRouteTopBar';
import { CloseButton } from './CloseButton';
import { ResetCreateProjectStateOnMount } from './ResetCreateProjectStateOnMount';

export default async function Layout({ children }: PropsWithChildren) {
	return (
		<>
			<ResetCreateProjectStateOnMount />
			<CreateRouteTopBar closeButton={<CloseButton />} title="Create project" />
			{children}
		</>
	);
}
