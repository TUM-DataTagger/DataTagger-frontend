import { EditRouteSaveFooter } from '@/components/edit-route/frame/EditRouteSaveFooter';
import { CancelButton } from '../CancelButton';

export function MetadataTemplateEditMetadataFieldsFooter(props: { readonly metadataTemplateContainerUuid: string }) {
	return (
		<EditRouteSaveFooter
			cancelButton={<CancelButton metadataTemplateContainerUuid={props.metadataTemplateContainerUuid} />}
			form="metadata-template-edit-metadata-fields"
		/>
	);
}
