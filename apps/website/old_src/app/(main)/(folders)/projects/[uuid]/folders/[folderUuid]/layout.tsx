import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import type { PropsWithChildren, ReactNode } from 'react';
import { FolderDropZone } from '@/components/dropzone/FolderDropZone';
import { TabPanel } from '@/components/ui/Tab';
import { openAPIFetch } from '@/util/openapi-fetch';
import { TabsWrapper } from './TabsWrapper';

export default async function Layout({
	overview,
	members,
	files,
	params,
}: PropsWithChildren<{
	readonly files: ReactNode;
	readonly members: ReactNode;
	readonly overview: ReactNode;
	readonly params: Promise<{ readonly folderUuid: string; readonly projectUuid: string }>;
}>) {
	const { folderUuid, projectUuid } = await params;

	const { data: folderData, error } = await openAPIFetch.GET('/api/v1/folder/{id}/', {
		params: { path: { id: folderUuid } },
		headers: {
			authorization: `Bearer ${(await cookies()).get('token')?.value}`,
		},
		next: {
			tags: [folderUuid],
		},
	});

	if (error && (error as any).status_code === 404) {
		notFound();
	}

	return (
		<>
			<TabsWrapper
				uuid={projectUuid}
				folderUuid={folderUuid}
				membersCount={folderData?.members_count}
				filesCount={folderData?.datasets_count}
			>
				<div className="mx-auto max-w-[852px] px-4 py-12">
					<TabPanel id="overview">{overview}</TabPanel>
					<TabPanel id="members">{members}</TabPanel>
					<TabPanel id="files">{files}</TabPanel>
				</div>
			</TabsWrapper>
			<FolderDropZone folder={folderData} />
		</>
	);
}
