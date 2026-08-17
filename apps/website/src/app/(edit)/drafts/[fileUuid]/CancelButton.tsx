'use client';

import { EditRouteCancelButton } from '@/components/edit-route/frame/EditRouteCancelButton';

export function CancelButton(props: { readonly fileUuid: string }) {
	return <EditRouteCancelButton href={`/drafts/${props.fileUuid}`} />;
}
