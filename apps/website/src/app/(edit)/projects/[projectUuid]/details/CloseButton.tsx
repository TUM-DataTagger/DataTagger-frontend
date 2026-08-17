'use client';

import { EditRouteCloseButton } from '@/components/edit-route/frame/EditRouteCloseButton';
import { openAPIClient } from '@/util/clientFetch';

export function CloseButton(props: { readonly projectUuid: string }) {
	async function onBeforeNavigate() {
		await openAPIClient.POST('/api/v1/project/{id}/unlock/', {
			params: { path: { id: props.projectUuid } },
		});
	}

	return <EditRouteCloseButton href={`/projects/${props.projectUuid}/folders`} onBeforeNavigate={onBeforeNavigate} />;
}
