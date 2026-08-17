'use client';

import { EditRouteCancelButton } from '@/components/edit-route/frame/EditRouteCancelButton';

export function CancelButton(props: { readonly metadataTemplateContainerUuid: string }) {
	return <EditRouteCancelButton href={`/metadata-templates/${props.metadataTemplateContainerUuid}`} />;
}
