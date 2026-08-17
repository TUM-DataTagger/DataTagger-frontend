'use client';

import { valibotResolver } from '@hookform/resolvers/valibot';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	AlertCircleIcon,
	FolderArchiveIcon,
	FolderIcon,
	FolderInputIcon,
	MoreVerticalIcon,
	PlusIcon,
	RefreshCcwIcon,
	TextCursorInputIcon,
	TrashIcon,
} from 'lucide-react';
import { parseAsArrayOf, parseAsBoolean, parseAsString, useQueryStates } from 'nuqs';
import { useState, type PropsWithChildren } from 'react';
import { useForm, Controller } from 'react-hook-form';
import type { InferInput } from 'valibot';
import { BulkActionsToolbar } from '@/components/BulkActionsToolbar';
import { BulkFillMetadataTemplateFieldsFlow } from '@/components/BulkFillMetadataTemplateFields';
import { ExportJobDialog } from '@/components/ExportJobDialog';
import { BulkFileDeleteDialog, BulkFileUpgradeDialog } from '@/components/File';
import { MetadataAssignModal } from '@/components/Metadata';
import { Alert } from '@/components/ui/Alert';
import { Button, type ButtonProps } from '@/components/ui/Button';
import {
	ComboBox,
	ComboBoxDescription,
	ComboBoxInput,
	ComboBoxLabel,
	ComboBoxContent,
	ComboBoxItem,
	ComboBoxSection,
} from '@/components/ui/ComboBox';
import { FieldError } from '@/components/ui/Field';
import { Form, useDialogForm } from '@/components/ui/Form';
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from '@/components/ui/Menu';
import {
	Modal,
	ModalBody,
	ModalClose,
	ModalContent,
	ModalFooter,
	ModalHeader,
	ModalTitle,
} from '@/components/ui/Modal';
import { globalToastQueue, ToastType } from '@/components/ui/Toast';
import { useExitFilesBulkMode } from '@/hooks/useExitFilesBulkMode';
import { DraftsAssignToFolderSchema } from '@/schemas/DraftsAssignToFolderSchema';
import { $api, openAPIClient } from '@/util/clientFetch';
import { EXPORT_TYPES } from '@/util/exportJobs';
import { formatErrorMessage } from '@/util/formatErrorMessage';
import { logger, LogCategory } from '@/util/logger';

type DraftsAssignToFolderInput = InferInput<typeof DraftsAssignToFolderSchema>;

