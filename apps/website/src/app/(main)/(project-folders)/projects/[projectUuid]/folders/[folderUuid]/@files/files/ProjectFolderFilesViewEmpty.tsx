'use client';

import { useQuery } from '@tanstack/react-query';
import { FilePlusIcon, PackageOpenIcon } from 'lucide-react';
import { useState } from 'react';
import { UploadTrigger } from '@/components/UploadTrigger';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { $api } from '@/util/clientFetch';
import { ProjectFolderFilesDraftFilesAssignDialog } from './ProjectFolderFilesDraftFilesAssignDialog';

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

	const canUploadFiles = folderPermissionData?.[0]?.is_folder_admin || folderPermissionData?.[0]?.can_edit;

	return (
		<div className="bg-base-lavender-100/38 text-base-neutral-900 dark:bg-base-lavender-800/38 dark:text-base-neutral-40 flex h-[269px] flex-col place-content-center gap-8 rounded-2xl text-center">
			<div className="flex flex-col gap-2">
				<span className="text-base-xl">No files yet</span>
				<span>Assigned files will appear here.</span>
			</div>
			{canUploadFiles ? (
				<div className="flex place-content-center gap-2">
					<UploadTrigger
						folderName={folderData?.name}
						folderUuid={props.folderUuid}
						projectUuid={folderData?.project.pk}
					>
						<Button variant="filled">
							<FilePlusIcon aria-hidden size={18} strokeWidth={1.5} />
							Upload files
						</Button>
					</UploadTrigger>
					<Modal isOpen={isOpen} onOpenChange={setIsOpen}>
						<Button variant="filled">
							<PackageOpenIcon aria-hidden size={18} strokeWidth={1.5} />
							Assign files
						</Button>
						<ProjectFolderFilesDraftFilesAssignDialog
							folderUuid={props.folderUuid}
							isOpen={isOpen}
							onOpenChange={setIsOpen}
						/>
					</Modal>
				</div>
			) : null}
		</div>
	);
}
