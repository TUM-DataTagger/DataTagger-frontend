'use client';

import { useQuery } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { $api } from '@/util/clientFetch';

type UseCurrentFolderPermissionOptions = {
	readonly enabled?: boolean;
};

export function useCurrentFolderPermission(folderUuid: string, options: UseCurrentFolderPermissionOptions = {}) {
	const { currentUserData } = useCurrentUser();
	const isEnabled = Boolean(currentUserData?.pk) && (options.enabled ?? true);

	const query = useQuery(
		$api.queryOptions(
			'get',
			'/api/v1/folder-permission/',
			{
				params: { query: { folder: folderUuid, project_membership__member: currentUserData?.pk ?? -1 } },
			},
			{ enabled: isEnabled },
		),
	);

	const permission = query.data?.[0];
	const isFolderAdmin = Boolean(permission?.is_folder_admin);
	const canEditFolder = isFolderAdmin || Boolean(permission?.can_edit);

	return {
		query,
		permission,
		isFolderAdmin,
		canEditFolder,
		canUploadFiles: canEditFolder,
		isFolderMetadataTemplateAdmin: isFolderAdmin || Boolean(permission?.is_metadata_template_admin),
	};
}
