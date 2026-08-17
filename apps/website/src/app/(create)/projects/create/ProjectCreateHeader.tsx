'use client';

import type { PropsWithChildren } from 'react';
import { useFirstTimeFlag } from '@/hooks/useFirstTimeFlag';
import { cx } from '@/styles/cva';
import { ProjectCreateStepper } from './ProjectCreateStepper';

export function ProjectCreateHeader(props: PropsWithChildren) {
	const { isFirstTime } = useFirstTimeFlag('project');

	return (
		<>
			<div
				className={cx(
					'flex flex-col place-content-center place-items-center gap-4 border-b border-base-neutral-100 bg-base-neutral-60 px-4 dark:border-base-neutral-700 dark:bg-base-neutral-700/32',
					// eslint-disable-next-line no-negated-condition
					isFirstTime !== false ? 'h-[192px] pt-12 pb-10' : 'h-[114px]',
				)}
			>
				{/* eslint-disable-next-line no-negated-condition */}
				{isFirstTime !== false ? props.children : <ProjectCreateStepper />}
			</div>
			{/* eslint-disable-next-line no-negated-condition */}
			{isFirstTime !== false ? <ProjectCreateStepper className="pt-12" /> : null}
		</>
	);
}
