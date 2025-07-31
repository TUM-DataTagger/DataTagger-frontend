'use client';

import { useQuery } from '@tanstack/react-query';
import type { VariantProps } from 'cva';
import { PlusIcon } from 'lucide-react';
import type { PropsWithChildren } from 'react';
import { GridListItem } from '@/components/ui/GridList';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { cx } from '@/styles/cva';
import { gridCardStyles } from '@/styles/ui/gridCard';
import { $api } from '@/util/clientFetch';

export function ProjectMetadataTemplatesCreateGrid({
	variant = 'secondary-filled',
	...props
}: PropsWithChildren<
	VariantProps<typeof gridCardStyles> & {
		readonly className?: string | undefined;
		readonly href: string;
		readonly projectUuid: string;
	}
>) {
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

	const isMetadataTemplateAdmin =
		projectPermissionData?.[0]?.is_project_admin || projectPermissionData?.[0]?.is_metadata_template_admin;

	return isMetadataTemplateAdmin ? (
		<GridListItem aria-label="Create metadata template" className="rounded-xl" href={props.href}>
			<div
				className={gridCardStyles({
					variant,
					className: cx(
						'relative h-[150px] w-full min-w-64 cursor-pointer flex-row place-content-center place-items-center gap-2 border-transparent md:w-auto dark:border-transparent',
						props.className,
					),
				})}
			>
				<PlusIcon aria-hidden size={18} strokeWidth={1.5} />
				{props.children}
			</div>
		</GridListItem>
	) : null;
}
