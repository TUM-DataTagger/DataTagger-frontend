'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAtomValue, useSetAtom } from 'jotai';
import { AlertCircleIcon, AlertTriangleIcon, UserX2Icon, XCircleIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { ComponentProps } from 'react';
import { useEffect, useState } from 'react';
import type { Key } from 'react-aria-components';
import { useForm } from 'react-hook-form';
import { Item } from 'react-stately';
import { email, parse, pipe, string } from 'valibot';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/Accordion';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
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
import { SearchAutocomplete } from '@/components/ui/hooks/SearchAutocomplete';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import {
	initialState,
	projectAtom,
	projectExtendedMemberPermissionsAtom,
	projectMemberPermissionAtom,
	projectMembersAtom,
	projectMembersWithAdminAtom,
} from '@/stores/editProjectMembers';
import { cx } from '@/styles/cva';
import { $api, openAPIClient } from '@/util/clientFetch';
import { formatErrorMessage } from '@/util/formatErrorMessage';
import type { components } from '@/util/openapiSchema';

const isAdmin = (toCheck: string) => toCheck === 'admin';

export function ProjectMembersEditForm({
	projectUuid,
	data,
	...props
}: ComponentProps<'form'> & {
	readonly data: components['schemas']['ProjectMembership'][];
	readonly projectUuid: string;
}) {
	const router = useRouter();
	const queryClient = useQueryClient();
	const setProject = useSetAtom(projectAtom);
	const projectMembers = useAtomValue(projectMembersAtom);
	const projectMemberPermission = useAtomValue(projectMemberPermissionAtom);
	const projectExtendedMemberPermissions = useAtomValue(projectExtendedMemberPermissionsAtom);
	const projectMembersWithAdmin = useAtomValue(projectMembersWithAdminAtom);
	const [projectMemberInvites, setProjectMemberInvites] = useState<string[]>([]);
	const [projectMemberInvitesError, setProjectMemberInvitesError] = useState<string | undefined>();

	const { currentUserData } = useCurrentUser();

	useEffect(() => {
		setProject(initialState);
		for (const member of data) {
			setProject((draft) => {
				draft.project.members.add(member.member.email);
				draft.project.memberPermission[member.member.email] = member.is_project_admin ? 'admin' : 'member';
				draft.project.extendedMemberPermissions[member.member.email] = {
					folders: member.is_project_admin ? false : (member.can_create_folders ?? false),
					metadataTemplates: member.is_project_admin ? false : (member.is_metadata_template_admin ?? false),
				};
			});
		}
	}, [data, setProject]);

	const {
		handleSubmit,
		setError,
		formState: { errors },
	} = useForm();

	const selectedMemberPermission = (member: string) => projectMemberPermission[member] ?? 'member';

	const selectedMemberExtendedPermissionCreateFolders = (member: string) =>
		projectExtendedMemberPermissions[member]?.folders ?? false;

	const selectedMemberExtendedPermissionCreateMetadataTemplates = (member: string) =>
		projectExtendedMemberPermissions[member]?.metadataTemplates ?? false;

	const numSelectedMemberExtendedPermissions = (member: string) =>
		Object.values(projectExtendedMemberPermissions[member] ?? {}).filter(Boolean).length;

	const { mutate } = useMutation({
		mutationFn: async (_: any) => {
			const payload = {
				project_users: [...projectMembers.values()].map((member) => {
					const projectPermission = projectMemberPermission[member];
					const projectExtendedPermission = projectExtendedMemberPermissions[member];

					return {
						email: member,
						is_project_admin: isAdmin(projectPermission),
						can_create_folders: isAdmin(projectPermission) || (projectExtendedPermission?.folders ?? false),
						is_metadata_template_admin:
							isAdmin(projectPermission) || (projectExtendedPermission?.metadataTemplates ?? false),
					};
				}),
			};

			const { error: projectPermissionError, response: projectPermissionResponse } = await openAPIClient.PUT(
				'/api/v1/project/{id}/members/',
				{
					params: { path: { id: projectUuid } },
					body: payload,
				},
			);

			if (projectPermissionError) {
				throw new Error(formatErrorMessage(projectPermissionError, projectPermissionResponse));
			}
		},
		async onSuccess() {
			await queryClient.invalidateQueries({
				queryKey: $api.queryOptions('get', '/api/v1/project-membership/', {
					params: { query: { project: projectUuid, member: currentUserData?.pk ?? -1 } },
				}).queryKey,
			});
			await queryClient.invalidateQueries({
				queryKey: $api.queryOptions('get', '/api/v1/project-membership/', {
					params: { query: { project: projectUuid } },
				}).queryKey,
			});
			await openAPIClient.POST('/api/v1/project/{id}/unlock/', {
				params: { path: { id: projectUuid } },
			});

			router.push(`/projects/${projectUuid}/members`);
		},
		onError(error) {
			window.scrollTo({ top: 0, behavior: 'instant' });
			setError('root', {
				type: 'custom',
				message: error.message,
			});
		},
	});

	function onAddProjectMember(val: string) {
		setProject((draft) => {
			draft.project.members = new Set([val, ...draft.project.members]);
			draft.project.memberPermission[val] = 'member';
		});
	}

	function onProjectMemberPermissionChange(member: string, val: string) {
		setProject((draft) => {
			draft.project.memberPermission[member] = val;
		});
	}

	function onProjectMemberExtendedPermissionChange(member: string, permission: string, value: boolean) {
		setProject((draft) => {
			if (!draft.project.extendedMemberPermissions[member]) {
				draft.project.extendedMemberPermissions[member] = {};
			}

			draft.project.extendedMemberPermissions[member][permission] = value;
		});
	}

	function removeProjectMember(member: string) {
		setProject((draft) => {
			draft.project.members.delete(member);
			// eslint-disable-next-line @typescript-eslint/no-dynamic-delete
			delete draft.project.memberPermission[member];
			// eslint-disable-next-line @typescript-eslint/no-dynamic-delete
			delete draft.project.extendedMemberPermissions[member];
		});
	}

	function handleInviteProjectMemberOnChange(value: string) {
		try {
			parse(pipe(string(), email()), value);
			if ([currentUserData?.email, ...(projectMembers.values() ?? [])]?.includes(value)) {
				setProjectMemberInvitesError('Member was added before. Email already exists.');
			} else {
				setProjectMemberInvites([value]);
			}
		} catch {
			setProjectMemberInvitesError(undefined);
			setProjectMemberInvites([]);
		}
	}

	function handleInviteProjectMemberOnSelectionChange(key: Key | null) {
		if (key) {
			onAddProjectMember(key as string);
			setProjectMemberInvites([]);
		}
	}

	return (
		<form {...props} id="project-members-edit" onSubmit={handleSubmit((input) => mutate(input))}>
			<div className="flex flex-col gap-8">
				{errors.root ? (
					<Alert>
						<AlertCircleIcon aria-hidden size={24} strokeWidth={1.5} />
						{errors.root?.message}
					</Alert>
				) : null}

				<div className="flex flex-col gap-4">
					<h1 className="text-base-xl">Permissions per project member</h1>

					<div className="grid gap-4">
						<div className="grid gap-2">
							<SearchAutocomplete
								errorMessage={projectMemberInvitesError}
								isInvalid={Boolean(projectMemberInvitesError)}
								label="Invite project members (optional)"
								onInputChange={(value) => handleInviteProjectMemberOnChange(value)}
								onSelectionChange={(key) => handleInviteProjectMemberOnSelectionChange(key)}
								placeholder="Enter email address"
							>
								{projectMemberInvites.map((member) => (
									<Item key={member} textValue={member}>
										<span className="text-base-label-md whitespace-nowrap">Add member:</span> {member}
									</Item>
								))}
							</SearchAutocomplete>
						</div>
						<div className="grid gap-2">
							{[...projectMembers.values()].map((member: string, idx: number) => (
								<div
									className="border-base-neutral-100 text-base-md dark:border-base-neutral-700 grid min-h-16 place-items-center content-center gap-4 rounded-sm border px-4 py-3 md:grid-cols-5 md:grid-rows-none md:gap-[58px]"
									key={`${member}-${idx}`}
								>
									<span
										className="col-span-2 max-w-[20ch] place-self-start justify-self-start truncate pt-[10px]"
										title={member}
									>
										{member}
									</span>
									<div
										className={cx(
											'col-span-3 flex w-full flex-col gap-2',
											selectedMemberPermission(member) === 'admin' && projectMembersWithAdmin.length < 2 ? 'pr-16' : '',
										)}
									>
										<div className="flex gap-[23px]">
											<Select
												aria-label="Project permissions"
												isDisabled={selectedMemberPermission(member) === 'admin' && projectMembersWithAdmin.length < 2}
												onSelectionChange={async (val) => onProjectMemberPermissionChange(member, val as string)}
												selectedKey={selectedMemberPermission(member)}
											>
												<SelectTrigger />
												<SelectList>
													<SelectSection title="Project permissions">
														{[
															{
																id: 'admin',
																name: 'Project admin',
																description: 'Full access to project including folders and files within',
															},
															{
																id: 'member',
																name: 'Member',
																description: 'No access to files unless defined in folders',
															},
														].map((item) => (
															<SelectOption id={item.id} key={item.id} textValue={item.name}>
																<SelectLabel>{item.name}</SelectLabel>
																<SelectOptionDescription className="line-clamp-none">
																	{item.description}
																</SelectOptionDescription>
															</SelectOption>
														))}
													</SelectSection>
												</SelectList>
											</Select>
											{selectedMemberPermission(member) === 'admin' && projectMembersWithAdmin.length < 2 ? null : (
												<Modal>
													<Button aria-label="Remove member" isDestructive size="icon" variant="discreet">
														<XCircleIcon aria-hidden size={18} strokeWidth={1.5} />
													</Button>
													<ModalContent role="alertdialog">
														<ModalHeader>
															{member === currentUserData?.email
																? 'Do you really want to remove yourself as a project member?'
																: `Do you really want to remove "${member}" as a project member?`}
														</ModalHeader>
														<ModalBody>
															{member === currentUserData?.email ? (
																<div className="bg-base-tangerine-100 flex place-items-center gap-3 rounded-[4px] px-4 py-3">
																	<AlertTriangleIcon
																		aria-hidden
																		className="text-base-tangerine-500"
																		strokeWidth={1.5}
																	/>
																	Once the process has been completed, you will no longer be able to access the project.
																</div>
															) : (
																'Once the process has been completed, the user will no longer be able to access the project.'
															)}
														</ModalBody>
														<ModalFooter>
															<ModalClose variant="secondary-discreet">Cancel</ModalClose>
															<Button onPress={() => removeProjectMember(member)} type="submit" variant="filled">
																<UserX2Icon aria-hidden size={18} strokeWidth={1.5} /> Remove
															</Button>
														</ModalFooter>
													</ModalContent>
												</Modal>
											)}
										</div>
										{isAdmin(selectedMemberPermission(member)) ? null : (
											<Accordion collapsible disabled={isAdmin(selectedMemberPermission(member))} type="single">
												<AccordionItem value="extended-permission">
													<AccordionTrigger
														prepend={
															numSelectedMemberExtendedPermissions(member) ? (
																<span className="bg-base-lavender-200 text-base-neutral-900 dark:bg-base-lavender-600 h-4 w-[14px] rounded-full">
																	{numSelectedMemberExtendedPermissions(member)}
																</span>
															) : null
														}
													>
														Extended permission
													</AccordionTrigger>
													<AccordionContent className="flex flex-col gap-2">
														<Checkbox
															className="text-base-sm"
															classNames={{ boxContainer: 'flex-row-reverse place-content-between w-full' }}
															isDisabled={isAdmin(selectedMemberPermission(member))}
															isSelected={selectedMemberExtendedPermissionCreateFolders(member)}
															onChange={async (val) => onProjectMemberExtendedPermissionChange(member, 'folders', val)}
														>
															Can create folders
														</Checkbox>
														<Checkbox
															className="text-base-sm"
															classNames={{ boxContainer: 'flex-row-reverse place-content-between w-full' }}
															isDisabled={isAdmin(selectedMemberPermission(member))}
															isSelected={selectedMemberExtendedPermissionCreateMetadataTemplates(member)}
															onChange={async (val) =>
																onProjectMemberExtendedPermissionChange(member, 'metadataTemplates', val)
															}
														>
															Can create metadata templates
														</Checkbox>
													</AccordionContent>
												</AccordionItem>
											</Accordion>
										)}
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
