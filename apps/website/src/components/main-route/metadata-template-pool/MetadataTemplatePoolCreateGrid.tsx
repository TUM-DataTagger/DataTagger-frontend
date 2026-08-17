'use client';

import type { VariantProps } from 'cva';
import { BlocksIcon, PlusIcon } from 'lucide-react';
import Link from 'next/link';
import { useState, type PropsWithChildren } from 'react';
import {
	MetadataTemplateContainerAssignToPoolDialog,
	MetadataTemplateContainerBrowsePoolDialog,
} from '@/components/metadata-template/MetadataTemplateContainer';
import { Button } from '@/components/ui/Button';
import { GridListItem } from '@/components/ui/GridList';
import { Modal } from '@/components/ui/Modal';
import { cx } from '@/styles/cva';
import { gridCardStyles } from '@/styles/ui/gridCard';
import type { MetadataTemplatePoolScope } from './MetadataTemplatePoolScope';
import { useMetadataTemplatePoolAccess } from './useMetadataTemplatePoolAccess';

type MetadataTemplatePoolCreateGridProps = PropsWithChildren<
	VariantProps<typeof gridCardStyles> & {
		readonly className?: string | undefined;
		readonly href: string;
		readonly scope: MetadataTemplatePoolScope;
	}
>;

export function MetadataTemplatePoolCreateGrid({
	scope,
	variant = 'secondary-filled',
	...props
}: MetadataTemplatePoolCreateGridProps) {
	const [isOpen, setIsOpen] = useState(false);
	const { access, isProjectAdmin, isFolderMetadataTemplateAdmin } = useMetadataTemplatePoolAccess(scope);

	const itemClassName =
		scope.kind === 'folder'
			? 'min-w-66 gap-px rounded-xl md:max-w-66 print:hidden'
			: 'gap-px rounded-xl md:max-w-64 md:min-w-64 print:hidden';
	const createButtonHasRoundedRight = scope.kind === 'folder' ? !isFolderMetadataTemplateAdmin : !isProjectAdmin;

	return (
		<GridListItem aria-label="Create or add metadata templates to pool" className={itemClassName} hasCheckbox={false}>
			{access.canCreate ? (
				<Link
					className={gridCardStyles({
						variant,
						className: cx(
							'relative h-[150px] w-full shrink! grow flex-row place-content-center place-items-center gap-2 rounded-r-none focus-visible:z-10 focus-visible:outline-2',
							createButtonHasRoundedRight && 'rounded-r-xl',
							props.className,
						),
					})}
					href={props.href}
				>
					<PlusIcon aria-hidden size={18} strokeWidth={1.5} />
					Create
				</Link>
			) : null}
			<Modal isOpen={isOpen} onOpenChange={setIsOpen}>
				<Button
					className={gridCardStyles({
						variant,
						className: cx(
							'relative h-[150px] w-full shrink! grow flex-row place-content-center place-items-center gap-2 rounded-l-none focus-visible:outline-2',
							access.canCreate ? '' : 'rounded-l-xl',
							props.className,
						),
					})}
					variant="unset"
				>
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
		</GridListItem>
	);
}
