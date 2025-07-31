import { notFound } from 'next/navigation';
import { openAPIClient } from '@/util/fetch';
import { ProjectFolderCreateFooter } from './ProjectFolderCreateFooter';
import { ProjectFolderCreateForm } from './ProjectFolderCreateForm';
import { ProjectFolderCreateHeader } from './ProjectFolderCreateHeader';

export default async function Page({ params }: { readonly params: Promise<{ readonly projectUuid: string }> }) {
	const { projectUuid } = await params;

	const { data: projectMembershipData, error } = await openAPIClient.GET('/api/v1/project-membership/', {
		params: { query: { project: projectUuid } },
	});

	if (!projectMembershipData || error) {
		notFound();
	}

	return (
		<>
			<ProjectFolderCreateHeader>
				<h1 className="text-base-heading-md dark:text-base-neutral-40 text-center">Set up your first folder</h1>
				<p className="text-base-md text-base-neutral-600 dark:text-base-neutral-300 max-w-[536px] place-self-center text-center">
					Create a folder within a project to centrally manage your research data and give access to selected members of
					your project.
				</p>
			</ProjectFolderCreateHeader>
			<div className="mx-auto flex w-full max-w-[536px] grow flex-col gap-4 px-4 py-12 md:px-0">
				<ProjectFolderCreateForm data={projectMembershipData} projectUuid={projectUuid} />
			</div>
			<ProjectFolderCreateFooter />
		</>
	);
}
