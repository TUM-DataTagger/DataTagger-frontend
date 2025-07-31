'use client';

import { valibotResolver } from '@hookform/resolvers/valibot';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAtomValue, useSetAtom } from 'jotai';
import { AlertCircleIcon, XCircleIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { ComponentProps } from 'react';
import { useEffect, useId } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useLocalStorage } from 'usehooks-ts';
import type { InferInput } from 'valibot';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { ComboBox, ComboBoxInput, ComboBoxList, ComboBoxOption, ComboBoxSection } from '@/components/ui/ComboBox';
import { Label } from '@/components/ui/Field';
import {
	Select,
	SelectLabel,
	SelectList,
	SelectOption,
	SelectOptionDescription,
	SelectSection,
	SelectTrigger,
} from '@/components/ui/Select';
import { TextField } from '@/components/ui/TextField';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { ProjectFolderSchema } from '@/schemas/ProjectFolderSchema';
import {
	folderMemberPermissionAtom,
	folderMembersSelectionAtom,
	folderMembersWithoutProjectAdminAtom,
	initialState,
	projectAtom,
	projectMembersAtom,
	projectMembersWithAdminAtom,
	projectMembersWithPermissionsAndFolderPermissionsAtom,
	projectMembersWithoutAdminAtom,
} from '@/stores/createProject';
import { $api, openAPIClient } from '@/util/clientFetch';
import { formatErrorMessage } from '@/util/formatErrorMessage';
import type { components } from '@/util/openapiSchema';

type ProjectCreateFolderInput = InferInput<typeof ProjectFolderSchema>;

const isAdmin = (toCheck: string) => toCheck === 'admin';
const isEditor = (toCheck: string) => toCheck === 'editor';

