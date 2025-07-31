'use client';

import type { OverlayScrollbarsComponentProps } from 'overlayscrollbars-react';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import { cx } from '@/styles/cva';

export function Scrollbars(props: OverlayScrollbarsComponentProps) {
	const { className, children, ...additionalProps } = props;

	return (
		<OverlayScrollbarsComponent {...additionalProps} className={cx('', className)} defer>
			{children}
		</OverlayScrollbarsComponent>
	);
}
