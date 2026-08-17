'use client';

import { useSetAtom } from 'jotai';
import { useEffect } from 'react';
import { resetCreateProjectFolderStateAtom } from '@/stores/createProjectFolder';

export function ResetCreateProjectFolderStateOnMount() {
	const resetCreateProjectFolderState = useSetAtom(resetCreateProjectFolderStateAtom);

	useEffect(() => {
		resetCreateProjectFolderState();

		return () => {
			resetCreateProjectFolderState();
		};
	}, [resetCreateProjectFolderState]);

	return null;
}
