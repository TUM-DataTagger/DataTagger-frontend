'use client';

import { format } from '@formkit/tempo';
import { ArrowRightIcon, Wand2Icon } from 'lucide-react';
import { GridList, GridListItem } from '@/components/ui/GridList';
import { gridCardStyles } from '@/styles/ui/gridCard';
import { RecentProjectStackIndicator } from './RecentProjectStackIndicator';
import type { RecentProjectViewModel } from './recentProjectsViewModel';

export function RecentProjectsGrid(props: { readonly data: readonly RecentProjectViewModel[] }) {
	return (
		<div className="flex flex-wrap gap-6">
			<GridList aria-label="Recent projects" className="overscroll-auto layout-grid:gap-2" layout="grid">
				{props.data?.map((item) => (
					<GridListItem
						className="cursor-pointer rounded-xl"
						href={`/projects/${item.projectUuid}`}
						id={item.projectUuid}
						key={item.projectUuid}
						textValue={item.projectName}
					>
						<div className="relative h-[186px] w-full min-w-50 gap-6 md:max-w-50">
							<div
								className={gridCardStyles({
									variant: 'dashboard-link',
								})}
							>
								<div className="flex grow flex-col place-content-between">
									<div className="flex flex-col gap-3">
										<RecentProjectStackIndicator
											datasetsCount={item.datasetsCount}
											foldersCount={item.foldersCount}
											variant="grid"
										/>
										<span
											className="line-clamp-3 max-w-[25ch] wrap-break-word text-ellipsis group-hover:text-base-lavender-600 group-focus-visible:text-base-lavender-600 group-pressed:text-base-neutral-900 group-hover:group-pressed:text-base-neutral-900 dark:group-hover:text-base-lavender-400 dark:group-focus-visible:text-base-lavender-400 dark:group-pressed:text-base-neutral-40 dark:group-hover:group-pressed:text-base-neutral-40"
											title={item.projectName}
										>
											{item.projectName}
										</span>
									</div>
									<div className="flex flex-col gap-4">
										<span className="inline-flex place-items-center gap-2 text-base-sm text-base-neutral-600 dark:text-base-neutral-300">
											<Wand2Icon className="shrink-0" aria-hidden size={18} strokeWidth={1.5} />
											<div className="flex flex-col gap-1">
												<span title={item.lastActionLabel}>{format(item.lastActionAt, 'MMM D, YYYY hh:mm', 'en')}</span>
											</div>
										</span>
									</div>
								</div>
							</div>
						</div>
					</GridListItem>
				))}
				<GridListItem href="/projects" className="cursor-pointer" textValue="Show all projects">
					<div className="relative h-[186px] w-full min-w-50 gap-6 md:max-w-50">
						<div
							className={gridCardStyles({
								variant: 'dashboard-neutral-link',
							})}
						>
							<span className="flex grow place-content-center place-items-center gap-2">
								Show all
								<ArrowRightIcon aria-hidden size={18} strokeWidth={1.5} />
							</span>
						</div>
					</div>
				</GridListItem>
			</GridList>
		</div>
	);
}
