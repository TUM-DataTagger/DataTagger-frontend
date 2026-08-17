import { MetadataTemplateCreateCancelButton } from '@/components/metadata-template/create/MetadataTemplateCreateCancelButton';
import { Button } from '@/components/ui/Button';

type MetadataTemplateCreateFooterProps = {
	readonly href: string;
};

export function MetadataTemplateCreateFooter({ href }: MetadataTemplateCreateFooterProps) {
	return (
		<div className="flex h-[88px] place-content-end place-items-center border-t border-base-neutral-100 px-4 py-6 md:px-[132px] dark:border-base-neutral-700">
			<div className="flex gap-2">
				<MetadataTemplateCreateCancelButton href={href} />
				<Button form="create-metadata-template" type="submit" variant="filled">
					Create metadata template
				</Button>
			</div>
		</div>
	);
}
