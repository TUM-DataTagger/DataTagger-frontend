import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { openAPIClient } from '@/util/fetch';
import { ProjectMembersEditFooter } from './ProjectMembersEditFooter';
import { ProjectMembersEditForm } from './ProjectMembersEditForm';

export const metadata: Metadata = {
	title: 'Edit project members',
};

export default async function Page({ params }: { readonly params: Promise<{ readonly projectUuid: string }> }) {
	const { projectUuid } = await params;

	const { data: projectData } = await openAPIClient.GET('/api/v1/project/{id}/', {
		params: { path: { id: projectUuid } },
	});

	const { data: projectPermissionData, error } = await openAPIClient.GET('/api/v1/project-membership/', {
		params: { query: { project: projectUuid } },
	});

	if (!projectData || !projectPermissionData || error) {
		notFound();
	}

	return (
		<>
			<div className="mx-auto flex w-full max-w-[536px] grow flex-col gap-4 px-4 py-12 md:px-0">
				<span className="text-base-sm text-base-neutral-600 dark:text-base-neutral-300">
					Project: {projectData?.name}
				</span>
				<div className="border-base-crystal-300 bg-base-crystal-100/48 text-base-md dark:border-base-crystal-500 dark:bg-base-crystal-500/48 rounded-sm border px-4 py-3">
					Changing the permission "Project admin" is only possible if at least one other member is a TUM member and
					holds this permission.
				</div>
				<ProjectMembersEditForm data={projectPermissionData} projectUuid={projectUuid} />
			</div>
			<ProjectMembersEditFooter projectUuid={projectUuid} />
		</>
	);
}
