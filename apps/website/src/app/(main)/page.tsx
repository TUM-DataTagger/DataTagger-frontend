import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { ArrowRightIcon, PackageOpenIcon } from 'lucide-react';
import { RecentProjectsPanel } from '@/components/recent-projects/RecentProjectsPanel';
import { Link } from '@/components/ui/Link';
import { Separator } from '@/components/ui/Separator';
import { SplitText } from '@/components/ui/SplitText';
import { DraftsUploadDropzone } from '@/components/upload-assistant/DraftsUploadDropzone';
import { buttonStyles } from '@/styles/ui/button';
import { dashboardSnapshotQueryOptions } from '@/util/dashboardSnapshot';
import { $api } from '@/util/fetch';
import { getQueryClient } from '@/util/getQueryClient';
import { DashboardHeadlineRegion } from './DashboardHeadline';
import { DashboardSnapshotRegionsProvider } from './DashboardSnapshotRegion';
import { DashboardUpcomingAutoDeletionRegion } from './UpcomingAutoDeletion';

export default async function Page() {
	const queryClient = getQueryClient();
	void queryClient.prefetchQuery(dashboardSnapshotQueryOptions($api));

	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			<DashboardSnapshotRegionsProvider>
				<div className="mx-auto flex w-full max-w-[1136px] grow flex-col gap-6 px-4 py-12 print:max-w-none">
					<div className="flex flex-col gap-6">
						<SplitText
							as="h1"
							className="flex flex-wrap place-items-center text-base-heading-md"
							text="Good to see you"
							splitBy="words"
							delay={80}
							duration={0.6}
							from={{ opacity: 0, y: 20 }}
						/>

						<DashboardHeadlineRegion />

						<div className="mb-8 flex flex-col gap-6">
							<div className="flex place-items-center gap-6">
								<h2 className="flex place-items-center gap-3 text-base-heading-xs">
									<PackageOpenIcon aria-hidden size={24} strokeWidth={1.5} /> My draft files
								</h2>
								<Separator orientation="vertical" className="h-4" />
								<Link variant="unset" className={buttonStyles({ variant: 'discreet', size: 'icon-sm' })} href="/drafts">
									<ArrowRightIcon aria-hidden data-slot="icon" />
								</Link>
							</div>

							<div className="flex flex-col gap-6 md:grid md:min-h-70 md:grid-cols-[auto_396px]">
								<DashboardUpcomingAutoDeletionRegion />

								<DraftsUploadDropzone className="min-h-[124px] md:h-full" origin="dashboard" />
							</div>
						</div>

						<div className="mb-8 flex flex-col gap-6">
							<RecentProjectsPanel />
						</div>
					</div>
				</div>
			</DashboardSnapshotRegionsProvider>
		</HydrationBoundary>
	);
}
