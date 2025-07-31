'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAtomValue, useSetAtom } from 'jotai';
import { AlertCircleIcon, AlertTriangleIcon, UserX2Icon, XCircleIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { ComponentProps } from 'react';
import { useEffect, useId } from 'react';
import { useForm } from 'react-hook-form';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { ComboBox, ComboBoxInput, ComboBoxList, ComboBoxOption, ComboBoxSection } from '@/components/ui/ComboBox';
import { Label } from '@/components/ui/Field';
import { Modal, ModalBody, ModalClose, ModalContent, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import {
	Select,
	SelectLabel,
	SelectList,
	SelectOption,
	SelectOptionDescription,
	SelectSection,
	SelectTrigger,
} from '@/components/ui/Select';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import {
	folderMemberPermissionAtom,
	folderMembersSelectionAtom,
	folderMembersWithoutProjectAdminAtom,
	initialState,
	projectAtom,
	projectMembersAtom,
	projectMembersWithAdminAtom,
	projectMembersWithoutAdminAtom,
} from '@/stores/editProjectFolderPermissions';
import { $api, openAPIClient } from '@/util/clientFetch';
import { formatErrorMessage } from '@/util/formatErrorMessage';
import type { components } from '@/util/openapiSchema';

const isAdmin = (toCheck: string) => toCheck === 'admin';
const isEditor = (toCheck: string) => toCheck === 'editor';

export function ProjectFoldersPermissionsEditForm({
	projectUuid,
	projectPermissionsData,
	folderUuid,
	data,
	...props
}: ComponentProps<'form'> & {
	readonly data: components['schemas']['FolderPermission'][];
	readonly folderUuid: string;
	readonly projectPermissionsData: components['schemas']['ProjectMembership'][];
	readonly projectUuid: string;
}) {
	const router = useRouter();
	const selectMemberInputId = useId();
	const queryClient = useQueryClient();
	const setProject = useSetAtom(projectAtom);
	const folderMembersWithoutProjectAdmin = useAtomValue(folderMembersWithoutProjectAdminAtom);
	const projectMembers = useAtomValue(projectMembersAtom);
	const projectMembersWithAdmin = useAtomValue(projectMembersWithAdminAtom);
	const projectMembersWithoutAdmin = useAtomValue(projectMembersWithoutAdminAtom);
	const folderMembersSelection = useAtomValue(folderMembersSelectionAtom);
	const folderMemberPermission = useAtomValue(folderMemberPermissionAtom);

	const { currentUserData } = useCurrentUser();

	useEffect(() => {
		setProject(initialState);
		for (const member of projectPermissionsData) {
			setProject((draft) => {
				draft.project.members.add(member.member.email);
				draft.project.memberPermission[member.member.email] = member.is_project_admin ? 'admin' : 'member';
				draft.project.extendedMemberPermissions[member.member.email] = {
					folders: member.is_project_admin ? false : (member.can_create_folders ?? false),
				};
			});
		}

		for (const folder of data) {
			setProject((draft) => {
				draft.folder.members.add(folder.project_membership.member.email);
				draft.folder.memberPermission[folder.project_membership.member.email] = folder.is_folder_admin
					? 'admin'
					: folder.can_edit
						? 'editor'
						: 'viewer';
			});
		}
	}, [data, projectPermissionsData, setProject]);

	const {
		handleSubmit,
		setError,
		formState: { errors },
	} = useForm();

	const selectedMemberPermission = (member: string) => folderMemberPermission[member] ?? 'viewer';

	const { mutate } = useMutation({
		mutationFn: async (_: any) => {
			const { error: folderPermissionError, response: folderPermissionResponse } = await openAPIClient.PUT(
				'/api/v1/folder/{id}/permissions/',
				{
					params: { path: { id: folderUuid } },
					body: {
						folder_users: folderMembersWithoutProjectAdmin.map((member) => ({
							email: member.id,
							is_folder_admin: isAdmin(selectedMemberPermission(member.id)),
							can_edit: isAdmin(selectedMemberPermission(member.id)) || isEditor(selectedMemberPermission(member.id)),
							// TODO: implement actual logic for this
							is_metadata_template_admin: false,
						})),
					},
				},
			);

			if (folderPermissionError) {
				throw new Error(formatErrorMessage(folderPermissionError, folderPermissionResponse));
			}
		},
		async onSuccess() {
			await queryClient.invalidateQueries({
				queryKey: $api.queryOptions('get', '/api/v1/folder-permission/', {
					params: { query: { folder: folderUuid, member: currentUserData?.pk ?? -1 } },
				}).queryKey,
			});
			await queryClient.invalidateQueries({
				queryKey: $api.queryOptions('get', '/api/v1/folder-permission/', {
					params: { query: { folder: folderUuid } },
				}).queryKey,
			});
			await openAPIClient.POST('/api/v1/folder/{id}/unlock/', {
				params: { path: { id: folderUuid } },
			});

			router.push(`/projects/${projectUuid}/folders/${folderUuid}/permissions`);
		},
		onError(error) {
			window.scrollTo({ top: 0, behavior: 'instant' });
			setError('root', {
				type: 'custom',
				message: error.message,
			});
		},
	});

	function onAddFolderMember(val: string) {
		if (val) {
			setProject((draft) => {
				draft.folder.members = new Set([val, ...draft.folder.members]);
				draft.folder.memberPermission[val] = 'viewer';
			});
		}
	}

	function onAddAllFolderMembers() {
		setProject((draft) => {
			if (folderMembersWithoutProjectAdmin.length) {
				const mergedSet = new Set([
					...projectMembersWithoutAdmin.sort((a, b) => a.name.localeCompare(b.name)).map((member) => member.id),
					...folderMembersWithoutProjectAdmin.map((member) => member.id),
				]);

				draft.folder.members = mergedSet;
				draft.folder.memberPermission = Object.fromEntries(
					[...mergedSet.values()].map((member) => [member, selectedMemberPermission(member)]),
				);
			} else {
				draft.folder.members = new Set(
					projectMembersWithoutAdmin.sort((a, b) => a.name.localeCompare(b.name)).map((member) => member.id),
				);
				draft.folder.memberPermission = Object.fromEntries(
					projectMembersWithoutAdmin.map((member) => [member.id, selectedMemberPermission(member.id)]),
				);
			}
		});
	}

	function onFolderMemberPermissionChange(member: string, val: string) {
		setProject((draft) => {
			draft.folder.memberPermission[member] = val;
		});
	}

	function removeFolderMember(val: string) {
		setProject((draft) => {
			draft.folder.members.delete(val);
			// eslint-disable-next-line @typescript-eslint/no-dynamic-delete
			delete draft.folder.memberPermission[val];
		});
	}

	return (
		<form {...props} id="project-folder-permissions-edit" onSubmit={handleSubmit((input) => mutate(input))}>
			<div className="flex flex-col gap-8">
				{errors.root ? (
					<Alert>
						<AlertCircleIcon aria-hidden size={24} strokeWidth={1.5} />
						{errors.root?.message}
					</Alert>
				) : null}

				<div className="flex flex-col gap-4">
					<h1 className="text-base-xl">Access permissions</h1>

					{projectMembersWithAdmin.length ? (
						<div className="grid gap-3">
							<Label className="text-base-md">Admins from project level</Label>
							{projectMembersWithAdmin
								.sort((a, b) => a.name.localeCompare(b.name))
								.map((member) => (
									<div
										className="border-base-neutral-100 text-base-md dark:border-base-neutral-700 grid min-h-16 place-items-center content-center gap-4 rounded-sm border px-4 py-5 md:h-16 md:grid-cols-5 md:grid-rows-none md:gap-[58px]"
										key={member.id}
									>
										<span className="col-span-2 max-w-[25ch] justify-self-start truncate">{member.name}</span>
										<Select aria-label="Folder permission" className="col-span-3 pr-16" isDisabled placeholder="Admin">
											<SelectTrigger />
										</Select>
									</div>
								))}
						</div>
					) : null}

					<div className="grid gap-4">
						<div className="flex flex-col gap-3">
							<Label className="text-base-md" htmlFor={selectMemberInputId}>
								Define permissions per project member for this folder and for files within (optional)
							</Label>
							<div className="flex flex-col place-items-center gap-4 md:flex-row">
								<ComboBox
									aria-labelledby={selectMemberInputId}
									id={selectMemberInputId}
									menuTrigger="focus"
									onSelectionChange={async (val) => onAddFolderMember(val as string)}
									placeholder="Select member"
									selectedKey={null}
								>
									<ComboBoxInput />
									<ComboBoxList>
										<ComboBoxSection
											title={
												projectMembers.size === 0
													? 'No project members defined on project level'
													: folderMembersWithoutProjectAdmin.length === projectMembersWithoutAdmin.length
														? 'No more project members available'
														: 'Results | Available members'
											}
										>
											{folderMembersSelection
												.sort((a, b) => a.name.localeCompare(b.name))
												.map((member) => (
													<ComboBoxOption id={member.id} key={member.id} textValue={member.name}>
														{member.name}
													</ComboBoxOption>
												))}
										</ComboBoxSection>
									</ComboBoxList>
								</ComboBox>
								<Button
									className="shrink-0"
									isDisabled={folderMembersWithoutProjectAdmin.length === projectMembersWithoutAdmin.length}
									onPress={async () => onAddAllFolderMembers()}
									variant="secondary-discreet"
								>
									Load all members
								</Button>
							</div>
						</div>

						<div className="grid gap-2">
							{folderMembersWithoutProjectAdmin.map((member, idx) => (
								<div
									className="border-base-neutral-100 text-base-md dark:border-base-neutral-700 grid min-h-16 place-items-center content-center gap-4 rounded-sm border px-4 py-3 md:grid-cols-5 md:grid-rows-none md:gap-[58px]"
									key={`${member.id}-${idx}`}
								>
									<span
										className="col-span-2 max-w-[20ch] place-self-start justify-self-start truncate pt-[10px]"
										title={member.id}
									>
										{member.id}
									</span>
									<div className="col-span-3 flex w-full flex-col gap-2">
										<div className="flex gap-[23px]">
											<Select
												aria-label="Folder permission"
												onSelectionChange={async (val) => onFolderMemberPermissionChange(member.id, val as string)}
												selectedKey={selectedMemberPermission(member.id)}
											>
												<SelectTrigger />
												<SelectList>
													<SelectSection title="Folder permissions">
														{[
															{
																id: 'admin',
																name: 'Admin',
																description: 'Full access to folder, files, and metadata within',
															},
															{
																id: 'editor',
																name: 'Editor',
																description: 'Assigns files to a folder and edits metadata of a file',
															},
															{
																id: 'viewer',
																name: 'Viewer',
																description: 'Views and downloads files and their metadata',
															},
														].map((permission) => (
															<SelectOption id={permission.id} key={permission.id} textValue={permission.name}>
																<SelectLabel>{permission.name}</SelectLabel>
																<SelectOptionDescription>{permission.description}</SelectOptionDescription>
															</SelectOption>
														))}
													</SelectSection>
												</SelectList>
											</Select>
											<Modal>
												<Button aria-label="Remove member" isDestructive size="icon" variant="discreet">
													<XCircleIcon aria-hidden size={18} strokeWidth={1.5} />
												</Button>
												<ModalContent role="alertdialog">
													<ModalHeader>
														{member.id === currentUserData?.email
															? 'Do you really want to remove your permission for this folder?'
															: `Do you really want to remove the permission of "${member.name}" for this folder?`}
													</ModalHeader>
													<ModalBody>
														{member.id === currentUserData?.email ? (
															<div className="bg-base-tangerine-100 flex place-items-center gap-3 rounded-[4px] px-4 py-3">
																<AlertTriangleIcon aria-hidden className="text-base-tangerine-500" strokeWidth={1.5} />
																Once the process is completed, you will no longer be able to access this folder.
															</div>
														) : (
															'Once the process has been completed, the user will no longer be able to access this folder.'
														)}
													</ModalBody>
													<ModalFooter>
														<ModalClose variant="secondary-discreet">Cancel</ModalClose>
														<Button onPress={() => removeFolderMember(member.id)} type="submit" variant="filled">
															<UserX2Icon aria-hidden size={18} strokeWidth={1.5} /> Remove
														</Button>
													</ModalFooter>
												</ModalContent>
											</Modal>
										</div>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</form>
	);
}
