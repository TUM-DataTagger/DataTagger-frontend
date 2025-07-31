'use client';

import { valibotResolver } from '@hookform/resolvers/valibot';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cx } from 'cva';
import { AlertCircleIcon, FolderIcon, FolderInputIcon, MoreVerticalIcon } from 'lucide-react';
import { parseAsArrayOf, parseAsBoolean, parseAsString, useQueryStates } from 'nuqs';
import { useState, type PropsWithChildren } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useMediaQuery } from 'usehooks-ts';
import type { InferInput } from 'valibot';
import { BulkFileDeleteDialog } from '@/components/File';
import { MetadataAssignModal } from '@/components/Metadata';
import { Alert } from '@/components/ui/Alert';
import { Button, type ButtonProps } from '@/components/ui/Button';
import {
	ComboBox,
	ComboBoxDescription,
	ComboBoxInput,
	ComboBoxLabel,
	ComboBoxList,
	ComboBoxOption,
	ComboBoxSection,
} from '@/components/ui/ComboBox';
import { Menu, MenuContent, MenuItem, MenuTrigger } from '@/components/ui/Menu';
import { Modal, ModalBody, ModalClose, ModalContent, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import { Switch } from '@/components/ui/Switch';
import { DraftsAssignToFolderSchema } from '@/schemas/DraftsAssignToFolderSchema';
import { $api, openAPIClient } from '@/util/clientFetch';
import { formatErrorMessage } from '@/util/formatErrorMessage';

type DraftsAssignToFolderInput = InferInput<typeof DraftsAssignToFolderSchema>;

export function BulkEditAssignToFolderButton({ variant = 'filled', size = 'sm', isDisabled, ...props }: ButtonProps) {
	const [queryStates, setQueryStates] = useQueryStates({
		bulk_edit: parseAsBoolean.withDefault(false),
		selected: parseAsArrayOf(parseAsString).withDefault([]),
	});
	const queryClient = useQueryClient();
	const [isOpen, setIsOpen] = useState(false);

	const { data: foldersData } = useQuery(
		$api.queryOptions('get', '/api/v1/folder/', {
			params: {
				query: {
					limit: 9_999,
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

			return { folderUuid: input.folderUuid };
		},
		async onSuccess(data) {
			await queryClient.invalidateQueries({
				queryKey: $api.queryOptions('get', '/api/v1/uploads-dataset/', {
					params: { query: { folder: data.folderUuid } },
				}).queryKey,
			});
			await queryClient.invalidateQueries({
				queryKey: $api.queryOptions('get', '/api/v1/uploads-dataset/').queryKey,
			});

			setIsOpen(false);

			await setQueryStates({
				selected: [],
			});
		},
		onError(error) {
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
				Assign to folder
			</Button>
			<ModalContent aria-label="Assign files to folder">
				<form onSubmit={handleSubmit((input) => mutate(input))}>
					<ModalHeader className="text-base-xl">Assign files to folder</ModalHeader>
					<ModalBody>
						{errors.root && (
							<Alert>
								<AlertCircleIcon aria-hidden size={24} strokeWidth={1.5} />
								{errors.root?.message}
							</Alert>
						)}

						<span>Define the folder all selected files should be assigned to</span>
						<Controller
							control={control}
							name="folderUuid"
							render={({ field, fieldState }) => (
								<ComboBox
									aria-label="Folder"
									description={getDescription(field.value)}
									errorMessage={fieldState.error?.message}
									isInvalid={fieldState.invalid}
									menuTrigger="focus"
									onBlur={field.onBlur}
									onSelectionChange={field.onChange}
									placeholder="Select folder"
									selectedKey={field.value}
								>
									<ComboBoxInput />
									<ComboBoxList>
										<ComboBoxSection
											title={foldersData?.results?.length ? 'Results | Available folders' : 'No more folders available'}
										>
											{foldersData?.results?.map((item) => (
												<ComboBoxOption id={item.pk} key={item.pk} textValue={item.name}>
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
												</ComboBoxOption>
											))}
										</ComboBoxSection>
									</ComboBoxList>
								</ComboBox>
							)}
						/>
					</ModalBody>
					<ModalFooter>
						<ModalClose variant="secondary-discreet">Cancel</ModalClose>
						<Button isDisabled={!isDirty} type="submit" variant="filled">
							<FolderInputIcon aria-hidden data-slot="icon" size={18} strokeWidth={1.5} />
							Assign
						</Button>
					</ModalFooter>
				</form>
			</ModalContent>
		</Modal>
	);
}

export function BulkEditMoreButton() {
	const [queryStates] = useQueryStates({
		selected: parseAsArrayOf(parseAsString).withDefault([]),
	});
	const [isMetadataAssignOpen, setIsMetadataAssignOpen] = useState(false);
	const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);

	return (
		<>
			<Menu respectScreen={false}>
				<MenuTrigger isDisabled={!queryStates.selected.length} size="icon-sm" variant="filled">
					<MoreVerticalIcon aria-hidden size={18} strokeWidth={1.5} />
				</MenuTrigger>
				<MenuContent placement="bottom">
					<MenuItem aria-label="Assign metadata" id="assign-metadata" onAction={() => setIsMetadataAssignOpen(true)}>
						Assign metadata
					</MenuItem>
					<MenuItem aria-label="Bulk delete" id="bulk-delete" onAction={() => setIsBulkDeleteOpen(true)}>
						Bulk delete
					</MenuItem>
				</MenuContent>
			</Menu>
			<MetadataAssignModal
				isOpen={isMetadataAssignOpen}
				onOpenChange={setIsMetadataAssignOpen}
				selected={queryStates.selected}
			/>
			<BulkFileDeleteDialog
				isOpen={isBulkDeleteOpen}
				onOpenChange={setIsBulkDeleteOpen}
				selected={queryStates.selected}
			/>
		</>
	);
}

export function BulkEditToolbar(props: PropsWithChildren<{ readonly count: number }>) {
	const [queryStates, setQueryStates] = useQueryStates({
		bulk_edit: parseAsBoolean.withDefault(false),
		selected: parseAsArrayOf(parseAsString).withDefault([]),
	});
	const isMobile = useMediaQuery('(max-width: 600px)', { initializeWithValue: false });

	return (
		<div
			className={cx(
				'border-base-neutral-100 dark:border-base-neutral-700 flex h-14 place-items-center rounded-sm border px-4 py-4.5',
				queryStates.bulk_edit && 'bg-base-neutral-80 dark:bg-base-neutral-700/72 border-transparent',
				isMobile && 'flex-col-reverse place-content-center gap-4',
				queryStates.bulk_edit && isMobile && 'h-[104px]',
			)}
		>
			{queryStates.bulk_edit ? (
				<div className="flex w-full place-items-center gap-4">
					<div>
						<span className="bg-base-lavender-200 text-base-label-xs text-base-neutral-900 dark:bg-base-lavender-700 dark:text-base-neutral-40 h-4 rounded-2xl px-1 py-px tabular-nums">
							{queryStates.selected.length}
						</span>{' '}
						<span className="text-base-xs">of {props.count} selected</span>
					</div>
					{props.children}
				</div>
			) : null}
			<div className={cx('flex w-full place-items-center', !isMobile && 'place-content-end')}>
				<Switch
					isSelected={queryStates.bulk_edit}
					onChange={async () =>
						setQueryStates((old) => ({
							...old,
							bulk_edit: !old.bulk_edit,
							selected: old.bulk_edit ? [] : old.selected,
						}))
					}
					size="sm"
					variant="green-lime"
				>
					Bulk edit
				</Switch>
			</div>
		</div>
	);
}
