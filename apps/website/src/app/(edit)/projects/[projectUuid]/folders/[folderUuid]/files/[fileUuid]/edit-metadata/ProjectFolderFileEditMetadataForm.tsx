'use client';

import { valibotResolver } from '@hookform/resolvers/valibot';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cx } from 'cva';
import { AlertCircleIcon, BlocksIcon, PlusIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { ComponentProps } from 'react';
import { Controller, useFieldArray, useForm, useFormState } from 'react-hook-form';
import type { InferInput } from 'valibot';
import { MetadataBorder, Metadata } from '@/components/Metadata';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Separator } from '@/components/ui/Separator';
import { TextField } from '@/components/ui/TextField';
import { FileSchema } from '@/schemas/FileSchema';
import { $api, openAPIClient } from '@/util/clientFetch';
import { formatErrorMessage } from '@/util/formatErrorMessage';
import type { components } from '@/util/openapiSchema';

type ProjectFolderFileEditInput = InferInput<typeof FileSchema>;

export function ProjectFolderFileEditMetadataForm({
	fileMetadata,
	fileUuid,
	projectUuid,
	folderUuid,
	data,
	...props
}: ComponentProps<'form'> & {
	readonly data: components['schemas']['UploadsDataset'];
	readonly fileMetadata?: components['schemas']['UploadsVersion'] | undefined;
	readonly fileUuid: string;
	readonly folderUuid: string;
	readonly projectUuid: string;
}) {
	// eslint-disable-next-line react-compiler/react-compiler
	'use no memo';

	const router = useRouter();
	const queryClient = useQueryClient();

	const {
		control,
		handleSubmit,
		setError,
		formState: { errors },
	} = useForm<ProjectFolderFileEditInput>({
		resolver: valibotResolver(FileSchema),
		defaultValues: {
			name: data.display_name ?? '',
			metadata: (fileMetadata?.metadata ?? []).map((metadata) => ({
				custom_key: metadata.custom_key ?? '',
				value: metadata.value ?? '',
				field_type: metadata.field_type ?? 'TEXT',
				config: metadata.config ?? {},
				metadata_template_field: metadata.metadata_template_field ?? null,
			})),
		},
	});

	const { fields, append, remove } = useFieldArray<ProjectFolderFileEditInput>({
		control,
		name: 'metadata',
	});

	const { defaultValues } = useFormState({ control, name: 'metadata' });

	const { mutate } = useMutation({
		mutationFn: async (input: { metadata: Omit<ProjectFolderFileEditInput['metadata'][number], 'field'>[] }) => {
			const { error: metadataError, response: metadataResponse } = await openAPIClient.POST(
				'/api/v1/uploads-dataset/{id}/version/',
				{
					params: { path: { id: fileUuid } },
					body: { metadata: input.metadata },
				},
			);

			if (metadataError) {
				throw new Error(formatErrorMessage(metadataError, metadataResponse));
			}
		},
		async onSuccess() {
			await queryClient.invalidateQueries({
				queryKey: $api.queryOptions('get', '/api/v1/uploads-dataset/{id}/', {
					params: { path: { id: fileUuid } },
				}).queryKey,
			});
			await openAPIClient.POST('/api/v1/uploads-dataset/{id}/unlock/', {
				params: { path: { id: fileUuid } },
			});

			router.push(`/projects/${projectUuid}/folders/${folderUuid}/files/${fileUuid}`);
		},
		onError(error) {
			window.scrollTo({ top: 0, behavior: 'instant' });
			setError('root', {
				type: 'custom',
				message: error.message,
			});
		},
	});

	return (
		<form {...props} id="project-folder-file-edit-metadata" onSubmit={handleSubmit((input) => mutate(input))}>
			<div className="flex flex-col gap-8">
				{errors.root ? (
					<Alert>
						<AlertCircleIcon aria-hidden size={24} strokeWidth={1.5} />
						{errors.root?.message}
					</Alert>
				) : null}

				<div className="text-base-xl text-base-neutral-900 dark:text-base-neutral-40 pt-2">Additional metadata</div>

				<div className="flex flex-col gap-8">
					{fields.map((field, index) => (
						<div
							className={cx('relative flex', !defaultValues?.metadata?.[index]?.metadata_template_field && 'mt-5')}
							key={field.id}
						>
							<div className="w-full">
								<div className="flex grow flex-col">
									<Controller
										control={control}
										name={`metadata.${index}`}
										render={({ field, fieldState }) => (
											<>
												{field.value.metadata_template_field ? null : (
													<>
														<div className="p-6">
															<TextField
																autoComplete="off"
																// @ts-expect-error: custom_key exists on error
																errorMessage={fieldState.error?.custom_key?.message}
																isClearable
																isDisabled={field.disabled ?? false}
																isReadOnly={Boolean(field.value.metadata_template_field)}
																label="Field name"
																onBlur={field.onBlur}
																onChange={(value) => {
																	field.onChange({
																		...field.value,
																		custom_key: value,
																	});
																}}
																placeholder="Field name"
																type="text"
																value={field.value.custom_key ?? ''}
															/>
														</div>
														<Separator className="m-0" />
													</>
												)}
												<div
													className={
														field.value.metadata_template_field ? '' : 'bg-base-neutral-40 dark:bg-base-neutral-700/40'
													}
												>
													<div className={field.value.metadata_template_field ? '' : 'px-6 py-5'}>
														<Metadata
															disabledOptions={['SELECTION']}
															// @ts-expect-error: value exists on error
															errorMessage={fieldState.error?.value}
															fieldConfig={field.value.config}
															fieldType={
																field.value.field_type as components['schemas']['MetadataTemplateField']['field_type']
															}
															isDisabled={field.disabled ?? false}
															isMetadataTemplateField={Boolean(field.value.metadata_template_field)}
															label={
																field.value.metadata_template_field ? (
																	<span className="flex place-items-center gap-2">
																		{field.value.custom_key}
																		<BlocksIcon
																			aria-hidden
																			className="text-base-crystal-500 dark:text-base-crystal-300"
																			size={18}
																			strokeWidth={1.5}
																		/>
																	</span>
																) : (
																	'Value'
																)
															}
															onBlur={field.onBlur}
															onChange={(value) => {
																if (value.fieldType === 'SELECTION') {
																	field.onChange({
																		...field.value,
																		field_type: value.fieldType,
																		value: typeof value.value === 'string' ? value.value : value.value?.selectedValue,
																		config: typeof value.value === 'string' ? {} : { options: value.value?.options },
																	});
																} else if (value.fieldType === 'WYSIWYG') {
																	field.onChange({
																		...field.value,
																		field_type: value.fieldType,
																		value: value.value,
																		config: {},
																	});
																} else {
																	field.onChange({
																		...field.value,
																		field_type: value.fieldType,
																		value: typeof value.value === 'string' ? value.value : undefined,
																		config: {},
																	});
																}
															}}
															value={field.value.value ?? ''}
														/>
													</div>
												</div>
											</>
										)}
									/>
								</div>
							</div>

							<MetadataBorder
								aria-label="Delete metadata entry"
								classNames={{ border: defaultValues?.metadata?.[index]?.metadata_template_field ? 'hidden' : '' }}
								onPress={() => remove(index)}
							/>
						</div>
					))}

					{fields.length ? (
						<Button
							aria-label="Add metadata"
							onPress={() =>
								append({ custom_key: '', value: '', field_type: 'TEXT', config: {}, isMetadataTemplateField: false })
							}
							size="icon"
							variant="secondary-tonal"
						>
							<PlusIcon aria-hidden size={18} strokeWidth={1.5} />
						</Button>
					) : (
						<Button
							aria-label="Add metadata"
							className="w-fit"
							onPress={() =>
								append({ custom_key: '', value: '', field_type: 'TEXT', config: {}, isMetadataTemplateField: false })
							}
							variant="secondary-tonal"
						>
							<PlusIcon aria-hidden size={18} strokeWidth={1.5} /> Metadata
						</Button>
					)}
				</div>
			</div>
		</form>
	);
}
