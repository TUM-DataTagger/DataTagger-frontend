import type { ReactNode } from 'react';
import { Button } from '@/components/ui/Button';

type EditRouteSaveFooterProps = {
	readonly cancelButton: ReactNode;
	readonly form: string;
	readonly submitLabel?: string;
};

export function EditRouteSaveFooter({ cancelButton, form, submitLabel = 'Save changes' }: EditRouteSaveFooterProps) {
	return (
		<div className="flex h-[88px] place-content-end place-items-center border-t border-base-neutral-100 px-4 py-6 md:px-[132px] dark:border-base-neutral-700">
			<div className="flex gap-2">
				{cancelButton}
				<Button form={form} type="submit" variant="filled">
					{submitLabel}
				</Button>
			</div>
		</div>
	);
}
