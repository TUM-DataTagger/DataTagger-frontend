'use client';

import { EditRouteCancelButton } from '@/components/edit-route/frame/EditRouteCancelButton';
import { openAPIClient } from '@/util/clientFetch';

export function CancelButton(props: { readonly folderUuid: string; readonly projectUuid: string }) {
	async function onBeforeNavigate() {
		await openAPIClient.POST('/api/v1/folder/{id}/unlock/', {
			params: { path: { id: props.folderUuid } },
		});
	}

	return (
		<EditRouteCancelButton
			href={`/projects/${props.projectUuid}/folders/${props.folderUuid}/files`}
			onBeforeNavigate={onBeforeNavigate}
		/>
	);
}
