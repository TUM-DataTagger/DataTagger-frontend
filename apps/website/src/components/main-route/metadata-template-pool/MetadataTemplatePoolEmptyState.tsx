'use client';

import { BlocksIcon, PlusIcon } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import {
	MetadataTemplateContainerAssignToPoolDialog,
	MetadataTemplateContainerBrowsePoolDialog,
} from '@/components/metadata-template/MetadataTemplateContainer';
import { MetadataTemplateImportButton } from '@/components/metadata-template/MetadataTemplateImportDialog';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { buttonStyles } from '@/styles/ui/button';
import type { MetadataTemplatePoolScope } from './MetadataTemplatePoolScope';
import { useMetadataTemplatePoolAccess } from './useMetadataTemplatePoolAccess';

type MetadataTemplatePoolEmptyStateProps = {
	readonly scope: MetadataTemplatePoolScope;
};

function getCreateHref(scope: MetadataTemplatePoolScope) {
	return scope.kind === 'folder'
		? `/projects/${scope.projectUuid}/folders/${scope.folderUuid}/metadata-templates/create`
		: `/projects/${scope.projectUuid}/metadata-templates/create`;
}

export function MetadataTemplatePoolEmptyState({ scope }: MetadataTemplatePoolEmptyStateProps) {
	const [isOpen, setIsOpen] = useState(false);
	const { access } = useMetadataTemplatePoolAccess(scope);

	return (
		<div className="flex h-[269px] flex-col place-content-center gap-8 rounded-2xl bg-base-lavender-100/38 text-center text-base-neutral-900 dark:bg-base-lavender-800/38 dark:text-base-neutral-40">
			<div className="flex flex-col gap-2">
				<span className="text-base-xl">No metadata templates added to pool yet</span>
				<span>Metadata templates added to the pool will appear here.</span>
			</div>
			<div className="flex place-content-center gap-2">
				{access.canCreate ? (
					<Link
						className={buttonStyles({ variant: 'filled', className: 'place-self-center' })}
						href={getCreateHref(scope)}
					>
						<PlusIcon aria-hidden size={18} strokeWidth={1.5} />
						Create
					</Link>
				) : null}
				{access.canCreate ? <MetadataTemplateImportButton scope={scope} variant="secondary-filled" /> : null}
				<Modal isOpen={isOpen} onOpenChange={setIsOpen}>
					<Button variant="filled">
						<BlocksIcon aria-hidden size={18} strokeWidth={1.5} />
						{access.addButtonLabel}
					</Button>
					{access.isAssignDialogReadOnly ? (
						<MetadataTemplateContainerBrowsePoolDialog
							folderUuid={scope.kind === 'folder' ? scope.folderUuid : undefined}
							isOpen={isOpen}
							onOpenChange={setIsOpen}
							projectUuid={scope.projectUuid}
						/>
					) : (
						<MetadataTemplateContainerAssignToPoolDialog
							folderUuid={scope.kind === 'folder' ? scope.folderUuid : undefined}
							isOpen={isOpen}
							onOpenChange={setIsOpen}
							projectUuid={scope.projectUuid}
						/>
					)}
				</Modal>
			</div>
		</div>
	);
}