export function BulkEditAssignToFolderButton({ variant = 'filled', size = 'sm', isDisabled, ...props }: ButtonProps) {
	const [queryStates] = useQueryStates({
		bulk_edit: parseAsBoolean.withDefault(false),
		selected: parseAsArrayOf(parseAsString).withDefault([]),
	});
	const exitBulkMode = useExitFilesBulkMode();
	const queryClient = useQueryClient();
	const [isOpen, setIsOpen] = useState(false);

	const { data: foldersData } = useQuery(
		$api.queryOptions('get', '/api/v1/folder/', {
			params: {
				query: {
					limit: 9_999,
					folder_permission__can_edit: true,
				},
			},
		}),
	);

	const {
		control,
		handleSubmit,
		setError,
		formState: { errors, isDirty },
	} = useForm<DraftsAssignToFolderInput>({
		resolver: valibotResolver(DraftsAssignToFolderSchema),
		defaultValues: {
			folderUuid: '',
		},
	});

	const draftsQueryKey = $api.queryOptions('get', '/api/v1/uploads-dataset/').queryKey;
	const { formProps, submitButtonProps } = useDialogForm('bulk-edit-assign-to-folder');

	const { mutate } = useMutation({
		mutationFn: async (input: DraftsAssignToFolderInput) => {
			const { error: versionError, response: versionResponse } = await openAPIClient.POST(
				'/api/v1/uploads-dataset/bulk-publish/',
				{
					body: {
						folder: input.folderUuid,
						uploads_datasets: queryStates.selected,
					},
				},
			);

			if (versionError) {
				throw new Error(formatErrorMessage(versionError, versionResponse));
			}

			return { folderUuid: input.folderUuid, selectedIds: queryStates.selected };
		},
		async onMutate() {
			// Cancel any outgoing refetches to prevent overwriting optimistic update
			await queryClient.cancelQueries({ queryKey: draftsQueryKey });

			// Snapshot the current data for potential rollback
			const previousData = queryClient.getQueryData(draftsQueryKey);

			// Optimistically remove selected items from drafts list
			queryClient.setQueryData(draftsQueryKey, (old: { results?: { pk: string }[] } | undefined) => {
				if (!old?.results) return old;
				return {
					...old,
					results: old.results.filter((item) => !queryStates.selected.includes(item.pk)),
				};
			});

			return { previousData };
		},
		async onSuccess(data) {
			const movedCount = data.selectedIds.length;
			const targetFolder = foldersData?.results?.find((item) => item.pk === data.folderUuid);

			logger.info(LogCategory.File, 'Files assigned to folder', {
				count: movedCount,
				targetFolderUuid: data.folderUuid,
			});

			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: $api.queryOptions('get', '/api/v1/uploads-dataset/', {
						params: { query: { folder: data.folderUuid } },
					}).queryKey,
				}),
				queryClient.invalidateQueries({ queryKey: draftsQueryKey }),
			]);

			setIsOpen(false);

			await exitBulkMode();

			globalToastQueue.add(
				{
					message: targetFolder
						? `${movedCount} file${movedCount === 1 ? '' : 's'} moved to ${targetFolder.name}.`
						: `${movedCount} file${movedCount === 1 ? '' : 's'} moved.`,
					type: ToastType.Success,
				},
				{ timeout: 2_500 },
			);
		},
		onError(error, _variables, context) {
			// Rollback to previous data on error
			if (context?.previousData) {
				queryClient.setQueryData(draftsQueryKey, context.previousData);
			}

			window.scrollTo({ top: 0, behavior: 'instant' });
			setError('root', {
				type: 'custom',
				message: error.message,
			});
		},
	});

	function getDescription(folderUuid: string) {
		const folder = foldersData?.results?.find((item) => item.pk === folderUuid);

		return folder ? `Project: ${folder.project.name}` : null;
	}

	return (
		<Modal isOpen={isOpen} onOpenChange={setIsOpen}>
			<Button {...props} isDisabled={isDisabled || !queryStates.selected.length} size={size} variant={variant}>
				Move to folder
			</Button>
			<ModalContent aria-label="Move files to folder">
				<ModalHeader className="flex flex-row place-items-center gap-2 text-base-xl">
					<ModalTitle className="text-base-xl">Move files to folder</ModalTitle>
				</ModalHeader>
				<ModalBody>
					<Form {...formProps} onSubmit={handleSubmit((input) => mutate(input))}>
						{errors.root && (
							<Alert className="mb-6">
								<AlertCircleIcon aria-hidden className="shrink-0" size={24} strokeWidth={1.5} />
								{errors.root?.message}
							</Alert>
						)}

						<span>Define the folder all selected files should be moved to</span>
						<Controller
							control={control}
							name="folderUuid"
							render={({ field, fieldState }) => (
								<ComboBox
									aria-label="Folder"
									isInvalid={fieldState.invalid}
									menuTrigger="focus"
									onBlur={field.onBlur}
									onChange={field.onChange}
									value={field.value ?? null}
								>
									<ComboBoxInput placeholder="Select folder" />
									<ComboBoxContent>
										<ComboBoxSection
											title={foldersData?.results?.length ? 'Results | Available folders' : 'No more folders available'}
										>
											{foldersData?.results?.map((item) => (
												<ComboBoxItem id={item.pk} key={item.pk} textValue={item.name}>
													<div className="flex place-items-center gap-3">
														<FolderIcon
															aria-hidden
															className="shrink-0"
															data-slot="folder-icon"
															size={18}
															strokeWidth={1.5}
														/>
														<div className="flex flex-col">
															<ComboBoxLabel>{item.name}</ComboBoxLabel>
															<ComboBoxDescription>{`Project: ${item.project.name}`}</ComboBoxDescription>
														</div>
													</div>
												</ComboBoxItem>
											))}
										</ComboBoxSection>
									</ComboBoxContent>
									<ComboBoxDescription>{getDescription(field.value ?? '')}</ComboBoxDescription>
									{fieldState.error?.message ? <FieldError>{fieldState.error.message}</FieldError> : null}
								</ComboBox>
							)}
						/>
					</Form>
				</ModalBody>
				<ModalFooter>
					<ModalClose variant="secondary-discreet">Cancel</ModalClose>
					<Button {...submitButtonProps} isDisabled={!isDirty} variant="filled">
						<FolderInputIcon aria-hidden data-slot="icon" size={18} strokeWidth={1.5} />
						Move
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
}

