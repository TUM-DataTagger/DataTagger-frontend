'use client';

import { valibotResolver } from '@hookform/resolvers/valibot';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircleIcon, HelpCircleIcon, PlusIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { ComponentProps } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import type { InferInput } from 'valibot';
import { MetadataBorder, Metadata } from '@/components/Metadata';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Label } from '@/components/ui/Field';
import { Separator } from '@/components/ui/Separator';
import { TextField } from '@/components/ui/TextField';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/Tooltip';
import { MetadataTemplateSchema } from '@/schemas/MetadataTemplateSchema';
import { $api, openAPIClient } from '@/util/clientFetch';
import { formatErrorMessage } from '@/util/formatErrorMessage';
import type { components } from '@/util/openapiSchema';

type MetadataTemplateEditInput = InferInput<typeof MetadataTemplateSchema>;

export function MetadataTemplateEditMetadataFieldsForm({
	metadataTemplateUuid,
	data,
	metadataTemplateFieldsData,
	...props
}: ComponentProps<'form'> & {
	readonly data: components['schemas']['MetadataTemplate'];
	readonly metadataTemplateFieldsData: components['schemas']['MetadataTemplateField'][] | undefined;
	readonly metadataTemplateUuid: string;
}) {
	const router = useRouter();
	const queryClient = useQueryClient();

	console.log('INITIAL DATA:', metadataTemplateFieldsData);

	const {
		control,
		handleSubmit,
		setError,
		formState: { errors },
	} = useForm<MetadataTemplateEditInput>({
		resolver: valibotResolver(MetadataTemplateSchema),
		defaultValues: {
			name: data.name ?? '',
			assigned_to_content_type: data.assigned_to_content_type ?? null,
			assigned_to_object_id: data.assigned_to_object_id ?? null,
			metadata_template_fields:
				(metadataTemplateFieldsData ?? []).map((field) => ({
					custom_key: field.custom_key ?? '',
					value: field.value ?? '',
					mandatory: field.mandatory ?? false,
					field_type: field.field_type ?? 'TEXT',
					config: field.config ?? {},
				})) ?? [],
		},
	});

	console.log('FORM ERRORS:', errors);

	const { fields, append, remove } = useFieldArray<MetadataTemplateEditInput>({
		control,
		name: 'metadata_template_fields',
	});

	const { mutate } = useMutation({
		mutationFn: async (input: MetadataTemplateEditInput) => {
			const payload = {
				name: input.name,
				assigned_to_content_type: input.assigned_to_content_type ?? null,
				assigned_to_object_id: input.assigned_to_object_id ?? null,
				metadata_template_fields: input.metadata_template_fields ?? [],
			};

			console.log('PAYLOAD:', payload);

			const { error: metadataTemplateError, response: metadataTemplateResponse } = await openAPIClient.PUT(
				'/api/v1/metadata-template/{id}/',
				{
					params: { path: { id: metadataTemplateUuid } },
					body: payload,
				},
			);

			if (metadataTemplateError) {
				throw new Error(formatErrorMessage(metadataTemplateError, metadataTemplateResponse));
			}
		},
		async onSuccess() {
			await queryClient.invalidateQueries({
				queryKey: $api.queryOptions('get', '/api/v1/metadata-template/{id}/', {
					params: { path: { id: metadataTemplateUuid } },
				}).queryKey,
			});
			await queryClient.invalidateQueries({
				queryKey: $api.queryOptions('get', '/api/v1/metadata-template-field/', {
					params: { query: { metadata_template: metadataTemplateUuid } },
				}).queryKey,
			});

			router.push(`/metadata-templates/${metadataTemplateUuid}`);
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
		<form {...props} id="metadata-template-edit-metadata-fields" onSubmit={handleSubmit((input) => mutate(input))}>
			<div className="flex flex-col gap-8">
				{errors.root ? (
					<Alert>
						<AlertCircleIcon aria-hidden size={24} strokeWidth={1.5} />
						{errors.root?.message}
					</Alert>
				) : null}

				<div className="text-base-xl text-base-neutral-900 dark:text-base-neutral-40 pt-2">Metadata fields</div>

				<div className="flex flex-col gap-8">
					{fields.map((field, index) => (
						<div className="relative mt-5 flex" key={field.id}>
							<div className="w-full">
								<div className="flex grow flex-col">
									<Controller
										control={control}
										name={`metadata_template_fields.${index}`}
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
												<Separator className="m-0" />
												<div className="p-6">
													<Checkbox
														isDisabled={field.disabled ?? false}
														isSelected={field.value.mandatory ?? false}
														onBlur={field.onBlur}
														onChange={(value) => {
															field.onChange({
																...field.value,
																mandatory: value,
															});
														}}
													>
														<span className="flex place-items-center gap-1">
															<Label className="text-base-label-md/4">Required</Label>
															<Tooltip delay={400}>
																<TooltipTrigger variant="tooltip">
																	<HelpCircleIcon aria-hidden size={18} strokeWidth={1.5} />
																</TooltipTrigger>
																<TooltipContent showArrow={false} variant="rich">
																	Selection specifies that this item cannot be removed from a file.
																</TooltipContent>
															</Tooltip>
														</span>
													</Checkbox>
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
							aria-label="Add metadata field"
							onPress={() => append({ custom_key: '', value: '', mandatory: false, field_type: 'TEXT', config: {} })}
							size="icon"
							variant="secondary-tonal"
						>
							<PlusIcon aria-hidden size={18} strokeWidth={1.5} />
						</Button>
					) : (
						<Button
							aria-label="Add metadata field"
							className="w-fit"
							onPress={() => append({ custom_key: '', value: '', mandatory: false, field_type: 'TEXT', config: {} })}
							variant="secondary-tonal"
						>
							<PlusIcon aria-hidden className="mr-2" size={18} strokeWidth={1.5} /> Metadata field
						</Button>
					)}
				</div>
			</div>
		</form>
	);
}
