'use client';

import { useApplicationSettings } from '@/hooks/useApplicationSettings';
import { cx } from '@/styles/cva';
import { version } from '@/util/version';

export function Version(props: { readonly className?: string }) {
	const { applicationSettingsData } = useApplicationSettings();

	return (
		<span className={cx('text-base-neutral-600 dark:text-base-neutral-300', props.className)}>
			{version}
			{applicationSettingsData?.VERSION_NAME ? ` (${applicationSettingsData.VERSION_NAME})` : null}
		</span>
	);
}
