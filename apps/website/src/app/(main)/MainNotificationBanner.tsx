'use client';

import { usePathname } from 'next/navigation';
import { NotificationBanner } from '@/components/NotificationBanner';
import { cx } from '@/styles/cva';

export function MainNotificationBanner() {
	const pathname = usePathname();

	return (
		<NotificationBanner
			containerClassName={cx('mx-auto w-full px-4 pt-6', pathname === '/' ? 'max-w-[1136px]' : 'max-w-[856px]')}
		/>
	);
}
