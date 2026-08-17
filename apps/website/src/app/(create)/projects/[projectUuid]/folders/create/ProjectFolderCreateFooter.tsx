import { CreateRouteActionFooter } from '@/components/create-route/frame/CreateRouteActionFooter';
import { CancelButton } from './CancelButton';

export function ProjectFolderCreateFooter() {
	return (
		<CreateRouteActionFooter cancelButton={<CancelButton />} form="create-project-folder" submitLabel="Create folder" />
	);
}
