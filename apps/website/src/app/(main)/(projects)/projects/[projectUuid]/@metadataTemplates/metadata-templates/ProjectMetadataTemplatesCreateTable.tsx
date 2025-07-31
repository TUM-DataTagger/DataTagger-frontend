'use client';

import { useQuery } from '@tanstack/react-query';
import type { VariantProps } from 'cva';
import { PlusIcon } from 'lucide-react';
import Link from 'next/link';
import type { PropsWithChildren } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { cx } from '@/styles/cva';
import { buttonStyles } from '@/styles/ui/button';
import { $api } from '@/util/clientFetch';

export function ProjectMetadataTemplatesCreateTable({
	variant = 'unset',
	...props
}: PropsWithChildren<
	VariantProps<typeof buttonStyles> & {
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

	const isMetadataTemplateAdmin = projectPermissionData?.[0]?.is_metadata_template_admin;

	return isMetadataTemplateAdmin ? (
		<Link
			className={buttonStyles({ variant, className: cx('group place-content-start gap-4 p-4', props.className) })}
			href={props.href}
		>
			<span className="bg-base-lavender-300 group-active:bg-base-lavender-600 group-active:text-base-neutral-40 group-hover:bg-base-lavender-500 dark:bg-base-lavender-700 dark:text-base-neutral-40 dark:group-active:bg-base-lavender-400 dark:group-hover:bg-base-lavender-500 dark:group-hover:text-base-neutral-900 flex h-10 w-10 place-content-center place-items-center rounded-full p-2">
				<PlusIcon aria-hidden size={18} strokeWidth={1.5} />
			</span>
			<span className="text-base-label-md group-hover:text-base-lavender-600 dark:group-hover:text-base-lavender-400">
				Create metadata template
			</span>
		</Link>
	) : null;
}
