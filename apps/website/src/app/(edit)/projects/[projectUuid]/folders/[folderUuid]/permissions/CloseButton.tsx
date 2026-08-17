'use client';

import { EditRouteCloseButton } from '@/components/edit-route/frame/EditRouteCloseButton';
import { openAPIClient } from '@/util/clientFetch';

export function CloseButton(props: { readonly folderUuid: string }) {
	async function onBeforeNavigate() {
		await openAPIClient.POST('/api/v1/folder/{id}/unlock/', {
			params: { path: { id: props.folderUuid } },
		});
	}

	return <EditRouteCloseButton href="../permissions" onBeforeNavigate={onBeforeNavigate} />;
}
