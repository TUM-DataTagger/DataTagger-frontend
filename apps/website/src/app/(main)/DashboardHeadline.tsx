'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { ChevronRightIcon, FileWarningIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Separator } from '@/components/ui/Separator';
import { $api } from '@/util/clientFetch';
import { dashboardSnapshotQueryOptions, formatDashboardCount } from '@/util/dashboardSnapshot';
import { DashboardSnapshotRegion } from './DashboardSnapshotRegion';

function DashboardCount({
	count,
	label,
	noun,
}: {
	readonly count: number;
	readonly label: string;
	readonly noun: string;
}) {
	return (
		<div className="flex min-h-22 w-40 grow flex-col rounded-2xl bg-base-neutral-60 px-4 py-3 text-base-neutral-600 md:min-h-auto md:w-auto md:bg-transparent md:py-0 dark:bg-base-neutral-700/38 dark:text-base-neutral-300 md:dark:bg-transparent">
			<span className="text-base-xl md:text-base-heading-xs">{formatDashboardCount(count, noun)}</span>
			<span className="text-base-sm md:text-base-md">{label}</span>
		</div>
	);
}

function DashboardHeadline() {
	const { data } = useSuspenseQuery(dashboardSnapshotQueryOptions($api));
	const counts = data.resource_counts;

	return (
		<div className="mb-8 flex flex-col gap-4">
			<div className="flex flex-wrap place-items-center gap-2 rounded-xl md:bg-base-neutral-60 md:px-4 md:py-6 md:dark:bg-base-neutral-700/38">
				<DashboardCount count={counts.draft_datasets} noun="file" label="stored in My draft files" />
				<Separator
					className="hidden h-9 bg-base-neutral-200 md:block dark:bg-base-neutral-600"
					orientation="vertical"
				/>
				<DashboardCount count={counts.project_datasets} noun="file" label="stored in project-folders" />
				<Separator
					className="hidden h-9 bg-base-neutral-200 md:block dark:bg-base-neutral-600"
					orientation="vertical"
				/>
				<DashboardCount count={counts.created_projects} noun="project" label="created by yourself" />
				<Separator
					className="hidden h-9 bg-base-neutral-200 md:block dark:bg-base-neutral-600"
					orientation="vertical"
				/>
				<DashboardCount count={counts.collaborating_projects} noun="project" label="you are collaborating on" />
			</div>
			{counts.datasets_missing_files > 0 ? (
				<Button
					variant="unset"
					className="h-10 place-content-between rounded bg-base-tangerine-100/64 px-4 py-3 text-base-md text-base-tangerine-800 hover:bg-base-tangerine-100 focus-visible:bg-base-tangerine-100 dark:bg-base-tangerine-800/64 dark:text-base-tangerine-100 dark:hover:bg-base-tangerine-800 dark:focus-visible:bg-base-tangerine-800 pressed:bg-base-tangerine-200 pressed:text-base-neutral-900 dark:pressed:bg-base-tangerine-700 dark:pressed:text-base-neutral-40"
				>
					<span className="flex place-items-center gap-3">
						<FileWarningIcon aria-hidden size={24} strokeWidth={1.5} />{' '}
						{formatDashboardCount(counts.datasets_missing_files, 'missing file')} detected
					</span>
					<ChevronRightIcon aria-hidden size={24} strokeWidth={1.5} />
				</Button>
			) : null}
		</div>
	);
}

function DashboardHeadlineSkeleton() {
	return (
		<div aria-label="Loading dashboard summary" className="mb-8 flex animate-pulse flex-col gap-4">
			<div className="min-h-22 rounded-xl bg-base-neutral-60 dark:bg-base-neutral-700/38" />
			<div className="h-10 rounded bg-base-neutral-100 dark:bg-base-neutral-700" />
		</div>
	);
}

export function DashboardHeadlineRegion() {
	return (
		<DashboardSnapshotRegion
			errorMessage="Dashboard summary could not be loaded."
			loadingFallback={<DashboardHeadlineSkeleton />}
		>
			<DashboardHeadline />
		</DashboardSnapshotRegion>
	);
}
