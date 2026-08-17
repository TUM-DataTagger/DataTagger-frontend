'use client';

import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { $api } from '@/util/clientFetch';

export function useMetadataTemplatePermissions(props: { readonly metadataTemplateContainerUuid: string }) {
	const { currentUserData } = useCurrentUser();

	const { data: metadataTemplateContainerData } = useSuspenseQuery(
		$api.queryOptions('get', '/api/v1/metadata-template-container/{id}/', {
			params: { path: { id: props.metadataTemplateContainerUuid } },
		}),
	);

	const isAssignedToProject = metadataTemplateContainerData.assigned_to_content_type === 'projects.project';
	const isAssignedToFolder = metadataTemplateContainerData.assigned_to_content_type === 'folders.folder';

	const { data: projectPermissionData } = useQuery(
		$api.queryOptions(
			'get',
			'/api/v1/project-membership/',
			{
				params: {
					query: { project: metadataTemplateContainerData.assigned_to_object_id!, member: currentUserData?.pk ?? -1 },
				},
			},
			{ enabled: Boolean(currentUserData?.pk && isAssignedToProject) },
		),
	);

	const { data: folderPermissionData } = useQuery(
		$api.queryOptions(
			'get',
			'/api/v1/folder-permission/',
			{
				params: {
					query: {
						folder: metadataTemplateContainerData.assigned_to_object_id!,
						project_membership__member: currentUserData?.pk ?? -1,
					},
				},
			},
			{ enabled: Boolean(currentUserData?.pk && isAssignedToFolder) },
		),
	);

	const isProjectMetadataTemplateAdmin = Boolean(
		projectPermissionData?.[0]?.is_project_admin || projectPermissionData?.[0]?.is_metadata_template_admin,
	);

	const isFolderAdmin = Boolean(folderPermissionData?.[0]?.is_folder_admin);

	const isGlobalMetadataTemplateAdmin = currentUserData?.is_global_metadata_template_admin;

	return {
		isProjectMetadataTemplateAdmin: isAssignedToProject && isProjectMetadataTemplateAdmin,
		isFolderAdmin: isAssignedToFolder && isFolderAdmin,
		isGlobalMetadataTemplateAdmin,
	};
}
