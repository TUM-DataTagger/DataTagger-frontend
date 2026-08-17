'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FolderArchiveIcon, MoreVerticalIcon, PencilIcon, TrashIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useMediaQuery } from 'usehooks-ts';
import { ExportJobDialog } from '@/components/ExportJobDialog';
import { ProjectDeleteDialog, ProjectEditLockDialog } from '@/components/Project';
import { Drawer, DrawerBody, DrawerClose, DrawerContent, DrawerTrigger } from '@/components/ui/Drawer';
import { dropdownItemStyles } from '@/components/ui/Dropdown';
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from '@/components/ui/Menu';
import { Separator } from '@/components/ui/Separator';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { cx } from '@/styles/cva';
import { $api, openAPIClient } from '@/util/clientFetch';
import { EXPORT_TYPES } from '@/util/exportJobs';
import { ProjectEdit } from './ProjectEdit';

export function ProjectMoreMenu({
	isDeletable = false,
	...props
}: {
	readonly className?: string;
	readonly isDeletable?: boolean | undefined;
	readonly projectName: string | undefined;
	readonly projectUuid: string;
}) {
	const router = useRouter();
	const isMobile = useMediaQuery('(max-width: 600px)', { initializeWithValue: false });
	const queryClient = useQueryClient();
	const [isOpen, setIsOpen] = useState(false);
	const [isExportOpen, setIsExportOpen] = useState(false);
	const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
	const [isEditLockOpen, setIsEditLockOpen] = useState(false);

	const { currentUserData } = useCurrentUser();

	const { data: projectPermissionData } = useQuery(
		$api.queryOptions(
			'get',
			'/api/v1/project-membership/',
			{
				params: { query: { project: props.projectUuid, member: currentUserData?.pk ?? -1 } },
			},
			{ enabled: Boolean(currentUserData?.pk && isOpen) },
		),
	);

	const isProjectAdmin = projectPermissionData?.[0]?.is_project_admin;

	async function isLocked() {
		const { data } = await openAPIClient.GET('/api/v1/project/{id}/status/', {
			params: { path: { id: props.projectUuid } },
		});
		await queryClient.invalidateQueries({
			queryKey: $api.queryOptions('get', '/api/v1/project/{id}/status/', {
				params: { path: { id: props.projectUuid } },
			}).queryKey,
		});

		return data;
	}

	async function setLocked() {
		const { data } = await openAPIClient.POST('/api/v1/project/{id}/lock/', {
			params: { path: { id: props.projectUuid } },
		});

		return data;
	}

	return (
		<>
			{isMobile ? (
				<div>
					<Drawer isOpen={isOpen} onOpenChange={setIsOpen} withNotch={false}>
						<DrawerTrigger aria-label="More menu" size="icon" variant="filled">
							<MoreVerticalIcon aria-hidden size={24} strokeWidth={1.5} />
						</DrawerTrigger>
						<DrawerContent aria-label="More menu">
							<DrawerBody>
								<DrawerClose
									aria-label="Export (zip)"
									className={dropdownItemStyles({ className: 'text-base-sm flex place-content-start gap-2' })}
									id="export"
									onPress={() => setIsExportOpen(true)}
									variant="unset"
								>
									<FolderArchiveIcon aria-hidden size={18} strokeWidth={1.5} /> Export
								</DrawerClose>
								{isProjectAdmin ? (
									<>
										<Separator />
										<ProjectEdit
											aria-label="Edit basic information"
											className={dropdownItemStyles({ className: 'text-base-sm flex place-content-start gap-2' })}
											href={`/projects/${props.projectUuid}/details/edit`}
											onClick={(isLocked) => {
												setIsOpen(false);
												setIsEditLockOpen(Boolean(isLocked));
											}}
											projectUuid={props.projectUuid}
											size="default"
											variant="unset"
										>
											Edit basic information
										</ProjectEdit>
										{isDeletable ? (
											<DrawerClose
												aria-label="Delete project"
												className={dropdownItemStyles({ className: 'text-base-sm flex place-content-start gap-2' })}
												data-destructive="true"
												id="delete"
												onPress={async () => setIsDeleteConfirmOpen(true)}
												variant="unset"
											>
												<TrashIcon aria-hidden size={18} strokeWidth={1.5} /> Delete project
											</DrawerClose>
										) : null}
									</>
								) : null}
							</DrawerBody>
						</DrawerContent>
					</Drawer>
				</div>
			) : (
				<Menu isOpen={isOpen} onOpenChange={setIsOpen}>
					<MenuTrigger
						aria-label="More menu"
						className={cx(
							'pressed:outline-2 pressed:outline-offset-2 pressed:outline-base-lavender-400 dark:pressed:outline-base-lavender-600',
							props.className,
						)}
						size="icon"
						variant="filled"
					>
						<MoreVerticalIcon aria-hidden size={18} strokeWidth={1.5} />
					</MenuTrigger>
					<MenuContent placement="bottom" popover={{ arrow: false }}>
						<MenuItem aria-label="Export (zip)" id="export" onAction={async () => setIsExportOpen(true)}>
							<FolderArchiveIcon aria-hidden size={18} strokeWidth={1.5} /> Export
						</MenuItem>
						{isProjectAdmin ? (
							<>
								<MenuSeparator />
								<MenuItem
									aria-label="Edit basic information"
									id="edit"
									onAction={async () => {
										const status = await isLocked();
										if (status?.locked) {
											setIsEditLockOpen(true);
										} else {
											await setLocked();
											router.push(`/projects/${props.projectUuid}/details/edit`);
										}
									}}
								>
									<PencilIcon aria-hidden size={18} strokeWidth={1.5} /> Edit basic information
								</MenuItem>
								{isDeletable ? (
									<MenuItem
										aria-label="Delete project"
										id="delete"
										isDestructive
										onAction={async () => setIsDeleteConfirmOpen(true)}
									>
										<TrashIcon aria-hidden size={18} strokeWidth={1.5} /> Delete project
									</MenuItem>
								) : null}
							</>
						) : null}
					</MenuContent>
				</Menu>
			)}
			<ExportJobDialog
				description={
					<>
						Export available data from <span className="text-base-label-md">{props.projectName ?? 'this project'}</span>{' '}
						to a zip file.
					</>
				}
				exportType={EXPORT_TYPES.Project}
				isOpen={isExportOpen}
				onOpenChange={setIsExportOpen}
				title="Export project"
				uuids={[props.projectUuid]}
			/>
			<ProjectDeleteDialog
				isOpen={isDeleteConfirmOpen}
				onOpenChange={setIsDeleteConfirmOpen}
				projectName={props.projectName ?? ''}
				projectUuid={props.projectUuid}
				redirectUrl="/projects"
			/>
			<ProjectEditLockDialog isOpen={isEditLockOpen} onOpenChange={setIsEditLockOpen} projectUuid={props.projectUuid} />
		</>
	);
}
