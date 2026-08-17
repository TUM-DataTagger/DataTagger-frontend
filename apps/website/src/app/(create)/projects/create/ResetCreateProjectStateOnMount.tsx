'use client';

import { useSetAtom } from 'jotai';
import { useEffect } from 'react';
import { resetCreateProjectStateAtom } from '@/stores/createProject';

export function ResetCreateProjectStateOnMount() {
	const resetCreateProjectState = useSetAtom(resetCreateProjectStateAtom);

	useEffect(() => {
		resetCreateProjectState();

		return () => {
			resetCreateProjectState();
		};
	}, [resetCreateProjectState]);

	return null;
}
