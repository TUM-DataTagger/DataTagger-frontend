'use client';

import { valibotResolver } from '@hookform/resolvers/valibot';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircleIcon, PlusIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { ComponentProps } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
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

export function DraftFileEditMetadataForm({
	fileMetadata,
	fileUuid,
	data,
	...props
}: ComponentProps<'form'> & {
	readonly data: components['schemas']['UploadsDataset'];
	readonly fileMetadata?: components['schemas']['UploadsVersion'] | undefined;
	readonly fileUuid: string;
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
			metadata: (fileMetadata?.metadata ?? []).map((field) => ({
				custom_key: field.custom_key ?? '',
				value: field.value ?? '',
				field_type: field.field_type ?? 'TEXT',
				config: field.config ?? {},
			})),
		},
	});

	const { fields, append, remove } = useFieldArray<ProjectFolderFileEditInput>({
		control,
		name: 'metadata',
	});

	// const { dirtyFields } = useFormState({ control, name: 'metadata' });

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

			router.push(`/drafts/${fileUuid}`);
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
		<form {...props} id="draft-file-edit-metadata" onSubmit={handleSubmit((input) => mutate(input))}>
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
						<div className="relative mt-5 flex" key={field.id}>
							<div className="w-full">
								<div className="flex grow flex-col">
									<Controller
										control={control}
										name={`metadata.${index}`}
										render={({ field, fieldState }) => (
											<>
												<div className="p-6">
													<TextField
														autoComplete="off"
														// @ts-expect-error: custom_key exists on error
														errorMessage={fieldState.error?.custom_key?.message}
														isClearable
														isDisabled={field.disabled ?? false}
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
												<div className="bg-base-neutral-40 dark:bg-base-neutral-700/40">
													<div className="px-6 py-5">
														<Metadata
															disabledOptions={['SELECTION']}
															// @ts-expect-error: value exists on error
															errorMessage={fieldState.error?.value}
															fieldConfig={field.value.config}
															fieldType={
																field.value.field_type as components['schemas']['MetadataTemplateField']['field_type']
															}
															isDisabled={field.disabled ?? false}
															label="Value"
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

							<MetadataBorder aria-label="Delete metadata entry" onPress={() => remove(index)} />
						</div>
					))}

					{fields.length ? (
						<Button
							aria-label="Add metadata"
							onPress={() => append({ custom_key: '', value: '', field_type: 'TEXT', config: {} })}
							size="icon"
							variant="secondary-tonal"
						>
							<PlusIcon aria-hidden size={18} strokeWidth={1.5} />
						</Button>
					) : (
						<Button
							aria-label="Add metadata"
							className="w-fit"
							onPress={() => append({ custom_key: '', value: '', field_type: 'TEXT', config: {} })}
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
