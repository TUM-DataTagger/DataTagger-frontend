import { Button } from '@/components/ui/Button';
import { CancelButton } from '../CancelButton';

export function DraftFileEditMetadataFooter(props: { readonly fileUuid: string }) {
	return (
		<div className="'flex border-base-neutral-100 dark:border-base-neutral-700 h-[88px] place-items-end border-t px-4 py-6 md:px-[132px]">
			<div className="flex gap-2">
				<CancelButton fileUuid={props.fileUuid} />
				<Button form="draft-file-edit-metadata" type="submit" variant="filled">
					Save changes
				</Button>
			</div>
		</div>
	);
}
