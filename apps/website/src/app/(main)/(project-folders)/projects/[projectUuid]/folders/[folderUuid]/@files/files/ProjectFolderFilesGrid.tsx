'use client';

import { useSetAtom } from 'jotai';
import { InfoIcon, Wand2Icon } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useMediaQuery } from 'usehooks-ts';
import { Button } from '@/components/ui/Button';
import { GridList, GridListItem } from '@/components/ui/GridList';
import { useSidebar } from '@/components/ui/Sidebar';
import { globalUploadAssistantOpenAtom } from '@/stores/globalUploadAssistant';
import { sideSheetSelectedDatasetAtom } from '@/stores/sideSheet';
import { gridCardStyles } from '@/styles/ui/gridCard';
import { convertDataRateLog } from '@/util/convertDataRate';
import type { components } from '@/util/openapiSchema';
import { ProjectFolderFilesMoreMenu } from './ProjectFolderFilesMoreMenu';
import { ProjectFolderFilesUploadGrid } from './ProjectFolderFilesUploadGrid';

type ProjectFolderFile = components['schemas']['UploadsDatasetList'];

export function ProjectFolderFilesGrid(props: { readonly data?: ProjectFolderFile[] | undefined }) {
	const params = useParams<{ readonly folderUuid: string; readonly projectUuid: string }>();
	const isLarge = useMediaQuery('(min-width: 1024px)', { initializeWithValue: false });
	const { setOpen: setSidebarOpen } = useSidebar();
	const setIsGlobalUploadAssistantOpen = useSetAtom(globalUploadAssistantOpenAtom);
	const setSideSheetSelectedDataset = useSetAtom(sideSheetSelectedDatasetAtom);

	return (
		<div className="flex flex-wrap gap-6">
			<GridList aria-label="Files" className="layout-grid:gap-3.5" layout="grid">
				<ProjectFolderFilesUploadGrid folderUuid={params.folderUuid} />
				{props.data?.map((item) => (
					<GridListItem
						className="cursor-pointer rounded-xl"
						href={`/projects/${params.projectUuid}/folders/${params.folderUuid}/files/${item.pk}`}
						id={item.pk}
						key={item.pk}
						textValue={item.display_name ?? 'Empty dataset'}
					>
						<div className="relative h-[150px] w-full min-w-64 gap-6 md:w-auto">
							<div className="absolute top-2 right-2">
								<ProjectFolderFilesMoreMenu
									fileUuid={item.pk}
									// filename={dataset.display_name}
									folderUuid={params.folderUuid}
									projectUuid={params.projectUuid}
									versionUuid={item.latest_version?.pk}
								/>
							</div>
							<div className="absolute right-4 bottom-3">
								<Button
									aria-label="Open sidesheet"
									className="rounded-full"
									onPress={() => {
										setSidebarOpen(true);
										setSideSheetSelectedDataset(item.pk);
										if (!isLarge) {
											setIsGlobalUploadAssistantOpen(false);
										}
									}}
									size="icon-sm"
									variant="unset"
								>
									<InfoIcon aria-hidden size={18} strokeWidth={1.5} />
								</Button>
							</div>
							<div
								className={gridCardStyles({
									variant: 'link',
									className: 'pb-3',
								})}
							>
								<div className="flex grow flex-col place-content-between">
									<div className="flex flex-col gap-3">
										<span className="group-active:text-base-neutral-900 group-hover:text-base-lavender-600 group-hover:group-active:text-base-neutral-900 group-focus-visible:text-base-lavender-600 dark:group-active:text-base-neutral-40 dark:group-hover:text-base-lavender-400 dark:group-hover:group-active:text-base-neutral-40 dark:group-focus-visible:text-base-lavender-400 line-clamp-2 max-w-[25ch] break-words text-ellipsis">
											{item.display_name ?? 'Empty dataset'}
										</span>
										<span>
											{convertDataRateLog(
												item?.latest_version?.version_file?.metadata?.find(
													(metadata) => metadata.custom_key === 'FILE_SIZE',
												)?.value as number | undefined,
											) ?? '...'}
										</span>
									</div>
									<div className="mb-1 flex flex-col gap-4">
										<span className="text-base-sm text-base-neutral-600 dark:text-base-neutral-300 inline-flex place-items-center gap-2">
											<Wand2Icon aria-hidden size={18} strokeWidth={1.5} /> {item?.created_by.email}
										</span>
									</div>
								</div>
							</div>
						</div>
					</GridListItem>
				))}
			</GridList>
		</div>
	);
}
