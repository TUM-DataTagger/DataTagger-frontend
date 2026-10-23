'use client';

import { useQuery } from '@tanstack/react-query';
import { ExperimentLinks } from '@/components/elabftw/ExperimentLinks';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { $api } from '@/util/clientFetch';

export function FileExperimentLinks(props: { readonly fileUuid: string; readonly folderUuid: string }) {
	const { currentUserData } = useCurrentUser();

	const { data: folderPermissionData } = useQuery(
		$api.queryOptions('get', '/api/v1/folder-permission/', {
			params: { query: { folder: props.folderUuid, project_membership__member: currentUserData?.pk ?? -1 } },
		}),
	);

	const canEdit = Boolean(folderPermissionData?.[0]?.is_folder_admin || folderPermissionData?.[0]?.can_edit);

	return <ExperimentLinks canEdit={canEdit} targetId={props.fileUuid} targetType="dataset" />;
}
