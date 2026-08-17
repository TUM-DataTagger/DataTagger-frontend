'use client';

import { FileLock2Icon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cx } from '@/styles/cva';

type LockAlertBannerProps = {
	readonly canUnlock: boolean;
	readonly className?: string;
	readonly lockedBy?: string | null | undefined;
	// oxlint-disable-next-line typescript/no-redundant-type-constituents
	onUnlock(): Promise<unknown> | unknown;
};

export function LockAlertBanner({ canUnlock, className, lockedBy, onUnlock }: LockAlertBannerProps) {
	return (
		<div
			className={cx(
				'flex min-h-8 place-content-center place-items-center gap-4 rounded-lg bg-base-tangerine-300 px-4 py-2 text-base-neutral-900',
				className,
			)}
		>
			<div className="flex gap-2">
				<FileLock2Icon aria-hidden className="shrink-0" size={18} strokeWidth={1.5} />
				<span>
					Item is locked due to processing
					{lockedBy ? (
						<span>
							{' '}
							by <span className="text-base-label-md">{lockedBy}</span>
						</span>
					) : null}
					.
				</span>
			</div>
			{canUnlock ? (
				<Button isDark onPress={async () => onUnlock()} size="sm" variant="filled">
					Unlock
				</Button>
			) : null}
		</div>
	);
}
