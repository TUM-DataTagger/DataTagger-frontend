'use client';

import { useQuery } from '@tanstack/react-query';
import { AlertTriangleIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Alert } from '@/components/ui/Alert';
import { cx } from '@/styles/cva';
import { openAPIClient } from '@/util/clientFetch';
import {
	getNotificationBannerMessage,
	notificationBannerQueryOptions,
	type NotificationBannerSeverity,
} from '@/util/notificationBanner';

const NOTIFICATION_BANNER_REFETCH_INTERVAL = 60_000;

type NotificationBannerProps = {
	readonly className?: string;
	readonly containerClassName?: string;
	readonly icon?: ReactNode;
	readonly message?: string | null | undefined;
	readonly severity?: NotificationBannerSeverity;
	readonly useSettings?: boolean;
};

export function NotificationBanner({
	className,
	containerClassName,
	icon,
	message,
	severity = 'warning',
	useSettings = true,
}: NotificationBannerProps) {
	const { data: settingsMessage } = useQuery({
		...notificationBannerQueryOptions(openAPIClient),
		enabled: useSettings,
		refetchInterval: NOTIFICATION_BANNER_REFETCH_INTERVAL,
		refetchOnMount: false,
	});

	const activeMessage = useSettings ? settingsMessage : getNotificationBannerMessage(message);

	if (!activeMessage) {
		return null;
	}

	const resolvedIcon =
		icon === undefined ? <AlertTriangleIcon aria-hidden className="shrink-0" size={24} strokeWidth={1.5} /> : icon;

	const banner = (
		<Alert className={cx('wrap-break-word', className)} variant={severity}>
			{resolvedIcon}
			<span>{activeMessage}</span>
		</Alert>
	);

	return containerClassName ? <div className={containerClassName}>{banner}</div> : banner;
}
