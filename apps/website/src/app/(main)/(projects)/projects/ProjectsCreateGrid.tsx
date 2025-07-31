'use client';

import type { VariantProps } from 'cva';
import { PlusIcon } from 'lucide-react';
import type { PropsWithChildren } from 'react';
import { GridListItem } from '@/components/ui/GridList';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { cx } from '@/styles/cva';
import { gridCardStyles } from '@/styles/ui/gridCard';

export function ProjectsCreateGrid({
	variant = 'secondary-filled',
	...props
}: PropsWithChildren<
	VariantProps<typeof gridCardStyles> & {
		readonly className?: string | undefined;
		readonly href: string;
	}
>) {
	const { currentUserData } = useCurrentUser();

	const canCreateProjects = currentUserData?.can_create_projects;

	return canCreateProjects ? (
		<GridListItem aria-label="Create project" className="rounded-xl print:hidden" href={props.href}>
			<div
				className={gridCardStyles({
					variant,
					className: cx(
						'relative h-[132px] w-full min-w-64 cursor-pointer flex-row place-content-center place-items-center gap-2 border-transparent md:w-auto dark:border-transparent',
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