export function BulkEditFillInTemplateFieldsButton({
	folderUuid,
	variant = 'filled',
	size = 'sm',
	isDisabled,
	...props
}: ButtonProps & { readonly folderUuid?: string }) {
	const [queryStates] = useQueryStates({
		selected: parseAsArrayOf(parseAsString).withDefault([]),
	});
	const [isOpen, setIsOpen] = useState(false);

	return (
		<>
			<Button
				{...props}
				isDisabled={isDisabled || !queryStates.selected.length}
				size={size}
				variant={variant}
				onPress={() => setIsOpen(true)}
			>
				<TextCursorInputIcon aria-hidden data-slot="icon" size={18} strokeWidth={1.5} />
				Fill-in template fields
			</Button>
			<BulkFillMetadataTemplateFieldsFlow
				folderUuid={folderUuid}
				isOpen={isOpen}
				onOpenChange={setIsOpen}
				selected={queryStates.selected}
			/>
		</>
	);
}

export function BulkEditMoreButton(props: { readonly folderUuid?: string; readonly isDisabled?: boolean } = {}) {
	const [queryStates] = useQueryStates({
		selected: parseAsArrayOf(parseAsString).withDefault([]),
	});
	const [isMetadataAssignOpen, setIsMetadataAssignOpen] = useState(false);
	const [isBulkExportOpen, setIsBulkExportOpen] = useState(false);
	const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
	const [isBulkUpgradeOpen, setIsBulkUpgradeOpen] = useState(false);
	const exitBulkMode = useExitFilesBulkMode();

	return (
		<>
			<Menu>
				<MenuTrigger isDisabled={props.isDisabled || !queryStates.selected.length} size="icon-sm" variant="filled">
					<MoreVerticalIcon aria-hidden size={18} strokeWidth={1.5} />
				</MenuTrigger>
				<MenuContent placement="bottom" popover={{ arrow: false }}>
					<MenuItem aria-label="Export selected datasets" id="bulk-export" onAction={() => setIsBulkExportOpen(true)}>
						<FolderArchiveIcon aria-hidden size={18} strokeWidth={1.5} /> Export selected
					</MenuItem>
					<MenuItem
						aria-label="Add additional metadata"
						id="add-additional-metadata"
						onAction={() => setIsMetadataAssignOpen(true)}
					>
						<PlusIcon aria-hidden size={18} strokeWidth={1.5} /> Add additional metadata
					</MenuItem>
					<MenuItem
						aria-label="Metadata template upgrade"
						id="metadata-template-upgrade"
						onAction={() => setIsBulkUpgradeOpen(true)}
					>
						<RefreshCcwIcon aria-hidden size={18} strokeWidth={1.5} />
						Metadata template upgrade
					</MenuItem>
					<MenuSeparator />
					<MenuItem isDestructive aria-label="Delete items" id="bulk-delete" onAction={() => setIsBulkDeleteOpen(true)}>
						<TrashIcon aria-hidden size={18} strokeWidth={1.5} /> Delete items
					</MenuItem>
				</MenuContent>
			</Menu>
			<MetadataAssignModal
				isOpen={isMetadataAssignOpen}
				onOpenChange={setIsMetadataAssignOpen}
				selected={queryStates.selected}
			/>
			<ExportJobDialog
				description={
					<>
						Export <span className="text-base-label-md">{queryStates.selected.length}</span> selected dataset
						{queryStates.selected.length === 1 ? '' : 's'} to a zip file.
					</>
				}
				exportType={EXPORT_TYPES.UploadsDataset}
				isOpen={isBulkExportOpen}
				onJobCreated={async () => exitBulkMode()}
				onOpenChange={setIsBulkExportOpen}
				title="Export selected datasets"
				uuids={queryStates.selected}
			/>
			<BulkFileUpgradeDialog
				folderUuid={props.folderUuid}
				isOpen={isBulkUpgradeOpen}
				onOpenChange={setIsBulkUpgradeOpen}
				selected={queryStates.selected}
			/>
			<BulkFileDeleteDialog
				folderUuid={props.folderUuid}
				isOpen={isBulkDeleteOpen}
				onOpenChange={setIsBulkDeleteOpen}
				selected={queryStates.selected}
			/>
		</>
	);
}

export function BulkEditFilesToolbar(
	props: PropsWithChildren<{ readonly count: number; readonly isDisabled?: boolean }>,
) {
	return <BulkActionsToolbar {...props} />;
}
