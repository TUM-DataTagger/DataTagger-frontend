'use client';

import { useState } from 'react';
import { ProjectEditLockDialog } from '@/components/Project';
import { ProjectEdit } from '../../ProjectEdit';

export function ProjectMembersMenu(props: { readonly projectUuid: string }) {
	const [isEditLockOpen, setIsEditLockOpen] = useState(false);

	return (
		<>
			<ProjectEdit
				href={`/projects/${props.projectUuid}/members/edit`}
				onClick={(isLocked) => setIsEditLockOpen(isLocked as boolean)}
				projectUuid={props.projectUuid}
			/>
			<ProjectEditLockDialog isOpen={isEditLockOpen} onOpenChange={setIsEditLockOpen} projectUuid={props.projectUuid} />
		</>
	);
}
