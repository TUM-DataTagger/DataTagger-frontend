'use client';

import { useState } from 'react';
import { FolderEditLockDialog } from '@/components/Folder';
import { ProjectFolderEdit } from '../../ProjectFolderEdit';

export function ProjectFolderPermissionsMenu(props: { readonly folderUuid: string; readonly projectUuid: string }) {
	const [isEditLockOpen, setIsEditLockOpen] = useState(false);

	return (
		<>
			<ProjectFolderEdit
				folderUuid={props.folderUuid}
				href={`/projects/${props.projectUuid}/folders/${props.folderUuid}/permissions/edit`}
				onClick={(isLocked) => setIsEditLockOpen(Boolean(isLocked))}
			/>
			<FolderEditLockDialog folderUuid={props.folderUuid} isOpen={isEditLockOpen} onOpenChange={setIsEditLockOpen} />
		</>
	);
}
