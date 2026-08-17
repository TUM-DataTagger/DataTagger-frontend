'use client';

import { RestrictToVerticalAxis } from '@dnd-kit/abstract/modifiers';
import { DragDropProvider } from '@dnd-kit/react';
import { valibotResolver } from '@hookform/resolvers/valibot';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircleIcon, BlocksIcon, PlusIcon, XCircleIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useRef, type ComponentProps } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import type { InferInput } from 'valibot';
import { getMetadataFieldTypeOrDefault, MetadataBorder, MetadataItemWrapper } from '@/components/Metadata';
import {
	MetadataTemplateFieldValueEditor,
	MetadataValueEditor,
	mergeMetadataValueEditorChange,
} from '@/components/MetadataValueEditor';
import {
	FileMissingMetadataBadge,
	FileMissingMetadataIndicator,
} from '@/components/file-metadata/FileMetadataIndicators';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { FieldError, Label } from '@/components/ui/Field';
import { Input, InputGroup } from '@/components/ui/Input';
import { Link } from '@/components/ui/Link';
import { Separator } from '@/components/ui/Separator';
import { TextField } from '@/components/ui/TextField';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/Tooltip';
import { FileSchema } from '@/schemas/FileSchema';
import { $api, openAPIClient } from '@/util/clientFetch';
import { getSortableDragIndices } from '@/util/dndSortable';
import { formatErrorMessage } from '@/util/formatErrorMessage';
import { logger, LogCategory } from '@/util/logger';
import type { components } from '@/util/openapiSchema';
import { trimMetadataPayload } from '@/util/trimMetadataPayload';

type FileMetadataEditInput = InferInput<typeof FileSchema>;
type FileMetadataEditField = NonNullable<FileMetadataEditInput['metadata']>[number];
type FileMetadataEditFieldWithId = FileMetadataEditField & { readonly id: string };

type FileMetadataEditMode =
	| { readonly kind: 'draft' }
	| { readonly folderUuid: string; readonly kind: 'project-folder-file'; readonly projectUuid: string };

type FileMetadataEditFormProps = ComponentProps<'form'> & {
	readonly data: components['schemas']['UploadsDataset'];
	readonly fileMetadata?: components['schemas']['UploadsVersion'] | undefined;
	readonly fileUuid: string;
	readonly mode: FileMetadataEditMode;
};

function createEmptyMetadataField() {
	return {
		custom_key: '',
		value: '',
		field_type: 'TEXT' as const,
		config: {},
	};
}

function getFormId(mode: FileMetadataEditMode) {
	return mode.kind === 'draft' ? 'draft-file-edit-metadata' : 'project-folder-file-edit-metadata';
}

function getRedirectPath(mode: FileMetadataEditMode, fileUuid: string) {
	return mode.kind === 'draft'
		? `/drafts/${fileUuid}`
		: `/projects/${mode.projectUuid}/folders/${mode.folderUuid}/files/${fileUuid}`;
}