export function ProjectFolderCreateForm({
	projectUuid,
	data,
	...props
}: ComponentProps<'form'> & {
	readonly data: components['schemas']['ProjectMembership'][];
	readonly projectUuid: string;
}) {
	const router = useRouter();
	const queryClient = useQueryClient();
	const selectMemberInputId = useId();
	const setProject = useSetAtom(projectAtom);
	const folderMembersWithoutProjectAdmin = useAtomValue(folderMembersWithoutProjectAdminAtom);
	const projectMembers = useAtomValue(projectMembersAtom);
	const projectMembersWithAdmin = useAtomValue(projectMembersWithAdminAtom);
	const projectMembersWithoutAdmin = useAtomValue(projectMembersWithoutAdminAtom);
	const folderMembersSelection = useAtomValue(folderMembersSelectionAtom);
	const folderMemberPermission = useAtomValue(folderMemberPermissionAtom);
	const projectMembersWithPermissionsAndFolderPermissions = useAtomValue(
		projectMembersWithPermissionsAndFolderPermissionsAtom,
	);
	const [, setIsFirstTime] = useLocalStorage('isFirstTimeFolder', false);

	const { currentUserData } = useCurrentUser();

	const {
		control,
		handleSubmit,
		setError,
		formState: { errors },
	} = useForm<ProjectCreateFolderInput>({
		resolver: valibotResolver(ProjectFolderSchema),
		defaultValues: {
			name: '',
			storage: 'dss',
		},
	});

	const selectedMemberPermission = (member: string) => folderMemberPermission[member] ?? 'viewer';

	useEffect(() => {
		if (currentUserData) {
			for (const member of data) {
				if (member.member.email === currentUserData.email) {
					continue;
				}

				if (!projectMembers.has(member.member.email)) {
					setProject((draft) => {
						draft.project.members.add(member.member.email);
						draft.project.memberPermission[member.member.email] = member.is_project_admin ? 'admin' : 'member';
					});
				}
			}
		}
	}, [currentUserData, data, projectMembers, setProject]);

	const { mutate } = useMutation({
		mutationFn: async (input: ProjectCreateFolderInput) => {
			setProject((draft) => {
				draft.folder.name = input.name;
				draft.folder.storage = input.storage;
			});

			const payload = {
				project: projectUuid,
				name: input.name,
				// storage: input.storage,
				folder_users: projectMembersWithPermissionsAndFolderPermissions
					.filter((member) => member.folderPermission)
					.map((member) => ({
						email: member.id,
						is_folder_admin: isAdmin(member.projectPermission) || isAdmin(member.folderPermission),
						can_edit: isAdmin(member.projectPermission) || isEditor(member.folderPermission),
						// TODO: implement actual logic for this
						is_metadata_template_admin: false,
					})),
			};

			const { error: folderError, response: folderResponse } = await openAPIClient.POST('/api/v1/folder/', {
				body: payload,
			});

			if (folderError) {
				throw new Error(formatErrorMessage(folderError, folderResponse));
			}
		},
		async onSuccess() {
			await queryClient.invalidateQueries({
				queryKey: $api.queryOptions('get', '/api/v1/folder/', {
					params: { query: { project: projectUuid } },
				}).queryKey,
			});

			router.push(`/projects/${projectUuid}/folders`);
			setProject(initialState);
			setIsFirstTime(false);
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
		<form {...props} id="create-project-folder" onSubmit={handleSubmit((input) => mutate(input))}>
			<div className="flex flex-col gap-8">
				{errors.root ? (
					<Alert>
						<AlertCircleIcon aria-hidden size={24} strokeWidth={1.5} />
						{errors.root?.message}
					</Alert>
				) : null}

				<div className="flex flex-col gap-4">
					<h1 className="text-base-xl">Basic information</h1>

					<div className="grid gap-6">
						<div className="grid gap-2">
							<Controller
								control={control}
								name="name"
								render={({ field, fieldState }) => (
									<TextField
										autoComplete="off"
										errorMessage={fieldState.error?.message}
										isClearable
										isDisabled={field.disabled ?? false}
										isInvalid={fieldState.invalid}
										label="Folder name"
										onBlur={field.onBlur}
										onChange={field.onChange}
										placeholder="Name your folder"
										type="text"
										value={field.value ?? ''}
									/>
								)}
							/>
						</div>

						<div className="grid gap-2">
							<Controller
								control={control}
								name="storage"
								render={({ field, fieldState }) => (
									<Select
										autoComplete="off"
										errorMessage={fieldState.error?.message}
										isDisabled
										isInvalid={fieldState.invalid}
										label="Storage"
										onBlur={field.onBlur}
										onSelectionChange={field.onChange}
										selectedKey={field.value ?? ''}
									>
										<SelectTrigger />
										<SelectList items={[{ id: 'dss', name: 'DSS' }]}>
											{(item) => (
												<SelectOption id={item.id} textValue={item.name}>
													<SelectLabel>{item.name}</SelectLabel>
												</SelectOption>
											)}
										</SelectList>
									</Select>
								)}
							/>
						</div>
					</div>
				</div>

				<div className="flex flex-col gap-6">
					<div className="flex flex-col gap-4">
						<h1 className="text-base-xl">Access permissions</h1>

						<div className="grid gap-2">
							{currentUserData ? (
								<>
									<Label>Creator</Label>
									<div className="border-base-neutral-100 text-base-md dark:border-base-neutral-700 grid min-h-16 place-items-center content-center gap-4 rounded-sm border px-4 py-5 md:h-16 md:grid-cols-5 md:grid-rows-none md:gap-[58px]">
										<span
											className="col-span-2 max-w-[25ch] justify-self-start truncate"
											title={currentUserData?.email}
										>
											{currentUserData?.email}
										</span>
										<Select aria-label="Folder permission" className="col-span-3 pr-16" isDisabled placeholder="Admin">
											<SelectTrigger />
										</Select>
									</div>
								</>
							) : null}
						</div>

						{projectMembersWithAdmin.length ? (
							<div className="grid gap-2">
								<Label>Other admins from project level</Label>
								{projectMembersWithAdmin
									.sort((a, b) => a.name.localeCompare(b.name))
									.map((member) => (
										<div
											className="border-base-neutral-100 text-base-md dark:border-base-neutral-700 grid min-h-16 place-items-center content-center gap-4 rounded-sm border px-4 py-5 md:h-16 md:grid-cols-5 md:grid-rows-none md:gap-[58px]"
											key={member.id}
										>
											<span className="col-span-2 justify-self-start">{member.name}</span>
											<Select
												aria-label="Folder permission"
												className="col-span-3 pr-16"
												isDisabled
												placeholder="Admin"
											>
												<SelectTrigger />
											</Select>
										</div>
									))}
							</div>
						) : null}
					</div>

					<div className="grid gap-4">
						<div className="flex flex-col gap-1">
							<Label htmlFor={selectMemberInputId}>
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

						{folderMembersWithoutProjectAdmin.map((member, idx: number) => (
							<div
								className="border-base-neutral-100 text-base-md dark:border-base-neutral-700 grid min-h-16 place-items-center content-center gap-4 rounded-sm border px-4 py-5 md:h-16 md:grid-cols-5 md:grid-rows-none md:gap-[58px]"
								key={`${member.id}-${idx}`}
							>
								<span
									className="col-span-2 max-w-[20ch] place-self-center justify-self-start truncate"
									title={member.name}
								>
									{member.name}
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
										<Button
											aria-label="Remove member"
											isDestructive
											onPress={async () => removeFolderMember(member.id)}
											size="icon"
											variant="discreet"
										>
											<XCircleIcon aria-hidden size={18} strokeWidth={1.5} />
										</Button>
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</form>
	);
}
