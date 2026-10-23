'use client';

import { useQuery } from '@tanstack/react-query';
import type { VariantProps } from 'cva';
import { FilePlusIcon, FolderUpIcon, PackageOpenIcon } from 'lucide-react';
import { useState, type PropsWithChildren } from 'react';
import { UploadTrigger } from '@/components/UploadTrigger';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { cx } from '@/styles/cva';
import type { buttonStyles } from '@/styles/ui/button';
import { $api } from '@/util/clientFetch';
import { ProjectFolderFilesDraftFilesAssignDialog } from './ProjectFolderFilesDraftFilesAssignDialog';
import { useCurrentSubfolder } from './useCurrentSubfolder';

export function ProjectFolderFilesUploadTable({
	variant = 'unset',
	...props
}: PropsWithChildren<
	VariantProps<typeof buttonStyles> & {
		readonly className?: string | undefined;
		readonly folderUuid: string;
		readonly isDisabled?: boolean;
	}
>) {
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

	const [currentSubfolder] = useCurrentSubfolder();
	const canUploadFiles = folderPermissionData?.[0]?.is_folder_admin || folderPermissionData?.[0]?.can_edit;

	return canUploadFiles ? (
		<div className="flex w-full border-b border-base-neutral-100 dark:border-base-neutral-700">
			<UploadTrigger
				folderName={folderData?.name}
				folderUuid={props.folderUuid}
				projectUuid={folderData?.project.pk}
				subfolderUuid={currentSubfolder}
			>
				<Button
					className={cx('group grow place-content-center gap-4 p-4', props.className)}
					isDisabled={props.isDisabled}
					variant={variant}
				>
					<span className="flex h-10 w-10 place-content-center place-items-center rounded-full bg-base-lavender-300 p-2 group-hover:bg-base-lavender-500 group-active:bg-base-lavender-600 group-active:text-base-neutral-40 dark:bg-base-lavender-700 dark:text-base-neutral-40 dark:group-hover:bg-base-lavender-500 dark:group-hover:text-base-neutral-900 dark:group-active:bg-base-lavender-400">
						<FilePlusIcon aria-hidden size={18} strokeWidth={1.5} />
					</span>
					<span className="text-base-label-md group-hover:text-base-lavender-600 dark:group-hover:text-base-lavender-400">
						Upload files
					</span>
				</Button>
			</UploadTrigger>
			<UploadTrigger
				acceptDirectory
				folderName={folderData?.name}
				folderUuid={props.folderUuid}
				projectUuid={folderData?.project.pk}
				subfolderUuid={currentSubfolder}
			>
				<Button
					className={cx('group grow place-content-center gap-4 p-4', props.className)}
					isDisabled={props.isDisabled}
					variant={variant}
				>
					<span className="flex h-10 w-10 place-content-center place-items-center rounded-full bg-base-lavender-300 p-2 group-hover:bg-base-lavender-500 group-active:bg-base-lavender-600 group-active:text-base-neutral-40 dark:bg-base-lavender-700 dark:text-base-neutral-40 dark:group-hover:bg-base-lavender-500 dark:group-hover:text-base-neutral-900 dark:group-active:bg-base-lavender-400">
						<FolderUpIcon aria-hidden size={18} strokeWidth={1.5} />
					</span>
					<span className="text-base-label-md group-hover:text-base-lavender-600 dark:group-hover:text-base-lavender-400">
						Upload folder
					</span>
				</Button>
			</UploadTrigger>
			<Modal isOpen={isOpen} onOpenChange={setIsOpen}>
				<Button
					className={cx('group grow place-content-center gap-4 p-4', props.className)}
					isDisabled={props.isDisabled}
					variant={variant}
				>
					<span className="flex h-10 w-10 place-content-center place-items-center rounded-full bg-base-lavender-300 p-2 group-hover:bg-base-lavender-500 group-active:bg-base-lavender-600 group-active:text-base-neutral-40 dark:bg-base-lavender-700 dark:text-base-neutral-40 dark:group-hover:bg-base-lavender-500 dark:group-hover:text-base-neutral-900 dark:group-active:bg-base-lavender-400">
						<PackageOpenIcon aria-hidden size={18} strokeWidth={1.5} />
					</span>
					<span className="text-base-label-md group-hover:text-base-lavender-600 dark:group-hover:text-base-lavender-400">
						Add files
					</span>
				</Button>
				<ProjectFolderFilesDraftFilesAssignDialog folderUuid={props.folderUuid} />
			</Modal>
		</div>
	) : null;
}
