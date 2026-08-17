'use client';

import type { VariantProps } from 'cva';
import { BlocksIcon, PlusIcon } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { useState, type PropsWithChildren } from 'react';
import {
	MetadataTemplateContainerAssignToPoolDialog,
	MetadataTemplateContainerBrowsePoolDialog,
} from '@/components/metadata-template/MetadataTemplateContainer';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { cx } from '@/styles/cva';
import { buttonStyles } from '@/styles/ui/button';
import type { MetadataTemplatePoolScope } from './MetadataTemplatePoolScope';
import { useMetadataTemplatePoolAccess } from './useMetadataTemplatePoolAccess';

type MetadataTemplatePoolCreateTableProps = PropsWithChildren<
	VariantProps<typeof buttonStyles> & {
		readonly className?: string | undefined;
		readonly href: Route;
		readonly scope: MetadataTemplatePoolScope;
	}
>;

export function MetadataTemplatePoolCreateTable({
	scope,
	variant = 'unset',
	...props
}: MetadataTemplatePoolCreateTableProps) {
	const [isOpen, setIsOpen] = useState(false);
	const { access, isProjectAdmin, isProjectOrFolderAdmin } = useMetadataTemplatePoolAccess(scope);
	const createAlignsStart = scope.kind === 'folder' ? !isProjectOrFolderAdmin : !isProjectAdmin;

	return (
		<div className="flex w-full border-b border-base-neutral-100 dark:border-base-neutral-700">
			{access.canCreate ? (
				<Link
					className={buttonStyles({
						variant,
						className: cx(
							'group grow place-content-center gap-4 p-4',
							createAlignsStart && 'place-content-start',
							props.className,
						),
					})}
					href={props.href}
				>
					<span className="flex h-10 w-10 place-content-center place-items-center rounded-full bg-base-lavender-300 p-2 group-hover:bg-base-lavender-500 group-active:bg-base-lavender-600 group-active:text-base-neutral-40 dark:bg-base-lavender-700 dark:text-base-neutral-40 dark:group-hover:bg-base-lavender-500 dark:group-hover:text-base-neutral-900 dark:group-active:bg-base-lavender-400">
						<PlusIcon aria-hidden size={18} strokeWidth={1.5} />
					</span>
					<span className="text-base-label-md group-hover:text-base-lavender-600 dark:group-hover:text-base-lavender-400">
						Create
					</span>
				</Link>
			) : null}
			<Modal isOpen={isOpen} onOpenChange={setIsOpen}>
				<Button
					className={cx(
						'group grow place-content-center gap-4 p-4',
						access.canCreate ? '' : 'place-content-start',
						props.className,
					)}
					variant={variant}
				>
					<span className="flex h-10 w-10 place-content-center place-items-center rounded-full bg-base-lavender-300 p-2 group-hover:bg-base-lavender-500 group-active:bg-base-lavender-600 group-active:text-base-neutral-40 dark:bg-base-lavender-700 dark:text-base-neutral-40 dark:group-hover:bg-base-lavender-500 dark:group-hover:text-base-neutral-900 dark:group-active:bg-base-lavender-400">
						<BlocksIcon aria-hidden size={18} strokeWidth={1.5} />
					</span>
					<span className="text-base-label-md group-hover:text-base-lavender-600 dark:group-hover:text-base-lavender-400">
						{access.addButtonLabel}
					</span>
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
	);
}
