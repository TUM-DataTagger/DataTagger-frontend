import { EditRouteSaveFooter } from '@/components/edit-route/frame/EditRouteSaveFooter';
import { CancelButton } from '../CancelButton';

export function DraftFileEditMetadataFooter(props: { readonly fileUuid: string }) {
	return (
		<EditRouteSaveFooter cancelButton={<CancelButton fileUuid={props.fileUuid} />} form="draft-file-edit-metadata" />
	);
}
