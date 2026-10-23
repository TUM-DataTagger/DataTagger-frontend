'use client';

import { FolderArchiveIcon } from 'lucide-react';
import { useState } from 'react';
import { ExportJobDialog } from '@/components/ExportJobDialog';
import { FolderEditLockDialog } from '@/components/Folder';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/Tooltip';
import { EXPORT_TYPES } from '@/util/exportJobs';
import { ProjectFolderEdit } from './ProjectFolderEdit';

export function ProjectFolderMenu(props: { readonly folderUuid: string; readonly projectUuid: string }) {
	const [isExportOpen, setIsExportOpen] = useState(false);
	const [isEditLockOpen, setIsEditLockOpen] = useState(false);

	return (
		<div className="flex place-items-center gap-2">
			<Tooltip delay={400}>
				<TooltipTrigger
					onPress={() => setIsExportOpen(true)}
					size="icon"
					variant="secondary-outline"
					aria-label="Export folder"
				>
					<FolderArchiveIcon aria-hidden data-slot="icon" size={18} strokeWidth={1.5} />
				</TooltipTrigger>
				<TooltipContent arrow={false}>Zip export</TooltipContent>
			</Tooltip>
			<ProjectFolderEdit
				folderUuid={props.folderUuid}
				href={`/projects/${props.projectUuid}/folders/${props.folderUuid}/details/edit`}
				onClick={(isLocked) => setIsEditLockOpen(Boolean(isLocked))}
			/>
			<ExportJobDialog
				description="Export available data from this folder to a zip file. Without metadata, the zip keeps the original subfolder structure."
				exportType={EXPORT_TYPES.Folder}
				isOpen={isExportOpen}
				onOpenChange={setIsExportOpen}
				title="Export folder"
				uuids={[props.folderUuid]}
			/>
			<FolderEditLockDialog folderUuid={props.folderUuid} isOpen={isEditLockOpen} onOpenChange={setIsEditLockOpen} />
		</div>
	);
}
