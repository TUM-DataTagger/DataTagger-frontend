'use client';

import { ProjectsEmptyState } from '@/components/projects/ProjectsEmptyState';
import { useCurrentUser } from '@/hooks/useCurrentUser';

export function ProjectsViewEmpty() {
	const { currentUserData } = useCurrentUser();

	const canCreateProjects = currentUserData?.can_create_projects;

	return (
		<ProjectsEmptyState
			canCreateProjects={canCreateProjects}
			createButtonLabel="Create Project"
			description="Created projects will appear here."
			title="No projects yet"
		/>
	);
}
