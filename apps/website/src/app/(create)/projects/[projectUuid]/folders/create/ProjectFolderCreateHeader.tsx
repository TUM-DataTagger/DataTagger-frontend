'use client';

import type { PropsWithChildren } from 'react';
import { useReadLocalStorage } from 'usehooks-ts';

export function ProjectFolderCreateHeader(props: PropsWithChildren) {
	const isFirstTime = useReadLocalStorage('isFirstTimeFolder', { initializeWithValue: false });

	// eslint-disable-next-line no-negated-condition
	return isFirstTime !== false ? (
		<div className="border-base-neutral-100 bg-base-neutral-60 dark:border-base-neutral-700 dark:bg-base-neutral-700/32 flex h-[192px] flex-col place-content-center place-items-center gap-6 border-b px-4">
			{props.children}
		</div>
	) : null;
}
