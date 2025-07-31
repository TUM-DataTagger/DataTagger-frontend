'use client';

import { useSetAtom } from 'jotai';
import { InfoIcon, Wand2Icon } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMediaQuery } from 'usehooks-ts';
import { Button } from '@/components/ui/Button';
import { useSidebar } from '@/components/ui/Sidebar';
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@/components/ui/Table';
import { globalUploadAssistantOpenAtom } from '@/stores/globalUploadAssistant';
import { sideSheetSelectedDatasetAtom } from '@/stores/sideSheet';
import { buttonStyles } from '@/styles/ui/button';
import { convertDataRateLog } from '@/util/convertDataRate';
import type { components } from '@/util/openapiSchema';
import { ProjectFolderFilesMoreMenu } from './ProjectFolderFilesMoreMenu';
import { ProjectFolderFilesUploadTable } from './ProjectFolderFilesUploadTable';

type ProjectFolderFile = components['schemas']['UploadsDatasetList'];

export function ProjectFolderFilesTable(props: { readonly data?: ProjectFolderFile[] | undefined }) {
	const params = useParams<{ readonly folderUuid: string; readonly projectUuid: string }>();
	const isLarge = useMediaQuery('(min-width: 1024px)', { initializeWithValue: false });
	const { setOpen: setSidebarOpen } = useSidebar();
	const setIsGlobalUploadAssistantOpen = useSetAtom(globalUploadAssistantOpenAtom);
	const setSideSheetSelectedDataset = useSetAtom(sideSheetSelectedDatasetAtom);

	const handleOpenSidesheet = (item: ProjectFolderFile) => {
		setSidebarOpen(true);
		setSideSheetSelectedDataset(item.pk);
		if (!isLarge) {
			setIsGlobalUploadAssistantOpen(false);
		}
	};

	return (
		<div className="flex flex-col">
			<ProjectFolderFilesUploadTable folderUuid={params.folderUuid} />
			<Table aria-label="Project folder files">
				<TableHeader className="hidden">
					<TableColumn id="name" isRowHeader style={{ width: '300px' }}>
						Name
					</TableColumn>
					<TableColumn id="size" style={{ width: '100px' }}>
						Size
					</TableColumn>
					<TableColumn id="email" style={{ width: '200px' }}>
						Email
					</TableColumn>
					<TableColumn id="sidesheet" style={{ width: '50px' }}>
						Open in sidesheet
					</TableColumn>
					<TableColumn id="actions" style={{ width: '50px' }}>
						Actions
					</TableColumn>
				</TableHeader>
				<TableBody items={props.data ?? []}>
					{(item) => (
						<TableRow
							href={`/projects/${params.projectUuid}/folders/${params.folderUuid}/files/${item.pk}`}
							id={item.pk}
						>
							<TableCell style={{ width: '300px' }} textValue={item.display_name ?? 'Empty dataset'}>
								<Link
									className={buttonStyles({
										variant: 'unset',
										className:
											'group-hover:text-base-lavender-600 dark:group-hover:text-base-lavender-400 print:inline-flex',
									})}
									href={`/projects/${params.projectUuid}/folders/${params.folderUuid}/files/${item.pk}`}
								>
									<span className="max-w-[30ch] truncate">{item.display_name ?? 'Empty dataset'}</span>
								</Link>
							</TableCell>
							<TableCell style={{ width: '100px' }} textValue="Size">
								<div className="text-center">
									{convertDataRateLog(
										item?.latest_version?.version_file?.metadata?.find(
											(metadata) => metadata.custom_key === 'FILE_SIZE',
										)?.value as number | undefined,
									) ?? '...'}
								</div>
							</TableCell>
							<TableCell style={{ width: '200px' }} textValue={item.created_by.email}>
								<span className="text-base-sm text-base-neutral-600 dark:text-base-neutral-300 inline-flex h-full place-items-center gap-2">
									<Wand2Icon aria-hidden size={18} strokeWidth={1.5} /> {item.created_by.email}
								</span>
							</TableCell>
							<TableCell style={{ width: '50px' }} textValue="Open in sidesheet">
								<div className="flex place-content-end">
									<Button
										aria-label="Open sidesheet"
										className="rounded-full"
										onPress={() => handleOpenSidesheet(item)}
										variant="unset"
									>
										<InfoIcon aria-hidden size={18} strokeWidth={1.5} />
									</Button>
								</div>
							</TableCell>
							<TableCell style={{ width: '50px' }} textValue="Actions">
								<div className="flex place-content-end">
									<ProjectFolderFilesMoreMenu
										fileUuid={item.pk}
										folderUuid={params.folderUuid}
										projectUuid={params.projectUuid}
										versionUuid={item.latest_version?.pk}
									/>
								</div>
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>
		</div>
	);
}
