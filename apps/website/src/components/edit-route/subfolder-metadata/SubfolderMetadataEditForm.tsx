'use client';

import { RestrictToVerticalAxis } from '@dnd-kit/abstract/modifiers';
import { DragDropProvider } from '@dnd-kit/react';
import { valibotResolver } from '@hookform/resolvers/valibot';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircleIcon, PlusIcon, XCircleIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useRef, type ComponentProps } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { object, type InferInput } from 'valibot';
import { getMetadataFieldTypeOrDefault, MetadataItemWrapper } from '@/components/Metadata';
import { MetadataValueEditor, mergeMetadataValueEditorChange } from '@/components/MetadataValueEditor';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { FieldError, Label } from '@/components/ui/Field';
import { Input, InputGroup } from '@/components/ui/Input';
import { Separator } from '@/components/ui/Separator';
import { TextField } from '@/components/ui/TextField';
import { MetadataSchema } from '@/schemas/MetadataSchema';
import { openAPIClient } from '@/util/clientFetch';
import { getSortableDragIndices } from '@/util/dndSortable';
import { formatErrorMessage } from '@/util/formatErrorMessage';
import type { components } from '@/util/openapiSchema';
import { trimMetadataPayload } from '@/util/trimMetadataPayload';

const SubfolderMetadataSchema = object({
	metadata: MetadataSchema.entries.metadata,
});

type SubfolderMetadataEditInput = InferInput<typeof SubfolderMetadataSchema>;
type SubfolderMetadataEditField = NonNullable<SubfolderMetadataEditInput['metadata']>[number];
type SubfolderMetadataEditFieldWithId = SubfolderMetadataEditField & { readonly id: string };

export const SUBFOLDER_METADATA_FORM_ID = 'subfolder-edit-metadata';

function createEmptyMetadataField() {
	return {
		custom_key: '',
		value: '',
		field_type: 'TEXT' as const,
		config: {},
	};
}

/**
 * Edits the metadata of a subfolder with the same field editor as the additional metadata of files.
 */
export function SubfolderMetadataEditForm({
	subfolder,
	redirectPath,
	...props
}: ComponentProps<'form'> & {
	readonly redirectPath: string;
	readonly subfolder: components['schemas']['Subfolder'];
}) {
	const router = useRouter();
	const queryClient = useQueryClient();
	const dndContainerRef = useRef<HTMLDivElement>(null);

	const {
		control,
		handleSubmit,
		setError,
		formState: { errors },
	} = useForm<SubfolderMetadataEditInput>({
		resolver: valibotResolver(SubfolderMetadataSchema),
		defaultValues: {
			metadata: subfolder.metadata.map((field) => ({
				custom_key: field.custom_key ?? '',
				value: field.value ?? '',
				field_type: field.field_type ?? 'TEXT',
				config: field.config ?? {},
			})),
		},
	});

	const {
		fields: rawFields,
		append,
		remove,
		move,
	} = useFieldArray<SubfolderMetadataEditInput>({
		control,
		name: 'metadata',
	});
	const fields = rawFields as SubfolderMetadataEditFieldWithId[];

	const { mutate } = useMutation({
		mutationFn: async (input: SubfolderMetadataEditInput) => {
			const { error, response } = await openAPIClient.PUT('/api/v1/subfolder/{id}/metadata/', {
				params: { path: { id: subfolder.pk } },
				body: {
					metadata: trimMetadataPayload(
						(input.metadata ?? []).map((field) => ({
							custom_key: field.custom_key ?? '',
							field_type: getMetadataFieldTypeOrDefault(field.field_type),
							value: field.value,
							config: field.config ?? {},
						})),
					),
				},
			});

			if (error) {
				throw new Error(formatErrorMessage(error, response));
			}
		},
		async onSuccess() {
			await queryClient.invalidateQueries({ queryKey: ['get', '/api/v1/subfolder/{id}/'] });
			await queryClient.invalidateQueries({ queryKey: ['get', '/api/v1/subfolder/'] });
			router.push(redirectPath);
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
		<form {...props} id={SUBFOLDER_METADATA_FORM_ID} onSubmit={handleSubmit((input) => mutate(input))} ref={props.ref}>
			<div className="flex flex-col gap-8">
				{errors.root ? (
					<Alert>
						<AlertCircleIcon aria-hidden className="shrink-0" size={24} strokeWidth={1.5} />
						{errors.root?.message}
					</Alert>
				) : null}

				<div className="pt-2 text-base-xl text-base-neutral-900 dark:text-base-neutral-40">Metadata</div>

				<div ref={dndContainerRef}>
					<DragDropProvider
						modifiers={[RestrictToVerticalAxis]}
						onDragEnd={(event) => {
							const sortableDragIndices = getSortableDragIndices(event);
							if (sortableDragIndices) {
								move(sortableDragIndices.initialIndex, sortableDragIndices.index);
							}
						}}
					>
						<div className="flex flex-col gap-6">
							{fields.map((item, index) => (
								<MetadataItemWrapper
									dndContainerRef={dndContainerRef.current}
									id={item.id}
									idx={index}
									key={item.id}
									onDelete={() => remove(index)}
								>
									<div className="w-full">
										<div className="flex grow flex-col">
											<Controller
												control={control}
												name={`metadata.${index}`}
												render={({ field }) => (
													<>
														<div className="bg-base-neutral-0 p-6 dark:bg-base-neutral-800">
															<TextField
																autoComplete="off"
																isDisabled={field.disabled ?? false}
																isInvalid={Boolean(errors.metadata?.[index]?.custom_key?.message)}
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
																	{field.value?.custom_key && !field.disabled ? (
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
																	) : null}
																</InputGroup>
																{errors.metadata?.[index]?.custom_key?.message ? (
																	<FieldError>{errors.metadata?.[index]?.custom_key?.message}</FieldError>
																) : null}
															</TextField>
														</div>
														<Separator className="m-0" />

														<div className="bg-base-neutral-40 dark:bg-base-neutral-700/40">
															<div className="px-6 py-5">
																<MetadataValueEditor
																	configStrategy="reset"
																	disabledOptions={['SELECTION', 'MULTI_SELECTION']}
																	errorMessage={errors.metadata?.[index]?.value}
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
