'use client';

import { EditRouteCloseButton } from '@/components/edit-route/frame/EditRouteCloseButton';

export function CloseButton(props: { readonly metadataTemplateContainerUuid: string }) {
	return <EditRouteCloseButton href={`/metadata-templates/${props.metadataTemplateContainerUuid}`} />;
}
