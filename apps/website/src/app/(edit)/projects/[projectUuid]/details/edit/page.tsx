import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { openAPIClient } from '@/util/fetch';
import { ProjectDetailsEditFooter } from './ProjectDetailsEditFooter';
import { ProjectDetailsEditForm } from './ProjectDetailsEditForm';

export const metadata: Metadata = {
	title: 'Edit project details',
};

export default async function Page({ params }: { readonly params: Promise<{ readonly projectUuid: string }> }) {
	const { projectUuid } = await params;

	const { data: projectData, error } = await openAPIClient.GET('/api/v1/project/{id}/', {
		params: { path: { id: projectUuid } },
	});

	if (!projectData || error) {
		notFound();
	}

	return (
		<>
			<div className="mx-auto flex w-full max-w-[536px] grow flex-col gap-4 px-4 py-12 md:px-0">
				<ProjectDetailsEditForm data={projectData} projectUuid={projectUuid} />
			</div>
			<ProjectDetailsEditFooter projectUuid={projectUuid} />
		</>
	);
}
