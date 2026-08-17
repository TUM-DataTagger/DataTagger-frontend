import { EditRouteSaveFooter } from '@/components/edit-route/frame/EditRouteSaveFooter';
import { CancelButton } from './CancelButton';

export function ProjectFolderPermissionsEditFooter(props: { readonly folderUuid: string }) {
	return (
		<EditRouteSaveFooter
			cancelButton={<CancelButton folderUuid={props.folderUuid} />}
			form="project-folder-permissions-edit"
		/>
	);
}