export function FileMetadataEditForm({ fileMetadata, fileUuid, data, mode, ...props }: FileMetadataEditFormProps) {
	const router = useRouter();
	const queryClient = useQueryClient();
	const dndContainerRef = useRef<HTMLDivElement>(null);

	const {
		control,
		handleSubmit,
		setError,
		formState: { errors },
	} = useForm<FileMetadataEditInput>({
		resolver: valibotResolver(FileSchema),
		defaultValues: {
			name: data.display_name ?? '',
			metadata: (fileMetadata?.metadata ?? []).map((field) => ({
				previous_version_field: field.pk ?? null,
				custom_key: field.custom_key ?? '',
				value: field.value ?? '',
				field_type: field.field_type ?? 'TEXT',
				config: field.config ?? {},
				mandatory: field.mandatory ?? false,
				metadata_template_field: field.metadata_template_field ?? null,
				metadata_template: field.metadata_template ?? null,
			})),
		},
	});

	const {
		fields: rawFields,
		append,
		remove,
		move,
	} = useFieldArray<FileMetadataEditInput>({
		control,
		name: 'metadata',
	});
	const fields = rawFields as FileMetadataEditFieldWithId[];

	const originalSelectionFieldPks = new Set(
		(fileMetadata?.metadata ?? [])
			.filter((metadata) => metadata.field_type === 'SELECTION' || metadata.field_type === 'MULTI_SELECTION')
			.map((metadata) => metadata.pk),
	);

	const metadataTemplateFields = fields
		.map((field, originalIndex) => ({ field, originalIndex }))
		.filter((item) => item.field.metadata_template_field);

	const metadataFields = fields
		.map((field, originalIndex) => ({ field, originalIndex }))
		.filter((item) => !item.field.metadata_template_field);

	const { mutate } = useMutation({
		mutationFn: async (input: { metadata: Omit<FileMetadataEditInput['metadata'][number], 'field'>[] }) => {
			const metadataWithOrder = (input.metadata ?? []).map((field, index) => ({
				...field,
				order: index,
			}));

			const { error: metadataError, response: metadataResponse } = await openAPIClient.POST(
				'/api/v1/uploads-dataset/{id}/version/',
				{
					params: { path: { id: fileUuid } },
					body: { metadata: trimMetadataPayload(metadataWithOrder) },
				},
			);

			if (metadataError) {
				throw new Error(formatErrorMessage(metadataError, metadataResponse));
			}
		},
		async onSuccess(_data, variables) {
			if (mode.kind === 'draft') {
				logger.info(LogCategory.DraftFiles, 'Draft metadata updated', {
					fileUuid,
					metadataFieldCount: variables.metadata?.length ?? 0,
				});
			} else {
				logger.info(LogCategory.File, 'File metadata updated', {
					fileUuid,
					folderUuid: mode.folderUuid,
					metadataFieldCount: variables.metadata?.length ?? 0,
				});
			}

			await queryClient.invalidateQueries({
				queryKey: $api.queryOptions('get', '/api/v1/uploads-dataset/{id}/', {
					params: { path: { id: fileUuid } },
				}).queryKey,
			});
			await queryClient.invalidateQueries({
				queryKey: $api.queryOptions('get', '/api/v1/uploads-dataset/').queryKey,
			});

			if (mode.kind === 'project-folder-file') {
				await openAPIClient.POST('/api/v1/uploads-dataset/{id}/unlock/', {
					params: { path: { id: fileUuid } },
				});
			}

			router.push(getRedirectPath(mode, fileUuid));
		},
		onError(error) {
			window.scrollTo({ top: 0, behavior: 'instant' });
			setError('root', {
				type: 'custom',
				message: error.message,
			});
		},
	});

	const formId = getFormId(mode);
	const showsTemplateMetadata = mode.kind === 'project-folder-file';
	const freeMetadataItems = showsTemplateMetadata
		? metadataFields
		: fields.map((field, originalIndex) => ({ field, originalIndex }));

	return (
		<form {...props} id={formId} onSubmit={handleSubmit((input) => mutate(input))} ref={props.ref}>
			<div className="flex flex-col gap-8">
				{errors.root ? (
					<Alert>
						<AlertCircleIcon aria-hidden className="shrink-0" size={24} strokeWidth={1.5} />
						{errors.root?.message}
					</Alert>
				) : null}

				{showsTemplateMetadata ? (
					<div className="flex place-content-between place-items-center gap-2 pt-2 text-base-xl text-base-neutral-900 dark:text-base-neutral-40">
						Additional metadata
						{data.latest_version?.metadata_is_complete ? null : <FileMissingMetadataIndicator />}
					</div>
				) : (
					<div className="pt-2 text-base-xl text-base-neutral-900 dark:text-base-neutral-40">Additional metadata</div>
				)}

				{showsTemplateMetadata && metadataTemplateFields.length ? (
					<div>
						{metadataTemplateFields.map(({ field, originalIndex }) => (
							<div className="relative mt-5 flex" key={field.id}>
								<div className="w-full">
									<div className="flex grow flex-col">
										<Controller
											control={control}
											name={`metadata.${originalIndex}`}
											render={({ field }) => (
												<MetadataTemplateFieldValueEditor
													configStrategy="preserve"
													disabledOptions={
														field.value?.previous_version_field &&
														originalSelectionFieldPks.has(field.value.previous_version_field)
															? []
															: ['SELECTION', 'MULTI_SELECTION']
													}
													errorMessage={errors.metadata?.[originalIndex]?.value}
													fieldConfig={field.value?.config}
													fieldType={getMetadataFieldTypeOrDefault(field.value?.field_type)}
													isDisabled={field.disabled ?? false}
													label={
														field.value?.metadata_template ? (
															<span className="flex grow place-content-between place-items-center gap-2">
																<span className="flex place-items-center gap-2">
																	{field.value.custom_key}
																	<Tooltip delay={400}>
																		<TooltipTrigger slot={null} variant="tooltip">
																			<Link
																				href={`/metadata-templates/${field.value.metadata_template.metadata_template_container.pk}?version=${field.value.metadata_template.pk}`}
																				target="_blank"
																			>
																				<BlocksIcon
																					aria-hidden
																					className="text-base-crystal-500 dark:text-base-crystal-300"
																					size={18}
																					strokeWidth={1.5}
																				/>
																			</Link>
																		</TooltipTrigger>
																		<TooltipContent arrow={false}>
																			{field.value.metadata_template.metadata_template_container.name}
																		</TooltipContent>
																	</Tooltip>
																</span>
																{field.value.mandatory && !field.value.value ? <FileMissingMetadataBadge /> : null}
															</span>
														) : (
															'Value'
														)
													}
													onBlur={field.onBlur}
													onChange={(next) => {
														field.onChange(
															mergeMetadataValueEditorChange(field.value as Record<string, unknown>, next),
														);
													}}
													value={field.value?.value}
												/>
											)}
										/>
									</div>
								</div>

								<MetadataBorder
									aria-label="Delete metadata entry"
									classNames={{ border: 'hidden' }}
									onPress={() => remove(originalIndex)}
								/>
							</div>
						))}
					</div>
				) : null}

				<div ref={dndContainerRef}>
					<DragDropProvider
						modifiers={[RestrictToVerticalAxis]}
						onDragEnd={(event) => {
							const sortableDragIndices = getSortableDragIndices(event);
							if (!sortableDragIndices) {
								return;
							}

							if (showsTemplateMetadata) {
								const dragIndex = sortableDragIndices.initialIndex;
								const dropIndex = sortableDragIndices.index;
								const fromFormIndex = metadataFields[dragIndex]?.originalIndex;
								const toFormIndex = metadataFields[dropIndex]?.originalIndex;
								if (fromFormIndex !== undefined && toFormIndex !== undefined) {
									move(fromFormIndex, toFormIndex);
								}
								return;
							}

							move(sortableDragIndices.initialIndex, sortableDragIndices.index);
						}}
					>
						<div className="flex flex-col gap-6">
							{freeMetadataItems.map(({ field, originalIndex }, localIndex) => (
								<MetadataItemWrapper
									dndContainerRef={dndContainerRef.current}
									id={field.id}
									idx={showsTemplateMetadata ? localIndex : originalIndex}
									key={field.id}
									onDelete={() => remove(originalIndex)}
								>
									<div className="w-full">
										<div className="flex grow flex-col">
											<Controller
												control={control}
												name={`metadata.${originalIndex}`}
												render={({ field }) => (
													<>
														<div className="bg-base-neutral-0 p-6 dark:bg-base-neutral-800">
															<TextField
																autoComplete="off"
																isDisabled={field.disabled ?? false}
																isInvalid={Boolean(errors.metadata?.[originalIndex]?.custom_key?.message)}
																onBlur={field.onBlur}
																onChange={(value) => {
																	field.onChange({
																		...field.value,
																		custom_key: value,
																	});
																}}
																value={field.value?.custom_key ?? ''}
															>
																<Label>Field name</Label>
																<InputGroup>
																	<Input placeholder="Field name" />
																	{field.value?.custom_key && !field.disabled && (
																		<Button
																			aria-label="Clear field name"
																			onPress={() =>
																				field.onChange({
																					...field.value,
																					custom_key: '',
																				})
																			}
																			size="icon"
																			variant="unset"
																		>
																			<XCircleIcon aria-hidden className="size-6 shrink-0 stroke-[1.5]" />
																		</Button>
																	)}
																</InputGroup>
																{errors.metadata?.[originalIndex]?.custom_key?.message ? (
																	<FieldError>{errors.metadata?.[originalIndex]?.custom_key?.message}</FieldError>
																) : null}
															</TextField>
														</div>
														<Separator className="m-0" />

														<div className="bg-base-neutral-40 dark:bg-base-neutral-700/40">
															<div className="px-6 py-5">
																<MetadataValueEditor
																	configStrategy={showsTemplateMetadata ? 'preserve' : 'reset'}
																	disabledOptions={
																		field.value?.previous_version_field &&
																		originalSelectionFieldPks.has(field.value.previous_version_field)
																			? []
																			: ['SELECTION', 'MULTI_SELECTION']
																	}
																	errorMessage={errors.metadata?.[originalIndex]?.value}
																	fieldConfig={field.value?.config}
																	fieldType={getMetadataFieldTypeOrDefault(field.value?.field_type)}
																	isDisabled={field.disabled ?? false}
																	label="Value"
																	onBlur={field.onBlur}
																	onChange={(next) => {
																		field.onChange(
																			mergeMetadataValueEditorChange(field.value as Record<string, unknown>, next),
																		);
																	}}
																	value={field.value?.value}
																/>
															</div>
														</div>
													</>
												)}
											/>
										</div>
									</div>
								</MetadataItemWrapper>
							))}

							{fields.length ? (
								<Button
									aria-label="Add metadata"
									onPress={() => append(createEmptyMetadataField())}
									size="icon"
									variant="secondary-tonal"
								>
									<PlusIcon aria-hidden size={18} strokeWidth={1.5} />
								</Button>
							) : (
								<Button
									aria-label="Add metadata"
									className="w-fit"
									onPress={() => append(createEmptyMetadataField())}
									variant="secondary-tonal"
								>
									<PlusIcon aria-hidden size={18} strokeWidth={1.5} /> Metadata
								</Button>
							)}
						</div>
					</DragDropProvider>
				</div>
			</div>
		</form>
	);
}
