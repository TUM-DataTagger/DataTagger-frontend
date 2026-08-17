'use client';

import { useSetAtom } from 'jotai';
import { CreateRouteCloseButton } from '@/components/create-route/frame/CreateRouteCloseButton';
import { resetCreateProjectFolderStateAtom } from '@/stores/createProjectFolder';

export function CloseButton() {
	const resetCreateProjectFolderState = useSetAtom(resetCreateProjectFolderStateAtom);

	async function onBeforeNavigate() {
		resetCreateProjectFolderState();
	}

	return <CreateRouteCloseButton href="../folders" onBeforeNavigate={onBeforeNavigate} />;
}
