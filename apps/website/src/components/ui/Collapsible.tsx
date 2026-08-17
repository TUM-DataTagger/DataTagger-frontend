'use client';

import type { ReactNode } from 'react';
import { cx } from '@/styles/cva';

export function Collapsible(props: {
	readonly children: ReactNode;
	readonly className?: string;
	readonly isOpen: boolean;
}) {
	return (
		<div
			className={cx(
				'grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none',
				props.isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
				props.className,
			)}
		>
			<div aria-hidden={props.isOpen ? undefined : true} className="min-h-0 overflow-hidden" inert={!props.isOpen}>
				{props.children}
			</div>
		</div>
	);
}
