'use client';

import { valibotResolver } from '@hookform/resolvers/valibot';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { XCircleIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { type ComponentProps, useEffect, useState } from 'react';
import type { Key } from 'react-aria-components';
import { Controller, useForm } from 'react-hook-form';
import { Item } from 'react-stately';
import { email, parse, pipe, string, type InferInput } from 'valibot';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/Accordion';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
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
import { SearchAutocomplete } from '@/components/ui/hooks/SearchAutocomplete';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { ProjectStepOneSchema } from '@/schemas/ProjectSchema';
import {
	projectAtom,
	projectExtendedMemberPermissionsAtom,
	projectMemberPermissionAtom,
	projectMembersAtom,
	stepAtom,
} from '@/stores/createProject';

type ProjectCreateStepOneInput = InferInput<typeof ProjectStepOneSchema>;

export function ProjectCreateStepOneForm(props: ComponentProps<'form'>) {
	const router = useRouter();
	const setStep = useSetAtom(stepAtom);
	const [project, setProject] = useAtom(projectAtom);
	const projectMembers = useAtomValue(projectMembersAtom);
	const projectMemberPermission = useAtomValue(projectMemberPermissionAtom);
	const projectExtendedMemberPermissions = useAtomValue(projectExtendedMemberPermissionsAtom);
	const [projectMemberInvites, setProjectMemberInvites] = useState<string[]>([]);
	const [projectMemberInvitesError, setProjectMemberInvitesError] = useState<string | undefined>();

	const { currentUserData } = useCurrentUser();

	const { control, handleSubmit, setError, watch } = useForm<ProjectCreateStepOneInput>({
		resolver: valibotResolver(ProjectStepOneSchema),
		defaultValues: {
			name: project.project.name,
		},
	});

	useEffect(() => {
		const subscription = watch((value) => {
			setProject((draft) => {
				draft.project.name = value.name ?? '';
			});
		});

		return () => subscription.unsubscribe();
	}, [setProject, watch]);

	const selectedMemberPermission = (member: string) => projectMemberPermission[member] ?? 'member';

	const selectedMemberExtendedPermissionCreateFolders = (member: string) =>
		projectExtendedMemberPermissions[member]?.folders ?? false;

	const selectedMemberExtendedPermissionCreateMetadataTemplates = (member: string) =>
		projectExtendedMemberPermissions[member]?.metadataTemplates ?? false;

	const numSelectedMemberExtendedPermissions = (member: string) =>
		Object.values(projectExtendedMemberPermissions[member] ?? {}).filter(Boolean).length;

	function onSubmit(input: ProjectCreateStepOneInput) {
		setProject((draft) => {
			draft.project.name = input.name;
		});
		setStep(1);

		try {
			router.push('/projects/create/2');
		} catch (error) {
			const err = error as Error;
			setError('root.fetchError', { type: 'custom', message: err.message });
		}
	}

	function onAddProjectMember(val: string) {
		setProject((draft) => {
			draft.project.members = new Set([val, ...draft.project.members]);
			draft.project.memberPermission[val] = 'member';
		});
	}

	function onProjectMemberPermissionChange(member: string, val: string) {
		setProject((draft) => {
			draft.project.memberPermission[member] = val;

			if (val === 'admin') {
				draft.folder.members.add(member);
				draft.folder.memberPermission[member] = 'admin';
			} else {
				draft.folder.members.delete(member);
				// eslint-disable-next-line @typescript-eslint/no-dynamic-delete
				delete draft.folder.memberPermission[member];
			}
		});
	}

	function onProjectMemberExtendedPermissionChange(member: string, permission: string, value: boolean) {
		setProject((draft) => {
			if (!draft.project.extendedMemberPermissions[member]) {
				draft.project.extendedMemberPermissions[member] = {};
			}

			draft.project.extendedMemberPermissions[member]![permission] = value;
		});
	}

	function removeProjectMember(member: string) {
		setProject((draft) => {
			draft.project.members.delete(member);
			// eslint-disable-next-line @typescript-eslint/no-dynamic-delete
			delete draft.project.memberPermission[member];
			// eslint-disable-next-line @typescript-eslint/no-dynamic-delete
			delete draft.project.extendedMemberPermissions[member];

			draft.folder.members.delete(member);
			// eslint-disable-next-line @typescript-eslint/no-dynamic-delete
			delete draft.folder.memberPermission[member];
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
		<form {...props} id="project-create" onSubmit={handleSubmit(onSubmit)}>
			<div className="flex flex-col gap-8">
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
										label="Project name"
										onBlur={field.onBlur}
										onChange={field.onChange}
										placeholder="Name your project"
										type="text"
										value={field.value}
									/>
								)}
							/>
						</div>
					</div>
				</div>
				<div className="flex flex-col gap-4">
					<h1 className="text-base-xl">Members</h1>

					<div className="grid gap-6">
						<div className="grid gap-3">
							{currentUserData ? (
								<>
									<Label className="text-base-md">Project creator</Label>
									<div className="border-base-neutral-100 text-base-md dark:border-base-neutral-700 grid min-h-16 place-items-center content-center gap-4 rounded-sm border px-4 py-5 md:h-16 md:grid-cols-5 md:grid-rows-none md:gap-[58px]">
										<span
											className="col-span-2 max-w-[25ch] justify-self-start truncate"
											title={currentUserData?.email}
										>
											{currentUserData?.email}
										</span>
										<Select aria-label="Permission" className="col-span-3 pr-16" isDisabled placeholder="Project admin">
											<SelectTrigger />
										</Select>
									</div>
								</>
							) : null}
						</div>

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
									<div className="col-span-3 flex w-full flex-col gap-2">
										<div className="flex gap-[23px]">
											<Select
												aria-label="Project permissions"
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
											<Button
												aria-label="Remove member"
												isDestructive
												onPress={async () => removeProjectMember(member)}
												size="icon"
												variant="discreet"
											>
												<XCircleIcon aria-hidden size={18} strokeWidth={1.5} />
											</Button>
										</div>
										<Accordion className="pr-[58px]" collapsible type="single">
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
														isSelected={selectedMemberExtendedPermissionCreateFolders(member)}
														onChange={async (val) => onProjectMemberExtendedPermissionChange(member, 'folders', val)}
													>
														Can create folders
													</Checkbox>
													<Checkbox
														className="text-base-sm"
														classNames={{ boxContainer: 'flex-row-reverse place-content-between w-full' }}
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
