import type { Metadata } from 'next';
import { openAPIClient } from '@/util/fetch';
import { ProjectMembersView } from './ProjectMembersView';

export const metadata: Metadata = {
	title: 'Project page | Members',
};

export default async function Page({ params }: { readonly params: Promise<{ readonly projectUuid: string }> }) {
	const { projectUuid } = await params;

	const { data: projectPermissionsData } = await openAPIClient.GET('/api/v1/project-membership/', {
		params: { query: { project: projectUuid, ordering: '-is_project_admin,member__email' } },
	});

	return (
		<div className="flex flex-col gap-6">
			<ProjectMembersView data={projectPermissionsData} projectUuid={projectUuid} />
		</div>
	);
}
