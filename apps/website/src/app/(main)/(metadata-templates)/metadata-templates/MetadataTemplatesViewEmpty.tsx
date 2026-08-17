'use client';

import Link from 'next/link';
import { MetadataTemplateImportButton } from '@/components/metadata-template/MetadataTemplateImportDialog';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { cx } from '@/styles/cva';
import { buttonStyles } from '@/styles/ui/button';

export function MetadataTemplatesViewEmpty() {
	const { currentUserData } = useCurrentUser();

	const canCreateMetadataTemplates = currentUserData?.is_global_metadata_template_admin;

	return (
		<div
			className={cx(
				'flex h-[272px] flex-col place-content-center rounded-xl p-px',
				canCreateMetadataTemplates ? '' : 'h-[200px]',
			)}
		>
			<div className="h-full w-full place-content-center place-items-center rounded-xl bg-base-lavender-100/64 p-4 text-center dark:bg-base-lavender-800/64">
				<div className="flex flex-col gap-2">
					<span className="text-base-xl">No metadata templates yet</span>
					<div className="flex flex-col place-content-center place-items-center gap-8">
						<span>Created metadata templates will appear here.</span>
						{canCreateMetadataTemplates ? (
							<div className="flex place-content-center gap-2">
								<Link className={buttonStyles({ variant: 'filled' })} href="/metadata-templates/create">
									Create metadata template
								</Link>
								<MetadataTemplateImportButton scope={{ kind: 'global' }} variant="secondary-filled" />
							</div>
						) : null}
					</div>
				</div>
			</div>
		</div>
	);
}
