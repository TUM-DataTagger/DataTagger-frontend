'use client';

import { useState } from 'react';
import { FolderEditLockDialog } from '@/components/Folder';
import { ProjectFolderEdit } from '../../ProjectFolderEdit';

export function ProjectFolderDetailsMenu(props: { readonly folderUuid: string; readonly projectUuid: string }) {
	const [isEditLockOpen, setIsEditLockOpen] = useState(false);

	return (
		<>
			<ProjectFolderEdit
				folderUuid={props.folderUuid}
				href={`/projects/${props.projectUuid}/folders/${props.folderUuid}/details/edit`}
				onClick={(isLocked) => setIsEditLockOpen(isLocked as boolean)}
			/>
			<FolderEditLockDialog folderUuid={props.folderUuid} isOpen={isEditLockOpen} onOpenChange={setIsEditLockOpen} />
		</>
	);
}
