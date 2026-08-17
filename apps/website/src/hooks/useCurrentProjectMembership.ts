'use client';

import { useQuery } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { $api } from '@/util/clientFetch';

type UseCurrentProjectMembershipOptions = {
	readonly enabled?: boolean;
};

export function useCurrentProjectMembership(projectUuid: string, options: UseCurrentProjectMembershipOptions = {}) {
	const { currentUserData } = useCurrentUser();
	const isEnabled = Boolean(currentUserData?.pk) && (options.enabled ?? true);

	const query = useQuery(
		$api.queryOptions(
			'get',
			'/api/v1/project-membership/',
			{
				params: { query: { project: projectUuid, member: currentUserData?.pk ?? -1 } },
			},
			{ enabled: isEnabled },
		),
	);

	const membership = query.data?.[0];

	return {
		query,
		membership,
		isProjectAdmin: Boolean(membership?.is_project_admin),
		canCreateFolders: Boolean(membership?.can_create_folders),
		isMetadataTemplateAdmin: Boolean(membership?.is_metadata_template_admin),
	};
}
