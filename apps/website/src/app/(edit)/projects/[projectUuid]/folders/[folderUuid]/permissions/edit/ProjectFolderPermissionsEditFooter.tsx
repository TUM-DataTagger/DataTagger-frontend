import { Button } from '@/components/ui/Button';
import { CancelButton } from './CancelButton';

export function ProjectFolderPermissionsEditFooter(props: { readonly folderUuid: string }) {
	return (
		<div className="border-base-neutral-100 dark:border-base-neutral-700 flex h-[88px] place-content-end place-items-center border-t px-4 py-6 md:px-[132px]">
			<div className="flex gap-2">
				<CancelButton folderUuid={props.folderUuid} />
				<Button form="project-folder-permissions-edit" type="submit" variant="filled">
					Save changes
				</Button>
			</div>
		</div>
	);
}
