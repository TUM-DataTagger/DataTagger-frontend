import { Button } from '@/components/ui/Button';
import { CancelButton } from '../CancelButton';

export function ProjectFolderFileEditMetadataFooter(props: {
	readonly fileUuid: string;
	readonly folderUuid: string;
	readonly projectUuid: string;
}) {
	return (
		<div className="border-base-neutral-100 dark:border-base-neutral-700 flex h-[88px] place-content-end place-items-center border-t px-4 py-6 md:px-[132px]">
			<div className="flex gap-2">
				<CancelButton fileUuid={props.fileUuid} folderUuid={props.folderUuid} projectUuid={props.projectUuid} />
				<Button form="project-folder-file-edit-metadata" type="submit" variant="filled">
					Save changes
				</Button>
			</div>
		</div>
	);
}
