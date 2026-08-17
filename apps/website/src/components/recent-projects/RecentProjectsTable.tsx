'use client';

import { format } from '@formkit/tempo';
import { ArrowRight, Wand2Icon } from 'lucide-react';
import { Link } from '@/components/ui/Link';
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@/components/ui/Table';
import { buttonStyles } from '@/styles/ui/button';
import { RecentProjectStackIndicator } from './RecentProjectStackIndicator';
import type { RecentProjectViewModel } from './recentProjectsViewModel';

export function RecentProjectsTable(props: { readonly data: readonly RecentProjectViewModel[] }) {
	return (
		<div className="flex flex-col gap-4">
			<Table aria-label="Recent projects">
				<TableHeader className="hidden">
					<TableColumn id="visuals" style={{ width: '168px' }}>
						Visuals
					</TableColumn>
					<TableColumn id="name" isRowHeader>
						Name
					</TableColumn>
					<TableColumn id="last_worked_on" style={{ width: '144px' }}>
						Last worked on
					</TableColumn>
				</TableHeader>
				<TableBody items={props.data ?? []}>
					{(item) => (
						<TableRow
							href={`/projects/${item.projectUuid}`}
							id={item.projectUuid}
							className="hover:border-base-neutral-200! pressed:border-base-neutral-200! pressed:bg-base-neutral-80! dark:pressed:border-base-neutral-600! dark:pressed:bg-base-neutral-600/72! dark:selected:focus-visible:bg-base-lavender-600! [&:hover]:bg-base-neutral-0 dark:[&:hover]:border-base-neutral-600 dark:[&:hover]:bg-base-neutral-800"
						>
							<TableCell
								className="h-[72px] py-4"
								style={{ width: '168px' }}
								textValue={`${item.foldersCount ?? 0} folders, ${item.datasetsCount ?? 0} files`}
							>
								<RecentProjectStackIndicator
									datasetsCount={item.datasetsCount}
									foldersCount={item.foldersCount}
									variant="table"
								/>
							</TableCell>
							<TableCell className="h-[72px] py-4" textValue={item.projectName}>
								<Link
									className={buttonStyles({
										variant: 'unset',
										className:
											'group-hover:text-base-lavender-600 dark:group-hover:text-base-lavender-400 group-pressed:text-base-neutral-900 dark:group-pressed:text-base-neutral-40 print:inline-flex',
									})}
									href={`/projects/${item.projectUuid}`}
									variant="unset"
								>
									<span className="max-w-[40ch] truncate" title={item.projectName}>
										{item.projectName}
									</span>
								</Link>
							</TableCell>
							<TableCell
								className="h-[72px] py-4"
								style={{ width: '144px' }}
								textValue={`${item.projectName} - ${item.lastActionAt}`}
							>
								<div className="flex h-full place-items-center justify-end gap-2 text-base-sm text-base-neutral-600 dark:text-base-neutral-300">
									<Wand2Icon aria-hidden size={18} strokeWidth={1.5} />
									<div className="flex place-items-center gap-1">
										<span title={item.lastActionLabel}>{format(item.lastActionAt, 'MMM D, YYYY hh:mm', 'en')}</span>
									</div>
								</div>
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>
			<Link
				href="/projects"
				variant="unset"
				className="group relative flex h-16 place-content-between place-items-center bg-base-neutral-0 px-4 py-3 text-base-label-md -outline-offset-2 outline-base-lavender-400 hover:bg-base-neutral-100 focus-visible:bg-base-neutral-100 focus-visible:outline-2 dark:bg-base-neutral-800 dark:outline-base-lavender-600 dark:hover:bg-base-neutral-700 dark:focus-visible:bg-base-neutral-700 forced-colors:outline-[Highlight] pressed:bg-base-neutral-200 dark:pressed:bg-base-neutral-600"
			>
				Show all projects
				<span className="inline-flex size-8 place-content-center place-items-center rounded-full bg-base-neutral-0 p-0.5 group-hover:bg-base-neutral-80 group-focus-visible:bg-base-neutral-80 group-pressed:bg-base-neutral-80 dark:bg-base-neutral-800 dark:group-hover:bg-base-neutral-700 dark:group-pressed:bg-neutral-700 dark:focus-visible:bg-base-neutral-700">
					<ArrowRight className="shrink-0" aria-hidden size={18} strokeWidth={1.5} />
				</span>
			</Link>
		</div>
	);
}
