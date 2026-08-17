'use client';

import type { PropsWithChildren } from 'react';
import { useFirstTimeFlag } from '@/hooks/useFirstTimeFlag';

export function ProjectFolderCreateHeader(props: PropsWithChildren) {
	const { isFirstTime } = useFirstTimeFlag('folder');

	// eslint-disable-next-line no-negated-condition
	return isFirstTime !== false ? (
		<div className="flex h-[192px] flex-col place-content-center place-items-center gap-6 border-b border-base-neutral-100 bg-base-neutral-60 px-4 dark:border-base-neutral-700 dark:bg-base-neutral-700/32">
			{props.children}
		</div>
	) : null;
}
