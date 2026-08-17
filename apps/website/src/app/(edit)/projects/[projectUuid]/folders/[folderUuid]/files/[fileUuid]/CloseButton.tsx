'use client';

import { EditRouteCloseButton } from '@/components/edit-route/frame/EditRouteCloseButton';
import { openAPIClient } from '@/util/clientFetch';

export function CloseButton(props: {
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
		<EditRouteCloseButton
			href={`/projects/${props.projectUuid}/folders/${props.folderUuid}/files/${props.fileUuid}`}
			onBeforeNavigate={onBeforeNavigate}
		/>
	);
}
