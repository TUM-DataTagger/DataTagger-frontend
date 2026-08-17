import { EditRouteSaveFooter } from '@/components/edit-route/frame/EditRouteSaveFooter';
import { CancelButton } from './CancelButton';

export function ProjectDetailsEditFooter(props: { readonly projectUuid: string }) {
	return (
		<EditRouteSaveFooter cancelButton={<CancelButton projectUuid={props.projectUuid} />} form="project-details-edit" />
	);
}
