'use client';

import { valibotResolver } from '@hookform/resolvers/valibot';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	AlertCircleIcon,
	FolderArchiveIcon,
	FolderIcon,
	FolderInputIcon,
	FolderPlusIcon,
	MoreVerticalIcon,
	PencilIcon,
	TrashIcon,
	XCircleIcon,
} from 'lucide-react';
import { parseAsArrayOf, parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { useState } from 'react';
import type { Key, ModalOverlayProps } from 'react-aria-components';
import { Controller, useForm } from 'react-hook-form';
import type { InferInput } from 'valibot';
import { ExportJobDialog } from '@/components/ExportJobDialog';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { FieldError, Label } from '@/components/ui/Field';
import { Form, useDialogForm } from '@/components/ui/Form';
import { Input, InputGroup } from '@/components/ui/Input';
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from '@/components/ui/Menu';
import { ModalBody, ModalClose, ModalContent, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import { Select, SelectContent, SelectItem, SelectLabel, SelectTrigger } from '@/components/ui/Select';
import { TextField } from '@/components/ui/TextField';
import { SubfolderNameSchema } from '@/schemas/SubfolderNameSchema';
import { $api, openAPIClient } from '@/util/clientFetch';
import { EXPORT_TYPES, FILES_ONLY_EXPORT_CONTENT_OPTIONS } from '@/util/exportJobs';
import { formatErrorMessage } from '@/util/formatErrorMessage';
import type { components } from '@/util/openapiSchema';
import { useCurrentSubfolder } from './useCurrentSubfolder';

type Subfolder = components['schemas']['Subfolder'];
type SubfolderNameInput = InferInput<typeof SubfolderNameSchema>;

const ROOT_KEY = 'root';

export function formatSubfolderPath(subfolder: Pick<Subfolder, 'path'>) {
	return subfolder.path.map((item) => item.name).join(' / ');
}

function useInvalidateFolderContents(folderUuid: string) {
	const queryClient = useQueryClient();

	return async () =>
		Promise.all([
			queryClient.invalidateQueries({ queryKey: $api.queryOptions('get', '/api/v1/subfolder/').queryKey }),
			queryClient.invalidateQueries({ queryKey: ['get', '/api/v1/subfolder/{id}/'] }),
			queryClient.invalidateQueries({
				queryKey: $api.queryOptions('get', '/api/v1/uploads-dataset/', {
					params: { query: { folder: folderUuid } },
				}).queryKey,
			}),
		]);
}

function describeContents(subfolder: Subfolder) {
	const parts = [];

	if (subfolder.subfolders_count) {
		parts.push(`${subfolder.subfolders_count} ${subfolder.subfolders_count === 1 ? 'subfolder' : 'subfolders'}`);
	}

	parts.push(`${subfolder.datasets_count} ${subfolder.datasets_count === 1 ? 'file' : 'files'}`);

	return parts.join(', ');
}

export function ProjectFolderSubfolders(props: { readonly canManage: boolean; readonly folderUuid: string }) {
	const [currentSubfolder] = useCurrentSubfolder();
	const [, setQueryStates] = useQueryStates({
		subfolder: parseAsString,
		page: parseAsInteger,
		selected: parseAsArrayOf(parseAsString),
	});
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [renameTarget, setRenameTarget] = useState<Subfolder | null>(null);
	const [moveTarget, setMoveTarget] = useState<Subfolder | null>(null);
	const [deleteTarget, setDeleteTarget] = useState<Subfolder | null>(null);
	const [downloadTarget, setDownloadTarget] = useState<Subfolder | null>(null);

	const { data: subfoldersData, isPending } = useQuery(
		$api.queryOptions('get', '/api/v1/subfolder/', {
			params: {
				query: currentSubfolder
					? { folder: props.folderUuid, parent: currentSubfolder }
					: { folder: props.folderUuid, parent__isnull: true },
			},
		}),
	);

	const openSubfolder = async (subfolderUuid: string) =>
		setQueryStates({ subfolder: subfolderUuid, page: null, selected: null }, { history: 'push' });

	if (!subfoldersData?.length && !props.canManage) {
		return null;
	}

	return (
		<section aria-label="Subfolders" className="flex flex-col gap-3">
			<div className="flex place-content-between place-items-center gap-4">
				<h2 className="text-base-lg">Subfolders</h2>
				{props.canManage ? (
					<Button onPress={() => setIsCreateOpen(true)} size="sm" variant="secondary-outline">
						<FolderPlusIcon aria-hidden size={18} strokeWidth={1.5} /> New subfolder
					</Button>
				) : null}
			</div>

			{subfoldersData?.length ? (
				<ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
					{subfoldersData.map((subfolder) => (
						<li
							className="flex place-items-center gap-1 rounded-lg border border-base-neutral-100 bg-base-neutral-0 pr-1 dark:border-base-neutral-700 dark:bg-base-neutral-800"
							key={subfolder.pk}
						>
							<Button
								aria-label={`Open subfolder ${subfolder.name}`}
								className="flex min-w-0 grow place-content-start place-items-center gap-3 rounded-lg px-4 py-3 text-left hover:bg-base-neutral-60/38 dark:hover:bg-base-neutral-700/38"
								onPress={async () => openSubfolder(subfolder.pk)}
								variant="unset"
							>
								<FolderIcon aria-hidden className="shrink-0" size={20} strokeWidth={1.5} />
								<span className="flex min-w-0 flex-col">
									<span className="truncate text-base-label-md" title={subfolder.name}>
										{subfolder.name}
									</span>
									<span className="text-base-sm text-base-neutral-600 dark:text-base-neutral-300">
										{describeContents(subfolder)}
									</span>
								</span>
							</Button>
							<Menu>
								<MenuTrigger aria-label={`More actions for ${subfolder.name}`} size="icon-sm" variant="discreet">
									<MoreVerticalIcon aria-hidden size={18} strokeWidth={1.5} />
								</MenuTrigger>
								<MenuContent placement="bottom" popover={{ arrow: false }}>
									<MenuItem id="download" onAction={() => setDownloadTarget(subfolder)}>
										<FolderArchiveIcon aria-hidden size={18} strokeWidth={1.5} /> Download as zip
									</MenuItem>
									{props.canManage ? (
										<>
											<MenuSeparator />
											<MenuItem id="rename" onAction={() => setRenameTarget(subfolder)}>
												<PencilIcon aria-hidden size={18} strokeWidth={1.5} /> Rename
											</MenuItem>
											<MenuItem id="move" onAction={() => setMoveTarget(subfolder)}>
												<FolderInputIcon aria-hidden size={18} strokeWidth={1.5} /> Move
											</MenuItem>
											<MenuSeparator />
											<MenuItem id="delete" isDestructive onAction={() => setDeleteTarget(subfolder)}>
												<TrashIcon aria-hidden size={18} strokeWidth={1.5} /> Delete
											</MenuItem>
										</>
									) : null}
								</MenuContent>
							</Menu>
						</li>
					))}
				</ul>
			) : isPending ? null : (
				<p className="text-base-sm text-base-neutral-600 dark:text-base-neutral-300">
					No subfolders here yet. Uploading a folder creates its subfolders automatically.
				</p>
			)}

			{isCreateOpen ? (
				<SubfolderNameDialog
					folderUuid={props.folderUuid}
					isOpen={isCreateOpen}
					onOpenChange={setIsCreateOpen}
					parentUuid={currentSubfolder}
				/>
			) : null}
			{renameTarget ? (
				<SubfolderNameDialog
					folderUuid={props.folderUuid}
					isOpen
					onOpenChange={(isOpen) => !isOpen && setRenameTarget(null)}
					subfolder={renameTarget}
				/>
			) : null}
			{moveTarget ? (
				<MoveToSubfolderDialog
					folderUuid={props.folderUuid}
					isOpen
					onOpenChange={(isOpen) => !isOpen && setMoveTarget(null)}
					target={{ kind: 'subfolder', subfolder: moveTarget }}
				/>
			) : null}
			{downloadTarget ? (
				<ExportJobDialog
					defaultOptions={FILES_ONLY_EXPORT_CONTENT_OPTIONS}
					description={
						<>
							Download <span className="text-base-label-md">{downloadTarget.name}</span> with all its subfolders as a
							zip file. Without metadata, the zip keeps the original folder structure.
						</>
					}
					exportType={EXPORT_TYPES.Subfolder}
					isOpen
					onOpenChange={(isOpen) => !isOpen && setDownloadTarget(null)}
					title="Download subfolder"
					uuids={[downloadTarget.pk]}
				/>
			) : null}
			{deleteTarget ? (
				<SubfolderDeleteDialog
					folderUuid={props.folderUuid}
					isOpen
					onOpenChange={(isOpen) => !isOpen && setDeleteTarget(null)}
					subfolder={deleteTarget}
				/>
			) : null}
		</section>
	);
}

function SubfolderNameDialog({
	folderUuid,
	parentUuid,
	subfolder,
	...props
}: ModalOverlayProps & {
	readonly folderUuid: string;
	readonly parentUuid?: string | null | undefined;
	readonly subfolder?: Subfolder | undefined;
}) {
	const invalidateFolderContents = useInvalidateFolderContents(folderUuid);
	const isRename = Boolean(subfolder);

	const {
		control,
		handleSubmit,
		setError,
		formState: { errors },
	} = useForm<SubfolderNameInput>({
		resolver: valibotResolver(SubfolderNameSchema),
		defaultValues: {
			name: subfolder?.name ?? '',
		},
	});

	const { mutate } = useMutation({
		mutationFn: async (input: SubfolderNameInput) => {
			const { error, response } = subfolder
				? await openAPIClient.PATCH('/api/v1/subfolder/{id}/', {
						params: { path: { id: subfolder.pk } },
						body: { name: input.name },
					})
				: await openAPIClient.POST('/api/v1/subfolder/', {
						body: { folder: folderUuid, parent: parentUuid ?? null, name: input.name },
					});

			if (error) {
				throw new Error(formatErrorMessage(error, response));
			}
		},
		async onSuccess() {
			props.onOpenChange?.(false);
			await invalidateFolderContents();
		},
		onError(error) {
			setError('root', { type: 'custom', message: error.message });
		},
	});
	const { formProps, submitButtonProps } = useDialogForm(isRename ? 'subfolder-rename' : 'subfolder-create');

	return (
		<ModalContent {...props} aria-label={isRename ? `Rename subfolder "${subfolder?.name}"` : 'Create subfolder'}>
			<ModalHeader>{isRename ? 'Rename subfolder' : 'New subfolder'}</ModalHeader>
			<ModalBody>
				<Form {...formProps} onSubmit={handleSubmit((input) => mutate(input))}>
					{errors.root ? (
						<Alert className="mb-6">
							<AlertCircleIcon aria-hidden className="shrink-0" size={24} strokeWidth={1.5} />
							{errors.root.message}
						</Alert>
					) : null}

					<Controller
						control={control}
						name="name"
						render={({ field, fieldState }) => (
							<TextField
								autoComplete="off"
								isInvalid={fieldState.invalid}
								onBlur={field.onBlur}
								onChange={field.onChange}
								value={field.value ?? ''}
							>
								<Label>Subfolder name</Label>
								<InputGroup>
									<Input autoFocus placeholder="e.g. 10 or Spectra" />
									{field.value ? (
										<Button aria-label="Clear name" onPress={() => field.onChange('')} size="icon" variant="unset">
											<XCircleIcon aria-hidden className="size-6 shrink-0 stroke-[1.5]" />
										</Button>
									) : null}
								</InputGroup>
								{fieldState.error?.message ? <FieldError>{fieldState.error.message}</FieldError> : null}
							</TextField>
						)}
					/>
				</Form>
			</ModalBody>
			<ModalFooter>
				<ModalClose variant="secondary-discreet">Cancel</ModalClose>
				<Button {...submitButtonProps} variant="filled">
					{isRename ? 'Save changes' : 'Create subfolder'}
				</Button>
			</ModalFooter>
		</ModalContent>
	);
}

type MoveTarget =
	| { readonly kind: 'file'; readonly fileUuid: string; readonly filename: string }
	| { readonly kind: 'subfolder'; readonly subfolder: Subfolder };

export function MoveToSubfolderDialog({
	folderUuid,
	target,
	...props
}: ModalOverlayProps & { readonly folderUuid: string; readonly target: MoveTarget }) {
	const invalidateFolderContents = useInvalidateFolderContents(folderUuid);
	const [selected, setSelected] = useState<Key>(ROOT_KEY);

	const { data: allSubfolders } = useQuery(
		$api.queryOptions('get', '/api/v1/subfolder/', {
			params: { query: { folder: folderUuid } },
		}),
	);

	// A subfolder can't be moved into itself or one of its own subfolders
	const options = [
		{ id: ROOT_KEY, name: 'Top level of the folder' },
		...(allSubfolders ?? [])
			.filter((subfolder) =>
				target.kind === 'subfolder' ? !subfolder.path.some((item) => item.pk === target.subfolder.pk) : true,
			)
			.map((subfolder) => ({ id: subfolder.pk, name: formatSubfolderPath(subfolder) }))
			.sort((first, second) => first.name.localeCompare(second.name)),
	];

	const { mutate, error, isPending } = useMutation({
		mutationFn: async () => {
			const destination = selected === ROOT_KEY ? null : String(selected);
			const { error, response } =
				target.kind === 'subfolder'
					? await openAPIClient.PATCH('/api/v1/subfolder/{id}/', {
							params: { path: { id: target.subfolder.pk } },
							body: { parent: destination },
						})
					: await openAPIClient.PATCH('/api/v1/uploads-dataset/{id}/', {
							params: { path: { id: target.fileUuid } },
							body: { subfolder: destination },
						});

			if (error) {
				throw new Error(formatErrorMessage(error, response));
			}
		},
		async onSuccess() {
			props.onOpenChange?.(false);
			await invalidateFolderContents();
		},
	});

	const name = target.kind === 'subfolder' ? target.subfolder.name : target.filename;

	return (
		<ModalContent {...props} aria-label={`Move "${name}"`}>
			<ModalHeader>Move "{name}"</ModalHeader>
			<ModalBody className="flex flex-col gap-4">
				{error ? (
					<Alert>
						<AlertCircleIcon aria-hidden className="shrink-0" size={24} strokeWidth={1.5} />
						{error.message}
					</Alert>
				) : null}
				<Select onSelectionChange={(key) => key !== null && setSelected(key)} selectedKey={selected}>
					<Label>Destination</Label>
					<SelectTrigger />
					<SelectContent items={options}>
						{(item) => (
							<SelectItem id={item.id} textValue={item.name}>
								<SelectLabel>{item.name}</SelectLabel>
							</SelectItem>
						)}
					</SelectContent>
				</Select>
			</ModalBody>
			<ModalFooter>
				<ModalClose variant="secondary-discreet">Cancel</ModalClose>
				<Button isDisabled={isPending} onPress={() => mutate()} variant="filled">
					<FolderInputIcon aria-hidden size={18} strokeWidth={1.5} /> Move
				</Button>
			</ModalFooter>
		</ModalContent>
	);
}

function SubfolderDeleteDialog({
	folderUuid,
	subfolder,
	...props
}: ModalOverlayProps & { readonly folderUuid: string; readonly subfolder: Subfolder }) {
	const invalidateFolderContents = useInvalidateFolderContents(folderUuid);

	const { mutate, error, isPending } = useMutation({
		mutationFn: async () => {
			const { error, response } = await openAPIClient.DELETE('/api/v1/subfolder/{id}/', {
				params: { path: { id: subfolder.pk } },
			});

			if (error) {
				throw new Error(formatErrorMessage(error, response));
			}
		},
		async onSuccess() {
			props.onOpenChange?.(false);
			await invalidateFolderContents();
		},
	});

	return (
		<ModalContent {...props} role="alertdialog">
			<ModalHeader>Do you really want to delete subfolder "{subfolder.name}"?</ModalHeader>
			<ModalBody className="flex flex-col gap-4">
				{error ? (
					<Alert>
						<AlertCircleIcon aria-hidden className="shrink-0" size={24} strokeWidth={1.5} />
						{error.message}
					</Alert>
				) : null}
				Only subfolders without files can be deleted. Empty subfolders inside it are deleted as well.
			</ModalBody>
			<ModalFooter>
				<ModalClose variant="secondary-discreet">Cancel</ModalClose>
				<Button isDisabled={isPending} onPress={() => mutate()} variant="filled">
					<TrashIcon aria-hidden size={18} strokeWidth={1.5} /> Delete
				</Button>
			</ModalFooter>
		</ModalContent>
	);
}
