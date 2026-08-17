'use client';

import { useSetAtom } from 'jotai';
import { CreateRouteCancelButton } from '@/components/create-route/frame/CreateRouteCancelButton';
import { resetCreateProjectStateAtom } from '@/stores/createProject';

export function CancelButton() {
	const resetCreateProjectState = useSetAtom(resetCreateProjectStateAtom);

	async function onBeforeNavigate() {
		resetCreateProjectState();
	}

	return <CreateRouteCancelButton href="/projects" onBeforeNavigate={onBeforeNavigate} />;
}
