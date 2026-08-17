'use client';

import Link from 'next/link';
import { cx } from '@/styles/cva';
import { buttonStyles } from '@/styles/ui/button';

type ProjectsEmptyStateProps = {
	readonly canCreateProjects?: boolean;
	readonly createButtonLabel?: string;
	readonly createHref?: string;
	readonly description: string;
	readonly title: string;
};

export function ProjectsEmptyState({
	canCreateProjects = false,
	createButtonLabel = 'Create Project',
	createHref = '/projects/create/1',
	description,
	title,
}: ProjectsEmptyStateProps) {
	return (
		<div
			className={cx(
				'flex h-[272px] flex-col place-content-center rounded-xl p-px',
				canCreateProjects ? '' : 'h-[200px]',
			)}
		>
			<div className="h-full w-full place-content-center place-items-center rounded-xl bg-base-lavender-100/64 p-4 text-center dark:bg-base-lavender-800/64">
				<div className="flex flex-col gap-2">
					<span className="text-base-xl">{title}</span>
					<div className="flex flex-col place-content-center place-items-center gap-8">
						{description}
						{canCreateProjects ? (
							<Link className={buttonStyles({ variant: 'filled' })} href={createHref}>
								{createButtonLabel}
							</Link>
						) : null}
					</div>
				</div>
			</div>
		</div>
	);
}
