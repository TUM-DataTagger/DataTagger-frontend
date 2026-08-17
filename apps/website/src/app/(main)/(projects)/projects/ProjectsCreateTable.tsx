'use client';

import type { VariantProps } from 'cva';
import { PlusIcon } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import type { PropsWithChildren } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { cx } from '@/styles/cva';
import { buttonStyles } from '@/styles/ui/button';

export function ProjectsCreateTable({
	variant = 'unset',
	...props
}: PropsWithChildren<
	VariantProps<typeof buttonStyles> & {
		readonly className?: string | undefined;
		readonly href: Route;
	}
>) {
	const { currentUserData } = useCurrentUser();

	const canCreateProjects = currentUserData?.can_create_projects;

	return canCreateProjects ? (
		<Link
			className={buttonStyles({
				variant,
				className: cx('group place-content-start gap-4 p-4', props.className),
			})}
			href={props.href}
		>
			<span className="flex h-10 w-10 place-content-center place-items-center rounded-full bg-base-lavender-300 p-2 group-hover:bg-base-lavender-500 group-active:bg-base-lavender-600 group-active:text-base-neutral-40 dark:bg-base-lavender-700 dark:text-base-neutral-40 dark:group-hover:bg-base-lavender-500 dark:group-hover:text-base-neutral-900 dark:group-active:bg-base-lavender-400">
				<PlusIcon aria-hidden size={18} strokeWidth={1.5} />
			</span>
			<span className="text-base-label-md group-hover:text-base-lavender-600 dark:group-hover:text-base-lavender-400">
				Create project
			</span>
		</Link>
	) : null;
}
