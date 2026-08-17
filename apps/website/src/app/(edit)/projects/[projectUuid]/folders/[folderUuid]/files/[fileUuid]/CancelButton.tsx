'use client';

import { EditRouteCancelButton } from '@/components/edit-route/frame/EditRouteCancelButton';
import { openAPIClient } from '@/util/clientFetch';

export function CancelButton(props: {
	readonly fileUuid: string;
	readonly folderUuid: string;
	readonly projectUuid: string;
}) {
	async function onBeforeNavigate() {
		await openAPIClient.POST('/api/v1/uploads-dataset/{id}/unlock/', {
			params: { path: { id: props.fileUuid } },
		});
	}

	return (
		<EditRouteCancelButton
			href={`/projects/${props.projectUuid}/folders/${props.folderUuid}/files/${props.fileUuid}`}
			onBeforeNavigate={onBeforeNavigate}
		/>
	);
}
