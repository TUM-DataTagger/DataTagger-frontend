'use client';

import { RestrictToVerticalAxis } from '@dnd-kit/abstract/modifiers';
import { DragDropProvider } from '@dnd-kit/react';
import { HelpCircleIcon, PencilLineIcon, PlusIcon, XCircleIcon } from 'lucide-react';
import { useRef, useState } from 'react';
import {
	Controller,
	useFieldArray,
	type Control,
	type FieldErrors,
	type UseFormGetValues,
	type UseFormSetValue,
} from 'react-hook-form';
import type { InferInput } from 'valibot';
import { getMetadataFieldTypeOrDefault, MetadataItemWrapper } from '@/components/Metadata';
import {
	MetadataTemplateFieldDefinitionValueEditor,
	mergeMetadataValueEditorChange,
} from '@/components/MetadataValueEditor';
import { MetadataTemplateFieldGuidanceDialog } from '@/components/metadata-template/fields/MetadataTemplateFieldGuidanceDialog';
import { Button } from '@/components/ui/Button';
import { Checkbox, CheckboxLabel } from '@/components/ui/Checkbox';
import { FieldError, Label } from '@/components/ui/Field';
import { Input, InputGroup } from '@/components/ui/Input';
import { Separator } from '@/components/ui/Separator';
import { TextField } from '@/components/ui/TextField';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/Tooltip';
import type { MetadataTemplateSchema } from '@/schemas/MetadataTemplateSchema';
import { linkStyles } from '@/styles/ui/link';
import { getSortableDragIndices } from '@/util/dndSortable';
import {
	getMetadataFieldDescription,
	removeMetadataFieldDescription,
	setMetadataFieldDescription,
} from '@/util/metadataFieldConfig';

type MetadataTemplateFormInput = InferInput<typeof MetadataTemplateSchema>;
type MetadataTemplateFieldInput = NonNullable<MetadataTemplateFormInput['metadata_template_fields']>[number];

export const EMPTY_METADATA_TEMPLATE_FIELD = {
	custom_key: '',
	value: '',
	mandatory: false,
	field_type: 'TEXT',
	config: {},
} satisfies MetadataTemplateFieldInput;

export function createEmptyMetadataTemplateField(): MetadataTemplateFieldInput {
	return {
		...EMPTY_METADATA_TEMPLATE_FIELD,
		config: {},
	};
}

type MetadataTemplateFieldsEditorProps = {
	readonly control: Control<MetadataTemplateFormInput>;
	readonly errors: FieldErrors<MetadataTemplateFormInput>;
	readonly getValues: UseFormGetValues<MetadataTemplateFormInput>;
	readonly setValue: UseFormSetValue<MetadataTemplateFormInput>;
};

