'use client';

import { useQuery } from '@tanstack/react-query';
import { FilePlusIcon, FolderUpIcon, PackageOpenIcon } from 'lucide-react';
import { useState } from 'react';
import { UploadTrigger } from '@/components/UploadTrigger';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { $api } from '@/util/clientFetch';
import { ProjectFolderFilesDraftFilesAssignDialog } from './ProjectFolderFilesDraftFilesAssignDialog';
import { useCurrentSubfolder } from './useCurrentSubfolder';

export function ProjectFolderFilesViewEmpty(props: { readonly folderUuid: string }) {
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

	return (
		<div className="flex h-[269px] flex-col place-content-center gap-8 rounded-2xl bg-base-lavender-100/38 text-center text-base-neutral-900 dark:bg-base-lavender-800/38 dark:text-base-neutral-40">
			<div className="flex flex-col gap-2">
				<span className="text-base-xl">No files yet</span>
				<span>Added files will appear here.</span>
			</div>
			{canUploadFiles ? (
				<div className="flex place-content-center gap-2">
					<UploadTrigger
						folderName={folderData?.name}
						folderUuid={props.folderUuid}
						projectUuid={folderData?.project.pk}
						subfolderUuid={currentSubfolder}
					>
						<Button variant="filled">
							<FilePlusIcon aria-hidden size={18} strokeWidth={1.5} />
							Upload files
						</Button>
					</UploadTrigger>
					<UploadTrigger
						acceptDirectory
						folderName={folderData?.name}
						folderUuid={props.folderUuid}
						projectUuid={folderData?.project.pk}
						subfolderUuid={currentSubfolder}
					>
						<Button variant="filled">
							<FolderUpIcon aria-hidden size={18} strokeWidth={1.5} />
							Upload folder
						</Button>
					</UploadTrigger>
					<Modal isOpen={isOpen} onOpenChange={setIsOpen}>
						<Button variant="filled">
							<PackageOpenIcon aria-hidden size={18} strokeWidth={1.5} />
							Add files
						</Button>
						<ProjectFolderFilesDraftFilesAssignDialog folderUuid={props.folderUuid} />
					</Modal>
				</div>
			) : null}
		</div>
	);
}
