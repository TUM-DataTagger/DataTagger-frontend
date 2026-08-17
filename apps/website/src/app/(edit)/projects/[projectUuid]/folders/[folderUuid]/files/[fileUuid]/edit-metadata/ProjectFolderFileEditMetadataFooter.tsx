import { EditRouteSaveFooter } from '@/components/edit-route/frame/EditRouteSaveFooter';
import { CancelButton } from '../CancelButton';

export function ProjectFolderFileEditMetadataFooter(props: {
	readonly fileUuid: string;
	readonly folderUuid: string;
	readonly projectUuid: string;
}) {
	return (
		<EditRouteSaveFooter
			cancelButton={
				<CancelButton fileUuid={props.fileUuid} folderUuid={props.folderUuid} projectUuid={props.projectUuid} />
			}
			form="project-folder-file-edit-metadata"
		/>
	);
}
