'use client';

import { FileIcon, DatabaseIcon } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { GridList, GridListItem } from '@/components/ui/GridList';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/Tooltip';
import { gridCardStyles } from '@/styles/ui/gridCard';
import type { components } from '@/util/openapiSchema';
import { ProjectFoldersCreateGrid } from './ProjectFoldersCreateGrid';
import { ProjectFoldersMoreMenu } from './ProjectFoldersMoreMenu';

type ProjectFolder = components['schemas']['FolderList'];

export function ProjectFoldersGrid(props: { readonly data?: ProjectFolder[] | undefined }) {
	const params = useParams<{ readonly projectUuid: string }>();
	const router = useRouter();

	return (
		<div className="flex flex-wrap gap-6">
			<GridList aria-label="Folders" className="overscroll-auto layout-grid:gap-4" layout="grid">
				<ProjectFoldersCreateGrid
					href={`/projects/${params.projectUuid}/folders/create`}
					projectUuid={params.projectUuid}
				>
					Create folder
				</ProjectFoldersCreateGrid>
				{props.data?.map((item) => (
					<GridListItem
						className="cursor-pointer rounded-xl"
						href={`/projects/${params.projectUuid}/folders/${item.pk}`}
						id={item.pk}
						key={item.pk}
						textValue={item.name}
					>
						<div className="relative h-[150px] w-full min-w-64 gap-6 md:max-w-64">
							<div className="absolute top-2 right-2">
								<ProjectFoldersMoreMenu
									folderName={item.name}
									folderUuid={item.pk}
									isDeletable={item.datasets_count === 0}
									projectUuid={params.projectUuid}
								/>
							</div>
							<div
								className={gridCardStyles({
									variant: 'link',
								})}
							>
								<div className="flex flex-col gap-3">
									<span
										className="line-clamp-2 max-w-[25ch] wrap-break-word text-ellipsis group-hover:text-base-lavender-600 group-focus-visible:text-base-lavender-600 group-pressed:text-base-neutral-900 group-hover:group-pressed:text-base-neutral-900 dark:group-hover:text-base-lavender-400 dark:group-focus-visible:text-base-lavender-400 dark:group-pressed:text-base-neutral-40 dark:group-hover:group-pressed:text-base-neutral-40"
										title={item.name}
									>
										{item.name}
									</span>
									<Tooltip delay={400}>
										<TooltipTrigger
											aria-label="Storage"
											className="flex place-items-center gap-2 place-self-start text-base-sm text-neutral-500 dark:text-neutral-300 print:inline-flex"
											onPress={() => {
												router.push(`/projects/${params.projectUuid}/folders/${item.pk}`);
											}}
											variant="unset"
										>
											<DatabaseIcon
												aria-hidden
												className="text-neutral-500 dark:text-neutral-300"
												size={18}
												strokeWidth={1.5}
											/>
											{item.storage?.name ?? 'DSS'}
										</TooltipTrigger>
										<TooltipContent variant="plain">Storage</TooltipContent>
									</Tooltip>
								</div>
								<span
									aria-label="Files"
									className="flex place-items-center gap-1 place-self-start rounded-sm bg-base-neutral-700 px-2 py-1 text-base-sm text-base-neutral-40 dark:bg-base-neutral-100 dark:text-base-neutral-900"
								>
									<FileIcon aria-hidden size={18} strokeWidth={1.5} /> {item.datasets_count}
								</span>
							</div>
						</div>
					</GridListItem>
				))}
			</GridList>
		</div>
	);
}
