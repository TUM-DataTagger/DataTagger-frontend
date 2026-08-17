'use client';

import { EditRouteCloseButton } from '@/components/edit-route/frame/EditRouteCloseButton';

export function CloseButton(props: { readonly fileUuid: string }) {
	return <EditRouteCloseButton href={`/drafts/${props.fileUuid}`} />;
}
