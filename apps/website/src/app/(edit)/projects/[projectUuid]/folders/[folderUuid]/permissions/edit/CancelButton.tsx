'use client';

import { EditRouteCancelButton } from '@/components/edit-route/frame/EditRouteCancelButton';
import { openAPIClient } from '@/util/clientFetch';

export function CancelButton(props: { readonly folderUuid: string }) {
	async function onBeforeNavigate() {
		await openAPIClient.POST('/api/v1/folder/{id}/unlock/', {
			params: { path: { id: props.folderUuid } },
		});
	}

	return <EditRouteCancelButton href="../permissions" onBeforeNavigate={onBeforeNavigate} />;
}
