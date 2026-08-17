'use client';

import { useSetAtom } from 'jotai';
import { CreateRouteCancelButton } from '@/components/create-route/frame/CreateRouteCancelButton';
import { resetCreateProjectFolderStateAtom } from '@/stores/createProjectFolder';

export function CancelButton() {
	const resetCreateProjectFolderState = useSetAtom(resetCreateProjectFolderStateAtom);

	async function onBeforeNavigate() {
		resetCreateProjectFolderState();
	}

	return <CreateRouteCancelButton href="../folders" onBeforeNavigate={onBeforeNavigate} />;
}
