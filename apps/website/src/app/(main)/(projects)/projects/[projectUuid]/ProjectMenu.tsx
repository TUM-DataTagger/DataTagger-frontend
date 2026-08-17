'use client';

import { FolderArchiveIcon } from 'lucide-react';
import { useState } from 'react';
import { ExportJobDialog } from '@/components/ExportJobDialog';
import { ProjectEditLockDialog } from '@/components/Project';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/Tooltip';
import { EXPORT_TYPES } from '@/util/exportJobs';
import { ProjectEdit } from './ProjectEdit';

export function ProjectMenu(props: { readonly projectUuid: string }) {
	const [isExportOpen, setIsExportOpen] = useState(false);
	const [isEditLockOpen, setIsEditLockOpen] = useState(false);

	return (
		<div className="flex place-items-center gap-2">
			<Tooltip delay={400}>
				<TooltipTrigger
					onPress={() => setIsExportOpen(true)}
					size="icon"
					variant="secondary-outline"
					aria-label="Export project"
				>
					<FolderArchiveIcon aria-hidden data-slot="icon" size={18} strokeWidth={1.5} />
				</TooltipTrigger>
				<TooltipContent arrow={false}>Zip export</TooltipContent>
			</Tooltip>
			<ProjectEdit
				href={`/projects/${props.projectUuid}/details/edit`}
				onClick={(isLocked) => setIsEditLockOpen(Boolean(isLocked))}
				projectUuid={props.projectUuid}
			/>
			<ExportJobDialog
				description="Export available data from this project to a zip file."
				exportType={EXPORT_TYPES.Project}
				isOpen={isExportOpen}
				onOpenChange={setIsExportOpen}
				title="Export project"
				uuids={[props.projectUuid]}
			/>
			<ProjectEditLockDialog isOpen={isEditLockOpen} onOpenChange={setIsEditLockOpen} projectUuid={props.projectUuid} />
		</div>
	);
}
