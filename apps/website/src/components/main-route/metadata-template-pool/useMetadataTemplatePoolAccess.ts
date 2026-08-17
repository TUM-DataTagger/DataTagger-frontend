'use client';

import { useCurrentFolderPermission } from '@/hooks/useCurrentFolderPermission';
import { useCurrentProjectMembership } from '@/hooks/useCurrentProjectMembership';
import type { MetadataTemplatePoolScope } from './MetadataTemplatePoolScope';

export type MetadataTemplatePoolAccess = {
	readonly addButtonLabel: 'Add' | 'View all';
	readonly canAddToPool: true;
	readonly canCreate: boolean;
	readonly isAssignDialogReadOnly: boolean;
};

export function useMetadataTemplatePoolAccess(scope: MetadataTemplatePoolScope) {
	const projectMembership = useCurrentProjectMembership(scope.projectUuid);
	const folderPermission = useCurrentFolderPermission(scope.kind === 'folder' ? scope.folderUuid : '', {
		enabled: scope.kind === 'folder',
	});

	const isProjectAdmin = projectMembership.isProjectAdmin;
	const isProjectMetadataTemplateAdmin = projectMembership.isMetadataTemplateAdmin;
	const isFolderAdmin = scope.kind === 'folder' ? folderPermission.isFolderAdmin : false;
	const isFolderMetadataTemplateAdmin =
		scope.kind === 'folder' ? folderPermission.isFolderMetadataTemplateAdmin : false;
	const isProjectOrFolderAdmin = isProjectAdmin || isFolderAdmin;

	const access: MetadataTemplatePoolAccess =
		scope.kind === 'project'
			? {
					addButtonLabel: isProjectAdmin ? 'Add' : 'View all',
					canAddToPool: true,
					canCreate: isProjectAdmin || isProjectMetadataTemplateAdmin,
					isAssignDialogReadOnly: !isProjectAdmin,
				}
			: {
					addButtonLabel: isProjectOrFolderAdmin ? 'Add' : 'View all',
					canAddToPool: true,
					canCreate: isProjectOrFolderAdmin || isFolderMetadataTemplateAdmin,
					isAssignDialogReadOnly: !isProjectOrFolderAdmin,
				};

	return {
		access,
		projectMembership,
		folderPermission,
		isProjectAdmin,
		isProjectMetadataTemplateAdmin,
		isFolderAdmin,
		isFolderMetadataTemplateAdmin,
		isProjectOrFolderAdmin,
	};
}
