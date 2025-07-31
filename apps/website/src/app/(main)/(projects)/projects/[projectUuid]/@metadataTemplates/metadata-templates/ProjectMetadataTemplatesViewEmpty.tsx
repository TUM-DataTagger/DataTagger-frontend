'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { buttonStyles } from '@/styles/ui/button';
import { $api } from '@/util/clientFetch';

export function ProjectMetadataTemplatesViewEmpty(props: { readonly projectUuid: string }) {
	const { currentUserData } = useCurrentUser();

	const { data: projectPermissionData } = useQuery(
		$api.queryOptions(
			'get',
			'/api/v1/project-membership/',
			{
				params: { query: { project: props.projectUuid, member: currentUserData?.pk ?? -1 } },
			},
			{ enabled: Boolean(currentUserData?.pk) },
		),
	);

	const canCreateMetadataTemplates = projectPermissionData?.[0]?.is_metadata_template_admin;

	return (
		<div className="bg-base-lavender-100/38 text-base-neutral-900 dark:bg-base-lavender-800/38 dark:text-base-neutral-40 flex h-[269px] flex-col place-content-center gap-8 rounded-2xl text-center">
			<div className="flex flex-col gap-2">
				<span className="text-base-xl">No metadata templates yet</span>
				<span>Created metadata templates will appear here.</span>
			</div>
			{canCreateMetadataTemplates ? (
				<Link
					className={buttonStyles({ variant: 'filled', className: 'place-self-center' })}
					href={`/projects/${props.projectUuid}/metadata-templates/create`}
				>
					Create metadata template
				</Link>
			) : null}
		</div>
	);
}
