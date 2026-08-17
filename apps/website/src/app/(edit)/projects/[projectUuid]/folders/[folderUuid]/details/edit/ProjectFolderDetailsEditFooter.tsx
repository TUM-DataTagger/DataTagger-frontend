import { EditRouteSaveFooter } from '@/components/edit-route/frame/EditRouteSaveFooter';
import { CancelButton } from './CancelButton';

export function ProjectFolderDetailsEditFooter(props: { readonly folderUuid: string; readonly projectUuid: string }) {
	return (
		<EditRouteSaveFooter
			cancelButton={<CancelButton folderUuid={props.folderUuid} projectUuid={props.projectUuid} />}
			form="project-folder-details-edit"
		/>
	);
}