export function MetadataTemplateFieldsEditor({
	control,
	errors,
	getValues,
	setValue,
}: MetadataTemplateFieldsEditorProps) {
	const dndContainerRef = useRef<HTMLDivElement>(null);
	const { fields, append, move, remove } = useFieldArray<MetadataTemplateFormInput>({
		control,
		name: 'metadata_template_fields',
	});

	const [guidanceFieldIndex, setGuidanceFieldIndex] = useState<number | null>(null);
	const [guidanceInitialValue, setGuidanceInitialValue] = useState('');
	const [isGuidanceEditMode, setIsGuidanceEditMode] = useState(false);
	const isGuidanceModalOpen = guidanceFieldIndex !== null;

	const closeGuidanceModal = () => {
		setGuidanceFieldIndex(null);
		setGuidanceInitialValue('');
		setIsGuidanceEditMode(false);
	};

	const onGuidanceModalOpenChange = (isOpen: boolean) => {
		if (!isOpen) {
			closeGuidanceModal();
		}
	};

	const openGuidanceModal = (index: number, config: unknown) => {
		const existingDescription = getMetadataFieldDescription(config);
		setGuidanceFieldIndex(index);
		setGuidanceInitialValue(existingDescription);
		setIsGuidanceEditMode(Boolean(existingDescription.trim()));
	};

	const saveGuidance = (guidanceValue: string) => {
		if (guidanceFieldIndex === null) {
			return;
		}

		const trimmedGuidanceValue = guidanceValue.trim();
		if (!trimmedGuidanceValue) {
			return;
		}

		const metadataTemplateFields = getValues('metadata_template_fields') ?? [];
		const currentField = metadataTemplateFields[guidanceFieldIndex];

		if (!currentField) {
			return;
		}

		setValue(
			'metadata_template_fields',
			metadataTemplateFields.map((metadataTemplateField, index) =>
				index === guidanceFieldIndex
					? {
							...metadataTemplateField,
							config: setMetadataFieldDescription(currentField.config, trimmedGuidanceValue),
						}
					: metadataTemplateField,
			),
			{ shouldDirty: true },
		);

		closeGuidanceModal();
	};

	const removeGuidance = () => {
		if (guidanceFieldIndex === null) {
			return;
		}

		const metadataTemplateFields = getValues('metadata_template_fields') ?? [];
		const currentField = metadataTemplateFields[guidanceFieldIndex];

		if (!currentField) {
			return;
		}

		setValue(
			'metadata_template_fields',
			metadataTemplateFields.map((metadataTemplateField, index) =>
				index === guidanceFieldIndex
					? {
							...metadataTemplateField,
							config: removeMetadataFieldDescription(currentField.config),
						}
					: metadataTemplateField,
			),
			{ shouldDirty: true },
		);

		closeGuidanceModal();
	};

	return (
		<>
			<div ref={dndContainerRef}>
				<DragDropProvider
					modifiers={[RestrictToVerticalAxis]}
					onDragEnd={(event) => {
						const sortableDragIndices = getSortableDragIndices(event);
						if (!sortableDragIndices) {
							return;
						}

						move(sortableDragIndices.initialIndex, sortableDragIndices.index);
					}}
				>
					<div className="flex flex-col gap-6">
						{fields.map((field, index) => (
							<MetadataItemWrapper
								dndContainerRef={dndContainerRef.current}
								id={field.id}
								idx={index}
								key={field.id}
								onDelete={() => remove(index)}
							>
								<div className="w-full">
									<div className="flex grow flex-col">
										<Controller
											control={control}
											name={`metadata_template_fields.${index}`}
											render={({ field }) => {
												const guidanceDescription = getMetadataFieldDescription(field.value?.config);
												const hasGuidance = Boolean(guidanceDescription.trim());

												return (
													<>
														<div className="bg-base-neutral-0 p-6 dark:bg-base-neutral-800">
															<TextField
																autoComplete="off"
																isDisabled={field.disabled ?? false}
																isInvalid={Boolean(errors.metadata_template_fields?.[index]?.custom_key?.message)}
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
																{errors.metadata_template_fields?.[index]?.custom_key?.message ? (
																	<FieldError>
																		{errors.metadata_template_fields?.[index]?.custom_key?.message}
																	</FieldError>
																) : null}
															</TextField>
														</div>
														<Separator className="m-0" />
														<div className="bg-base-neutral-40 dark:bg-base-neutral-700/40">
															<div className="px-6 py-5">
																<MetadataTemplateFieldDefinitionValueEditor
																	configStrategy="preserve"
																	errorMessage={errors.metadata_template_fields?.[index]?.value}
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
														<Separator className="m-0" />
														<div className="flex place-content-between place-items-center bg-base-neutral-0 p-6 dark:bg-base-neutral-800">
															<Checkbox
																isDisabled={field.disabled ?? false}
																isSelected={field.value?.mandatory ?? false}
																onBlur={field.onBlur}
																onChange={(value) => {
																	field.onChange({
																		...field.value,
																		mandatory: value,
																	});
																}}
															>
																<span className="flex place-items-center gap-1">
																	<CheckboxLabel className="text-base-sm">Required</CheckboxLabel>
																	<Tooltip delay={400}>
																		<TooltipTrigger variant="tooltip">
																			<HelpCircleIcon aria-hidden size={18} strokeWidth={1.5} />
																		</TooltipTrigger>
																		<TooltipContent arrow={false} variant="rich">
																			Selection specifies that this item cannot be removed from a file.
																		</TooltipContent>
																	</Tooltip>
																</span>
															</Checkbox>

															<div className="flex items-center gap-3">
																{hasGuidance ? (
																	<span
																		className="max-w-[120px] truncate text-base-sm text-base-neutral-600 md:max-w-[290px] dark:text-base-neutral-300"
																		title={guidanceDescription}
																	>
																		{guidanceDescription}
																	</span>
																) : null}
																<Button
																	aria-label={hasGuidance ? 'Edit fill-in guidance' : undefined}
																	className={
																		hasGuidance
																			? ''
																			: linkStyles({
																					variant: 'neutral',
																				})
																	}
																	onPress={() => openGuidanceModal(index, field.value?.config)}
																	size={hasGuidance ? 'icon-xs' : 'default'}
																	variant={hasGuidance ? 'secondary-discreet' : 'unset'}
																>
																	{hasGuidance ? (
																		<PencilLineIcon
																			aria-hidden
																			className="shrink-0 text-base-lavender-600 dark:text-base-lavender-400"
																			size={16}
																			strokeWidth={1.5}
																		/>
																	) : (
																		'Add fill-in guidance'
																	)}
																</Button>
															</div>
														</div>
													</>
												);
											}}
										/>
									</div>
								</div>
							</MetadataItemWrapper>
						))}

						{fields.length ? (
							<Button
								aria-label="Add metadata field"
								onPress={() => append(createEmptyMetadataTemplateField())}
								size="icon"
								variant="secondary-tonal"
							>
								<PlusIcon aria-hidden size={18} strokeWidth={1.5} />
							</Button>
						) : (
							<Button
								aria-label="Add metadata field"
								className="w-fit"
								onPress={() => append(createEmptyMetadataTemplateField())}
								variant="secondary-tonal"
							>
								<PlusIcon aria-hidden size={18} strokeWidth={1.5} /> Metadata field
							</Button>
						)}
					</div>
				</DragDropProvider>
			</div>

			<MetadataTemplateFieldGuidanceDialog
				initialValue={guidanceInitialValue}
				isEditMode={isGuidanceEditMode}
				isOpen={isGuidanceModalOpen}
				onOpenChange={onGuidanceModalOpenChange}
				onRemove={removeGuidance}
				onSave={saveGuidance}
			/>
		</>
	);
}
