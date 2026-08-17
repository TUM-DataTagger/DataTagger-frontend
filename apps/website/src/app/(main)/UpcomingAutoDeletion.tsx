'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { AutoDeletionEmpty } from '@/components/icons/AutoDeletionEmpty';
import { cx } from '@/styles/cva';
import { $api } from '@/util/clientFetch';
import { dashboardSnapshotQueryOptions, formatDashboardCount, type DashboardSnapshot } from '@/util/dashboardSnapshot';
import { DashboardSnapshotRegion } from './DashboardSnapshotRegion';

type UpcomingAutoDeletionProps = {
	readonly buckets: DashboardSnapshot['upcoming_auto_deletion'];
};

const BUCKETS = [
	{ key: 'today_or_tomorrow', label: '1 day left', variant: 'sunset' as const },
	{ key: 'in_2_to_3_days', label: '2-3 days left', variant: 'sunset' as const },
	{ key: 'in_4_to_7_days', label: '4-7 days left', variant: 'tangerine' as const },
	{ key: 'in_8_to_14_days', label: '8-14 days left', variant: 'neutral' as const },
] as const;

const VARIANT_STYLES = {
	sunset: 'bg-base-sunset-100 text-base-sunset-800 dark:bg-base-sunset-800 dark:text-base-sunset-100',
	tangerine: 'bg-base-tangerine-100 text-base-tangerine-800 dark:bg-base-tangerine-800 dark:text-base-tangerine-100',
	neutral: 'bg-base-neutral-100 dark:bg-base-neutral-700',
} as const;

export function UpcomingAutoDeletion({ buckets }: UpcomingAutoDeletionProps) {
	const bucketCounts = BUCKETS.map((bucket) => ({
		...bucket,
		count: buckets[bucket.key],
	}));

	const hasUpcomingDeletions = bucketCounts.some((bucket) => bucket.count > 0);

	return (
		<div className="flex flex-col gap-4 rounded-xl border border-base-neutral-100 p-4 pb-6 dark:border-base-neutral-700">
			<div className="mx-3 text-base-xl">Upcoming auto-deletion</div>
			{hasUpcomingDeletions ? (
				<>
					<div className="grow">
						{bucketCounts.map((bucket) => (
							<div
								key={bucket.label}
								className="grid h-10 grid-cols-[auto_1fr_auto] place-content-center place-items-center gap-2 px-3"
							>
								<span
									className={cx(
										'h-6 w-auto cursor-auto place-self-start rounded-sm px-2 py-1 text-base-sm print:inline-flex',
										VARIANT_STYLES[bucket.variant],
									)}
								>
									{bucket.label}
								</span>
								<span
									aria-hidden
									className="mt-1.5 h-0.5 w-full bg-[radial-gradient(circle,currentColor_0.5px,transparent_0.5px)] bg-size-[4px_2px] bg-repeat-x text-base-neutral-600 dark:text-base-neutral-300"
								/>
								<span
									className={bucket.count === 0 ? 'text-base-neutral-900/38 dark:text-base-neutral-40/38' : undefined}
								>
									{bucket.count === 0 ? 'no files affected' : `${formatDashboardCount(bucket.count, 'file')} affected`}
								</span>
							</div>
						))}
					</div>
					<div className="px-3 text-base-neutral-600 dark:text-base-neutral-300">
						Move files to a folder before it&apos;s too late
					</div>
				</>
			) : (
				<div className="mx-3 flex grow flex-col items-center justify-center gap-4 rounded-xl bg-base-neutral-60 dark:bg-base-neutral-700/38">
					<AutoDeletionEmpty />
					<p className="text-center">No auto-deletion detected within the next 14 days</p>
				</div>
			)}
		</div>
	);
}

function DashboardUpcomingAutoDeletion() {
	const { data } = useSuspenseQuery(dashboardSnapshotQueryOptions($api));

	return <UpcomingAutoDeletion buckets={data.upcoming_auto_deletion} />;
}

function DashboardUpcomingAutoDeletionSkeleton() {
	return (
		<div
			aria-label="Loading upcoming auto-deletion"
			className="min-h-70 animate-pulse rounded-xl border border-base-neutral-100 bg-base-neutral-60 dark:border-base-neutral-700 dark:bg-base-neutral-700/38"
		/>
	);
}

export function DashboardUpcomingAutoDeletionRegion() {
	return (
		<DashboardSnapshotRegion
			errorMessage="Upcoming auto-deletion could not be loaded."
			loadingFallback={<DashboardUpcomingAutoDeletionSkeleton />}
		>
			<DashboardUpcomingAutoDeletion />
		</DashboardSnapshotRegion>
	);
}
