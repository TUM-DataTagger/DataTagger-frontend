'use client';

import { useQuery } from '@tanstack/react-query';
import type { VariantProps } from 'cva';
import { FilePlusIcon, PackageOpenIcon } from 'lucide-react';
import { useState } from 'react';
import { UploadTrigger } from '@/components/UploadTrigger';
import { Button } from '@/components/ui/Button';
import { GridListItem } from '@/components/ui/GridList';
import { Modal } from '@/components/ui/Modal';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { cx } from '@/styles/cva';
import { gridCardStyles } from '@/styles/ui/gridCard';
import { $api } from '@/util/clientFetch';
import { ProjectFolderFilesDraftFilesAssignDialog } from './ProjectFolderFilesDraftFilesAssignDialog';

export function ProjectFolderFilesUploadGrid({
	variant = 'secondary-filled',
	...props
}: VariantProps<typeof gridCardStyles> & {
	readonly className?: string | undefined;
	readonly folderUuid: string;
	readonly isDisabled?: boolean;
}) {
	const [isOpen, setIsOpen] = useState(false);

	const { currentUserData } = useCurrentUser();

	const { data: folderPermissionData } = useQuery(
		$api.queryOptions(
			'get',
			'/api/v1/folder-permission/',
			{
				params: {
					query: { folder: props.folderUuid, project_membership__member: currentUserData?.pk ?? -1 },
				},
			},
			{ enabled: Boolean(currentUserData?.pk) },
		),
	);

	const { data: folderData } = useQuery(
		$api.queryOptions('get', '/api/v1/folder/{id}/', {
			params: { path: { id: props.folderUuid } },
		}),
	);

	const canUploadFiles = folderPermissionData?.[0]?.is_folder_admin || folderPermissionData?.[0]?.can_edit;

	return canUploadFiles ? (
		<GridListItem
			aria-label="Upload or add from draft files"
			className="min-w-66 gap-px rounded-xl md:max-w-66 print:hidden"
			hasCheckbox={false}
			isDisabled={props.isDisabled}
		>
			<UploadTrigger folderName={folderData?.name} folderUuid={props.folderUuid} projectUuid={folderData?.project.pk}>
				<Button
					className={gridCardStyles({
						variant,
						className: cx(
							'relative h-[182px] w-full shrink! grow flex-row place-content-center place-items-center gap-2 rounded-r-none focus-visible:z-10 focus-visible:outline-2',
							props.className,
						),
					})}
					isDisabled={props.isDisabled}
					variant="unset"
				>
					<FilePlusIcon aria-hidden size={18} strokeWidth={1.5} />
					Upload
				</Button>
			</UploadTrigger>
			<Modal isOpen={isOpen} onOpenChange={setIsOpen}>
				<Button
					className={gridCardStyles({
						variant,
						className: cx(
							'relative h-[182px] w-full shrink! grow flex-row place-content-center place-items-center gap-2 rounded-l-none focus-visible:outline-2',
							props.className,
						),
					})}
					isDisabled={props.isDisabled}
					variant="unset"
				>
					<PackageOpenIcon aria-hidden size={18} strokeWidth={1.5} />
					Add
				</Button>
				<ProjectFolderFilesDraftFilesAssignDialog folderUuid={props.folderUuid} />
			</Modal>
		</GridListItem>
	) : null;
}
