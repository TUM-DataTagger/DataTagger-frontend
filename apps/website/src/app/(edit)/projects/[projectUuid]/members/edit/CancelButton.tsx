'use client';

import { EditRouteCancelButton } from '@/components/edit-route/frame/EditRouteCancelButton';
import { openAPIClient } from '@/util/clientFetch';

export function CancelButton(props: { readonly projectUuid: string }) {
	async function onBeforeNavigate() {
		await openAPIClient.POST('/api/v1/project/{id}/unlock/', {
			params: { path: { id: props.projectUuid } },
		});
	}

	return <EditRouteCancelButton href="../members" onBeforeNavigate={onBeforeNavigate} />;
}
