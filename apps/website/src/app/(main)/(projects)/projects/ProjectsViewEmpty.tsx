'use client';

import Link from 'next/link';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { cx } from '@/styles/cva';
import { buttonStyles } from '@/styles/ui/button';

export function ProjectsViewEmpty() {
	const { currentUserData } = useCurrentUser();

	const canCreateProjects = currentUserData?.can_create_projects;

	return (
		<div
			className={cx(
				'flex h-[272px] flex-col place-content-center rounded-xl p-px',
				canCreateProjects ? '' : 'h-[200px]',
			)}
		>
			<div className="bg-base-lavender-100/64 dark:bg-base-lavender-800/64 h-full w-full place-content-center place-items-center rounded-xl text-center">
				<div className="flex flex-col gap-2">
					<span className="text-base-xl">No projects yet</span>
					<div className="flex flex-col place-content-center place-items-center gap-8">
						Created projects will appear here.
						{canCreateProjects ? (
							<Link className={buttonStyles({ variant: 'filled' })} href="/projects/create/1">
								Create Project
							</Link>
						) : null}
					</div>
				</div>
			</div>
		</div>
	);
}
