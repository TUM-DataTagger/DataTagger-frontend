'use client';

import { useSetAtom } from 'jotai';
import { CreateRouteCloseButton } from '@/components/create-route/frame/CreateRouteCloseButton';
import { resetCreateProjectStateAtom } from '@/stores/createProject';

export function CloseButton() {
	const resetCreateProjectState = useSetAtom(resetCreateProjectStateAtom);

	async function onBeforeNavigate() {
		resetCreateProjectState();
	}

	return <CreateRouteCloseButton href="/projects" onBeforeNavigate={onBeforeNavigate} />;
}
