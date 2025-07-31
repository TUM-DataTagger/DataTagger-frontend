import { Button } from '@/components/ui/Button';
import { CancelButton } from './CancelButton';

export function ProjectFolderCreateFooter() {
	return (
		<div className="border-base-neutral-100 dark:border-base-neutral-700 flex h-[88px] place-content-end place-items-center border-t px-4 py-6 md:px-[132px]">
			<div className="flex gap-2">
				<CancelButton />
				<Button form="create-project-folder" type="submit" variant="filled">
					Create folder
				</Button>
			</div>
		</div>
	);
}
