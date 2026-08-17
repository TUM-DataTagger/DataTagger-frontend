'use client';

import { RestrictToElement } from '@dnd-kit/dom/modifiers';
import { useSortable } from '@dnd-kit/react/sortable';
import { valibotResolver } from '@hookform/resolvers/valibot';
import { getLocalTimeZone, now, parseDate, parseTime, today } from '@internationalized/date';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
	BlocksIcon,
	CalendarIcon,
	CheckIcon,
	ChevronDownIcon,
	ChevronUpIcon,
	ClockIcon,
	CopyIcon,
	GripVerticalIcon,
	Loader2Icon,
	PlusIcon,
	SquareMousePointerIcon,
	SquarePenIcon,
	SwatchBookIcon,
	WholeWordIcon,
	XCircleIcon,
} from 'lucide-react';
import {
	useEffect,
	useId,
	useRef,
	useState,
	type ComponentType,
	type PropsWithChildren,
	type ReactNode,
	type Ref,
} from 'react';
import { type Selection } from 'react-aria-components';
import { useFieldArray, useForm, Controller } from 'react-hook-form';
import { useCopyToClipboard } from 'usehooks-ts';
import { ISO_TIME_SECOND_REGEX, ISO_DATE_REGEX, type InferInput } from 'valibot';
import { Editor } from '@/components/editor/Editor';
import { FileMissingMetadataBadge } from '@/components/file-metadata/FileMetadataIndicators';
import { DecimalIcon } from '@/components/icons/DecimalIcon';
import { IntegerIcon } from '@/components/icons/IntegerIcon';
import { MultiSelectIcon } from '@/components/icons/MultiSelectIcon';
import { Button, type ButtonProps } from '@/components/ui/Button';
import { boxStyles, Checkbox, CheckboxGroup } from '@/components/ui/Checkbox';
import { DatePicker, DatePickerTrigger } from '@/components/ui/DatePicker';
import { Description, FieldError, Label } from '@/components/ui/Field';
import { Form, useDialogForm } from '@/components/ui/Form';
import { Input, InputGroup } from '@/components/ui/Input';
import { Link } from '@/components/ui/Link';
import { Menu, MenuContent, MenuItem, MenuTrigger } from '@/components/ui/Menu';
import { ModalBody, ModalClose, ModalContent, ModalFooter, ModalHeader, ModalTitle } from '@/components/ui/Modal';
import { NumberField, NumberInput } from '@/components/ui/NumberField';
import { Radio, RadioGroup, radioStyles } from '@/components/ui/RadioGroup';
import { Select, SelectLabel, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/Select';
import { Separator } from '@/components/ui/Separator';
import { Switch } from '@/components/ui/Switch';
import { Tag, TagGroup, tagStyles } from '@/components/ui/TagGroup';
import { TextField } from '@/components/ui/TextField';
import { TimeField, TimeInput } from '@/components/ui/TimeField';
import { globalToastQueue, ToastType } from '@/components/ui/Toast';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/Tooltip';
import { useExitFilesBulkMode } from '@/hooks/useExitFilesBulkMode';
import { MetadataSchema } from '@/schemas/MetadataSchema';
import { cx } from '@/styles/cva';
import { linkStyles } from '@/styles/ui/link';
import { $api, openAPIClient } from '@/util/clientFetch';
import { formatErrorMessage } from '@/util/formatErrorMessage';
import { logger, LogCategory } from '@/util/logger';
import type { DiffField, MetadataFieldDiffTimelineEntry } from '@/util/metadataDiff';
import { getMetadataFieldTrimmedDescription } from '@/util/metadataFieldConfig';
import { getMetadataOptionValidationMessagesByIndex } from '@/util/metadataOptionValidation';
import type { components } from '@/util/openapiSchema';
import { trimMetadataPayload } from '@/util/trimMetadataPayload';

type MetadataFieldEntry = DiffField & {
	readonly metadata_template?: components['schemas']['MetadataTemplate'] | null;
};

export type MetadataFieldType = NonNullable<components['schemas']['MetadataTemplateField']['field_type']>;
const SELECTION_FIELD_TYPES = ['SELECTION', 'MULTI_SELECTION'] as const satisfies readonly MetadataFieldType[];
type SelectionFieldType = (typeof SELECTION_FIELD_TYPES)[number];

export const metadataFieldTypes = [
	{
		icon: <WholeWordIcon aria-hidden data-slot="icon" size={18} strokeWidth={1.5} />,
		label: 'Text',
		fieldType: 'TEXT',
	},
	{
		icon: <IntegerIcon aria-hidden data-slot="icon" height={18} strokeWidth={1.5} width={18} />,
		label: 'Integer',
		fieldType: 'INTEGER',
	},
	{
		icon: <DecimalIcon aria-hidden data-slot="icon" height={18} strokeWidth={1.5} width={18} />,
		label: 'Decimal',
		fieldType: 'DECIMAL',
	},
	{
		icon: <CalendarIcon aria-hidden data-slot="icon" size={18} strokeWidth={1.5} />,
		label: 'Date',
		fieldType: 'DATE',
	},
	{
		icon: <ClockIcon aria-hidden data-slot="icon" size={18} strokeWidth={1.5} />,
		label: 'Time',
		fieldType: 'TIME',
	},
	{
		icon: <SquarePenIcon aria-hidden data-slot="icon" size={18} strokeWidth={1.5} />,
		label: 'Editor',
		fieldType: 'WYSIWYG',
	},
	{
		icon: <SquareMousePointerIcon aria-hidden data-slot="icon" size={18} strokeWidth={1.5} />,
		label: 'Single select',
		fieldType: 'SELECTION',
	},
	{
		icon: <MultiSelectIcon aria-hidden data-slot="icon" height={18} width={18} strokeWidth={1.5} />,
		label: 'Multi select',
		fieldType: 'MULTI_SELECTION',
	},
	{
		icon: <SwatchBookIcon aria-hidden data-slot="icon" size={18} strokeWidth={1.5} />,
		label: 'Tag',
		fieldType: 'TAG',
	},
] satisfies {
	fieldType: MetadataFieldType;
	icon: ReactNode;
	label: string;
}[];

const METADATA_FIELD_TYPE_LOOKUP = new Set<string>(metadataFieldTypes.map((fieldType) => fieldType.fieldType));

export function isMetadataFieldType(fieldType: unknown): fieldType is MetadataFieldType {
	return typeof fieldType === 'string' && METADATA_FIELD_TYPE_LOOKUP.has(fieldType);
}

export function getMetadataFieldTypeOrDefault(fieldType: unknown, defaultFieldType: MetadataFieldType = 'TEXT') {
	return isMetadataFieldType(fieldType) ? fieldType : defaultFieldType;
}

function getMetadataFieldTypeDefinition(fieldType: MetadataFieldType | null | undefined) {
	return metadataFieldTypes.find((type) => type.fieldType === fieldType);
}

export function MetadataFieldTypeBadge(props: {
	readonly className?: string | undefined;
	readonly fieldType: MetadataFieldType | null | undefined;
}) {
	const definition = getMetadataFieldTypeDefinition(props.fieldType);

	if (!definition) {
		return null;
	}

	return (
		<span
			className={cx(
				'relative isolate inline-flex h-6 shrink-0 place-content-center place-items-center gap-1 rounded-sm border border-transparent bg-base-neutral-700 px-2 py-1 text-base-neutral-40 dark:bg-base-neutral-100 dark:text-base-neutral-900',
				props.className,
			)}
		>
			{definition.icon}
			<span>{definition.label}</span>
		</span>
	);
}

export function getFieldIcon(fieldType: MetadataFieldType | null | undefined) {
	return getMetadataFieldTypeDefinition(fieldType)?.icon ?? null;
}

export function getFieldLabel(fieldType: MetadataFieldType | null | undefined) {
	return getMetadataFieldTypeDefinition(fieldType)?.label ?? null;
}

export function MetadataField(props: {
	readonly classNames?: { readonly label?: string; readonly order?: string } | undefined;
	readonly entry: MetadataFieldEntry;
	readonly hasMissingIndicator?: boolean | undefined;
	readonly showAllOptions?: boolean | undefined;
}) {
	const fieldIcon = getFieldIcon(props.entry.field_type ?? null);
	const fieldLabel = getFieldLabel(props.entry.field_type ?? null);

	return (
		<div className="flex gap-3">
			{props.entry.order === undefined || props.entry.order === null ? null : (
				<span
					className={cx(
						'mt-[5px] h-4 rounded bg-base-neutral-100 px-1 text-base-label-xs tabular-nums dark:bg-base-neutral-700',
						props.classNames?.order,
					)}
				>
					{props.entry.order?.toString().padStart(2, '0')}
				</span>
			)}
			<div className="flex grow flex-col gap-1">
				<div className="flex place-content-between place-items-center">
					<span className={cx('flex place-items-center gap-2 break-all')}>
						<span
							className={cx(
								'text-base-label-md text-base-neutral-600 dark:text-base-neutral-300',
								props.classNames?.label,
							)}
						>
							{props.entry.custom_key}
						</span>
						{fieldIcon ? (
							<Tooltip delay={400}>
								<TooltipTrigger variant="unset">
									<span className="flex size-6 place-content-center place-items-center text-base-sm text-base-neutral-800 dark:text-base-neutral-100">
										{fieldIcon}
									</span>
								</TooltipTrigger>
								<TooltipContent className="flex place-items-center gap-1" arrow={false} variant="rich">
									{fieldIcon} {fieldLabel}
								</TooltipContent>
							</Tooltip>
						) : null}
						{props.entry.metadata_template ? (
							<Tooltip delay={400}>
								<TooltipTrigger variant="tooltip">
									<Link
										href={`/metadata-templates/${props.entry.metadata_template.metadata_template_container.pk}?version=${props.entry.metadata_template.pk}`}
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
								<TooltipContent className="flex place-items-center gap-1" arrow={false} variant="rich">
									<BlocksIcon aria-hidden size={18} strokeWidth={1.5} />
									{props.entry.metadata_template.metadata_template_container.name}
								</TooltipContent>
							</Tooltip>
						) : null}
					</span>
					{props.entry.mandatory ? (
						<Tooltip delay={400}>
							<TooltipTrigger variant="unset">
								<span className="text-base-sm break-all text-base-neutral-600 dark:text-base-neutral-300">
									Required
								</span>
							</TooltipTrigger>
							<TooltipContent variant="plain">Cannot be removed from a file</TooltipContent>
						</Tooltip>
					) : null}
				</div>
				<MetadataValue
					field={props.entry}
					hasMissingIndicator={props.hasMissingIndicator}
					showAllOptions={props.showAllOptions}
				/>
			</div>
		</div>
	);
}

export function MetadataFieldDiffTimelineEntry(props: {
	readonly entry: MetadataFieldDiffTimelineEntry;
	readonly showAllOptions?: boolean | undefined;
}) {
	const key = props.entry.type === 'added' ? props.entry.next.pk : props.entry.current.pk;

	if (props.entry.type === 'unchanged') {
		return (
			<div
				className="flex flex-col gap-1 rounded-sm border border-base-neutral-100 p-4 dark:border-base-neutral-700"
				key={key}
			>
				<MetadataField entry={props.entry.current} showAllOptions={props.showAllOptions} />
			</div>
		);
	}

	return (
		<div className="flex flex-col" key={key}>
			{/* oxlint-disable-next-line no-negated-condition */}
			{props.entry.type !== 'added' ? (
				<div
					className={cx(
						'flex flex-col gap-1 rounded-sm border border-base-sunset-300 bg-base-sunset-100 p-4 dark:border-base-sunset-700 dark:bg-base-sunset-800/40',
						props.entry.type === 'changed' ? 'rounded-b-none border-b-0' : '',
					)}
				>
					<MetadataField
						classNames={{
							label: 'text-base-sunset-800 dark:text-base-sunset-100',
							order: 'bg-base-sunset-300 dark:bg-base-sunset-700',
						}}
						entry={props.entry.current}
						showAllOptions={props.showAllOptions}
					/>
				</div>
			) : null}
			{/* oxlint-disable-next-line no-negated-condition */}
			{props.entry.type !== 'removed' ? (
				<div
					className={cx(
						'flex flex-col gap-1 rounded-sm border border-base-green-lime-300 bg-base-green-lime-100 p-4 dark:border-base-green-lime-700 dark:bg-base-green-lime-800/40',
						props.entry.type === 'changed' ? 'rounded-t-none border-t-0' : '',
					)}
				>
					<MetadataField
						classNames={{
							label: 'text-base-green-lime-800 dark:text-base-green-lime-100',
							order: 'bg-base-green-lime-300 dark:bg-base-green-lime-700',
						}}
						entry={props.entry.next}
						showAllOptions={props.showAllOptions}
					/>
				</div>
			) : null}
		</div>
	);
}

export function MetadataItemWrapper(
	props: PropsWithChildren<{
		readonly className?: string | undefined;
		readonly classNames?: { readonly border?: string | undefined } | undefined;
		readonly dndContainerRef: HTMLDivElement | null;
		readonly id: string;
		readonly idx: number;
		onDelete(...args: any): void;
	}>,
) {
	const { ref, handleRef } = useSortable({
		modifiers: [RestrictToElement.configure({ element: props.dndContainerRef })],
		id: props.id,
		index: props.idx,
		data: { idx: props.idx },
	});

	return (
		<div className={cx('relative mt-5 flex', props.className)} key={props.id} ref={ref}>
			{props.children}

			<MetadataBorder
				aria-label="Delete metadata entry"
				classNames={{ border: props.classNames?.border }}
				dragHandleRef={handleRef}
				onPress={() => props.onDelete(props.idx)}
			/>
		</div>
	);
}

export function MetadataBorder(
	props: ButtonProps & {
		readonly classNames?: { readonly border?: string | undefined } | undefined;
		readonly dragHandleRef?: Ref<HTMLButtonElement> | undefined;
		readonly isRemoveDisabled?: boolean | undefined;
	},
) {
	return (
		<div
			className={cx(
				'pointer-events-none absolute flex h-full w-full [&:has(button[data-destructive="true"][data-focus-visible])_div]:border-base-sunset-500 [&:has(button[data-destructive="true"][data-hovered])_div]:border-base-sunset-500 [&:has(button[data-destructive="true"][data-pressed])_div]:border-base-sunset-500',
				props.classNames?.border,
			)}
		>
			<div className="flex w-[80%] shrink-0 flex-col rounded-tl-lg rounded-bl-lg border-t border-b border-base-neutral-100 sm:w-[85%] dark:border-base-neutral-700">
				<div className="h-4 rounded-tl-lg border-l border-base-neutral-100 dark:border-base-neutral-700" />
				{props.dragHandleRef ? (
					<div className="pointer-events-auto flex -translate-x-1/2 place-content-center gap-2">
						<Button className="cursor-grab" ref={props.dragHandleRef} size="icon" variant="discreet">
							<GripVerticalIcon aria-hidden size={18} strokeWidth={1.5} />
						</Button>
					</div>
				) : null}
				<div className="h-full rounded-bl-lg border-l border-base-neutral-100 dark:border-base-neutral-700" />
			</div>
			{props.isRemoveDisabled ? null : (
				<div className="relative border-b border-base-neutral-100 dark:border-base-neutral-700">
					<div className="pointer-events-auto flex -translate-y-1/2 place-items-center gap-2">
						<Button
							data-destructive="true"
							isDestructive
							onPress={(ev) => props.onPress?.(ev)}
							size="icon"
							variant="discreet"
						>
							<XCircleIcon aria-hidden size={18} strokeWidth={1.5} />
						</Button>
					</div>
				</div>
			)}
			<div className="flex-1 rounded-tr-lg rounded-br-lg border-t border-r border-b border-base-neutral-100 dark:border-base-neutral-700" />
		</div>
	);
}

export function MetadataAssignModal(props: {
	readonly isOpen?: boolean | undefined;
	readonly onOpenChange?: ((isOpen: boolean) => void) | undefined;
	readonly selected: string[];
}) {
	const queryClient = useQueryClient();
	const exitBulkMode = useExitFilesBulkMode();

	const { control, handleSubmit, reset, formState } = useForm<InferInput<typeof MetadataSchema>>({
		resolver: valibotResolver(MetadataSchema),
		values: {
			metadata: [
				{
					custom_key: '',
					value: '',
					field_type: 'TEXT',
					config: {},
				},
			],
		},
	});

	const { fields, append, remove } = useFieldArray<InferInput<typeof MetadataSchema>>({
		control,
		name: 'metadata',
	});

	const { mutate, isPending } = useMutation({
		mutationFn: async (input: { metadata: Omit<InferInput<typeof MetadataSchema>['metadata'][number], 'field'>[] }) => {
			const metadataWithOrder = (input.metadata ?? []).map((field, index) => ({
				...field,
				order: index,
			}));

			const { data, error } = await openAPIClient.POST('/api/v1/metadata/bulk-add-to-uploads-datasets/', {
				body: {
					metadata: trimMetadataPayload(metadataWithOrder),
					uploads_datasets: props.selected,
				},
			});

			if (error) {
				throw new Error(formatErrorMessage(error));
			}

			return { data };
		},
		async onSuccess() {
			const assignedCount = props.selected.length;

			await queryClient.invalidateQueries({
				queryKey: $api.queryOptions('get', '/api/v1/uploads-dataset/').queryKey,
			});

			props.onOpenChange?.(false);

			await exitBulkMode();

			globalToastQueue.add(
				{
					message: `Metadata assigned to ${assignedCount} file${assignedCount === 1 ? '' : 's'}.`,
					type: ToastType.Success,
				},
				{ timeout: 2_500 },
			);

			reset();
		},
		onError(error) {
			logger.error(LogCategory.Metadata, 'Mutation failed', {
				error: error instanceof Error ? error.message : String(error),
			});
		},
	});

	useEffect(() => {
		reset();
	}, [props.selected, reset]);

	const { formProps, submitButtonProps } = useDialogForm('metadata-assign-modal');

	return (
		<ModalContent
			aria-label="Add metadata for all selected files"
			isOpen={props.isOpen!}
			onOpenChange={props.onOpenChange!}
		>
			<ModalHeader className="flex flex-row place-items-center gap-2 text-base-xl" hasBorder>
				<ModalTitle className="text-base-xl">Add metadata for all selected files</ModalTitle>
			</ModalHeader>
			<ModalBody>
				<Form {...formProps} onSubmit={handleSubmit((data) => mutate(data))} className="flex flex-col gap-8 py-6">
					{fields.map((field, index) => (
						<div className="relative mt-5 flex" key={field.id}>
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
														isInvalid={Boolean(formState.errors.metadata?.[index]?.custom_key?.message)}
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
														{formState.errors.metadata?.[index]?.custom_key?.message ? (
															<FieldError>{formState.errors.metadata?.[index]?.custom_key?.message}</FieldError>
														) : null}
													</TextField>
												</div>
												<Separator className="m-0" />
												<div className="bg-base-neutral-40 dark:bg-base-neutral-700/40">
													<div className="px-6 py-5">
														<Metadata
															errorMessage={formState.errors.metadata?.[index]?.value}
															fieldConfig={field.value?.config}
															fieldType={getMetadataFieldTypeOrDefault(field.value?.field_type)}
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
																} else if (value.fieldType === 'MULTI_SELECTION') {
																	field.onChange({
																		...field.value,
																		field_type: value.fieldType,
																		value:
																			typeof value.value === 'string'
																				? value.value
																				: (value.value?.selectedValues ?? null),
																		config: typeof value.value === 'string' ? {} : { options: value.value?.options },
																	});
																} else if (value.fieldType === 'TAG') {
																	field.onChange({
																		...field.value,
																		field_type: value.fieldType,
																		value:
																			typeof value.value === 'string'
																				? value.value
																				: (value.value?.selectedValues ?? null),
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
															value={field.value?.value}
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
				</Form>
			</ModalBody>
			<ModalFooter hasBorder>
				<ModalClose variant="secondary-discreet">Cancel</ModalClose>
				{fields.length > 0 ? (
					<Button {...submitButtonProps} variant="filled">
						{isPending ? <Loader2Icon aria-hidden className="animate-spin" size={18} strokeWidth={1.5} /> : null}
						Save metadata
					</Button>
				) : null}
			</ModalFooter>
		</ModalContent>
	);
}

export function useMetadataTypeState({
	defaultFieldType = 'TEXT',
}: {
	readonly defaultFieldType?: MetadataFieldType;
} = {}) {
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [selected, setSelected] = useState<Selection>(new Set([defaultFieldType ?? 'TEXT']));

	const handleType = async (type: MetadataFieldType = 'TEXT') => {
		setSelected(new Set([type]));
	};

	return {
		isMenuOpen,
		setIsMenuOpen,
		selected,
		setSelected,
		handleType,
	};
}

export function MetadataTypeMenu({
	isDisabled = false,
	onTypeChange,
	...props
}: {
	readonly isDisabled?: boolean | undefined;
	readonly metadataTemplateFieldTypeState: ReturnType<typeof useMetadataTypeState>;
	readonly onTypeChange?: ((fieldType: MetadataFieldType) => void) | undefined;
	readonly options: { fieldType: MetadataFieldType; icon: ReactNode; label: string }[];
}) {
	// oxlint-disable-next-line typescript/no-misused-spread
	const selectedType = [...props.metadataTemplateFieldTypeState.selected][0] as MetadataFieldType | undefined;
	const selectedOption =
		props.options.find((option) => option.fieldType === selectedType) ??
		metadataFieldTypes.find((option) => option.fieldType === selectedType);
	const selectedMenuKey = props.options.some((option) => option.fieldType === selectedType)
		? selectedType
		: props.options[0]?.fieldType;

	return (
		<Menu
			isOpen={props.metadataTemplateFieldTypeState.isMenuOpen}
			onOpenChange={props.metadataTemplateFieldTypeState.setIsMenuOpen}
		>
			<MenuTrigger
				aria-label="Metadata template field type menu"
				className="pressed:outline-2 pressed:outline-offset-2 pressed:outline-base-lavender-400 dark:pressed:outline-base-lavender-600"
				isDark
				isDisabled={isDisabled}
				size="xs"
				slot={null}
				variant="filled"
			>
				{selectedOption?.icon}
				<span>
					<span className="text-base-label-md">{selectedOption?.label}</span>
				</span>
				{props.metadataTemplateFieldTypeState.isMenuOpen ? (
					<ChevronUpIcon aria-hidden size={18} strokeWidth={1.5} />
				) : (
					<ChevronDownIcon aria-hidden size={18} strokeWidth={1.5} />
				)}
			</MenuTrigger>
			<MenuContent
				disallowEmptySelection
				onSelectionChange={props.metadataTemplateFieldTypeState.setSelected}
				placement="bottom start"
				selectedKeys={selectedMenuKey ? new Set([selectedMenuKey]) : new Set()}
				selectionMode="single"
				popover={{ arrow: false }}
			>
				{props.options.map((option) => (
					<MenuItem
						id={option.fieldType}
						key={option.fieldType}
						onAction={async () => {
							onTypeChange?.(option.fieldType);

							await props.metadataTemplateFieldTypeState.handleType(option.fieldType);
						}}
					>
						<span className="flex place-items-center gap-1">
							{option.icon}
							{option.label}
						</span>
					</MenuItem>
				))}
			</MenuContent>
		</Menu>
	);
}

/**
 * Error message structure for metadata fields.
 * Supports both top-level errors and nested config errors (e.g., for SELECTION options).
 */
export type MetadataErrorMessage =
	| {
			readonly config?: {
				readonly options?: Record<number, { readonly message?: string }>;
			};
			readonly message?: string;
	  }
	| undefined;

/**
 * Configuration for metadata fields.
 * Currently used for SELECTION type to store available options.
 */
export type MetadataFieldConfig = {
	readonly description?: string;
	readonly options?: string[];
};

function getMetadataTemplateDescription(config: unknown, isMetadataTemplateField?: boolean): string | undefined {
	if (!isMetadataTemplateField) {
		return undefined;
	}

	return getMetadataFieldTrimmedDescription(config);
}

/**
 * Value type for metadata fields across all supported field types.
 * Uses loose typing for form library compatibility while maintaining semantic clarity.
 */

export type MetadataFieldValueType = any;

type MetadataCommonProps = {
	readonly className?: string | undefined;
	// eslint-disable-next-line react/no-unused-prop-types
	readonly disabledOptions?: MetadataFieldType[];
	readonly errorMessage: MetadataErrorMessage;
	// eslint-disable-next-line react/no-unused-prop-types
	readonly fieldConfig?: MetadataFieldConfig | undefined;
	// eslint-disable-next-line react/no-unused-prop-types
	readonly fieldType?: MetadataFieldType;
	// eslint-disable-next-line react/no-unused-prop-types
	readonly isDisabled: boolean;
	readonly metadataTemplateDescription?: string | undefined;
	readonly label: ReactNode | string;
	onBlur(...args: unknown[]): void;
	onChange(value: { readonly fieldType: MetadataFieldType; readonly value: MetadataFieldValueType }): void;
	readonly value: MetadataFieldValueType;
};

type MetadataInternalProps = MetadataCommonProps & {
	readonly isMetadataTemplateField?: boolean;
	readonly isMetadataTemplateFieldDefinition?: boolean;
};

export type MetadataProps = MetadataCommonProps;
export type MetadataTemplateFieldValueInputProps = MetadataCommonProps;
export type MetadataTemplateFieldDefinitionInputProps = MetadataCommonProps;

function isSelectionFieldType(fieldType: MetadataFieldType | null | undefined): fieldType is SelectionFieldType {
	for (const selectionFieldType of SELECTION_FIELD_TYPES) {
		if (selectionFieldType === fieldType) {
			return true;
		}
	}

	return false;
}

function getSelectedOptionIndicesFromValue(
	options: string[],
	value: MetadataFieldValueType,
	selectionType: SelectionFieldType,
): number[] {
	if (selectionType === 'SELECTION') {
		if (typeof value !== 'string') {
			return [];
		}

		const matchingIndex = options.indexOf(value);
		return matchingIndex >= 0 ? [matchingIndex] : [];
	}

	if (!Array.isArray(value)) {
		return [];
	}

	const availableIndicesByOption = new Map<string, number[]>();
	for (const [index, option] of options.entries()) {
		const availableIndices = availableIndicesByOption.get(option) ?? [];
		availableIndices.push(index);
		availableIndicesByOption.set(option, availableIndices);
	}

	const matchedIndices: number[] = [];
	for (const selectedValue of value) {
		if (typeof selectedValue !== 'string') {
			continue;
		}

		const availableIndices = availableIndicesByOption.get(selectedValue);
		const selectedIndex = availableIndices?.shift();
		if (selectedIndex !== undefined) {
			matchedIndices.push(selectedIndex);
		}
	}

	return matchedIndices;
}

function normalizeSelectedOptionIndices(
	indices: number[],
	options: string[],
	selectionType: SelectionFieldType,
	enforceSelection: boolean,
): number[] {
	if (selectionType === 'SELECTION') {
		const firstValidIndex = indices.find((index) => index >= 0 && index < options.length);
		if (firstValidIndex !== undefined) {
			return [firstValidIndex];
		}

		return enforceSelection && options.length > 0 ? [0] : [];
	}

	const uniqueIndices = Array.from(new Set(indices.filter((index) => index >= 0 && index < options.length)));

	if (uniqueIndices.length > 0) {
		return uniqueIndices;
	}

	return enforceSelection && options.length > 0 ? [0] : [];
}

function getSelectedOptionValuesFromIndices(options: string[], indices: number[]): string[] {
	return Array.from(
		new Set(
			indices
				.map((index) => options[index])
				.filter((optionValue): optionValue is string => typeof optionValue === 'string'),
		),
	);
}

function normalizeTagOptions(options: unknown): string[] {
	if (!Array.isArray(options)) {
		return [];
	}

	return Array.from(
		new Set(
			options
				.filter((option): option is string => typeof option === 'string')
				.filter((option) => option.trim().length > 0),
		),
	);
}

function normalizeSelectedTagValues(value: unknown, availableOptions: readonly string[]): string[] {
	if (!Array.isArray(value)) {
		return [];
	}

	const optionSet = new Set(availableOptions);

	return Array.from(
		new Set(
			value
				.filter((item): item is string => typeof item === 'string')
				.filter((item) => item.trim().length > 0 && optionSet.has(item)),
		),
	);
}

function getAvailableTagOptions(options: unknown, value: unknown): string[] {
	const normalizedOptions = normalizeTagOptions(options);
	if (!Array.isArray(value)) {
		return normalizedOptions;
	}

	const normalizedSelectedValues = value
		.filter((item): item is string => typeof item === 'string')
		.filter((item) => item.trim().length > 0);

	return Array.from(new Set([...normalizedOptions, ...normalizedSelectedValues]));
}

type SelectionMetadataEditorProps = MetadataInternalProps & {
	readonly selectionType: SelectionFieldType;
	readonly emittedFieldType?: MetadataFieldType;
};

type SelectionMetadataTemplateValuePickerProps = {
	readonly className?: string | undefined;
	readonly errorMessage: MetadataErrorMessage;
	readonly isDisabled: boolean;
	readonly label: ReactNode | string;
	readonly metadataTemplateDescription?: string;
	onMultiSelectionChange(selectedKeys: string[]): void;
	onSingleSelectionChange(selectedIndex: number | null): void;
	readonly selectedOptionIndices: readonly number[];
	readonly selectionType: SelectionFieldType;
	readonly options: readonly string[];
};

function SelectionMetadataTemplateValuePicker({
	className,
	errorMessage,
	isDisabled,
	label,
	metadataTemplateDescription,
	onMultiSelectionChange,
	onSingleSelectionChange,
	options,
	selectedOptionIndices,
	selectionType,
}: SelectionMetadataTemplateValuePickerProps) {
	const selectItems = options.map((option, index) => ({ id: index.toString(), value: option }));
	const selectedIndex = selectedOptionIndices[0];
	const selectedIndexRef = useRef<number | undefined>(selectedIndex);
	selectedIndexRef.current = selectedIndex;

	const selectBody = (
		<>
			<Label>{label}</Label>
			<SelectTrigger />
			<SelectContent items={selectItems}>
				{(item) => (
					<SelectItem
						id={item.id}
						onPress={() => {
							if (selectionType === 'SELECTION' && selectedIndexRef.current?.toString() === item.id) {
								window.setTimeout(() => onSingleSelectionChange(null), 0);
							}
						}}
						textValue={item.value}
					>
						<SelectLabel>{item.value}</SelectLabel>
					</SelectItem>
				)}
			</SelectContent>
			{metadataTemplateDescription ? <Description>{metadataTemplateDescription}</Description> : null}
			{errorMessage?.message ? <FieldError>{errorMessage.message}</FieldError> : null}
		</>
	);

	if (selectionType === 'SELECTION') {
		return (
			<Select
				className={className}
				isDisabled={isDisabled}
				isInvalid={Boolean(errorMessage?.message)}
				onChange={(key) => {
					if (key === null) {
						onSingleSelectionChange(null);
						return;
					}

					onSingleSelectionChange(Number.parseInt(key.toString(), 10));
				}}
				placeholder="Select value"
				value={selectedIndex === undefined ? null : selectedIndex.toString()}
			>
				{selectBody}
			</Select>
		);
	}

	return (
		<Select
			className={className}
			isDisabled={isDisabled}
			isInvalid={Boolean(errorMessage?.message)}
			onChange={(key) => {
				if (key === null) {
					onMultiSelectionChange([]);
					return;
				}

				onMultiSelectionChange(
					Array.isArray(key) ? key.map((selectedKey) => selectedKey.toString()) : [key.toString()],
				);
			}}
			selectionMode={selectionType === 'MULTI_SELECTION' ? 'multiple' : 'single'}
			value={selectedOptionIndices.map((currentSelectedIndex) => currentSelectedIndex.toString())}
		>
			{selectBody}
		</Select>
	);
}

type SelectionMetadataOptionSetEditorProps = {
	readonly className?: string | undefined;
	readonly id: string;
	readonly isDisabled: boolean;
	readonly label: ReactNode | string;
	addOption(): void;
	getFieldErrorMessage(index: number): string | undefined;
	handleMultiSelectionChange(selectedKeys: string[]): void;
	handleOptionTextChange(index: number, value: string): void;
	handleSingleSelectionChange(selectedIndex: number): void;
	readonly options: readonly string[];
	removeOption(index: number): void;
	readonly selectedOptionIndices: readonly number[];
	readonly selectionEnabled: boolean;
	readonly selectionType: SelectionFieldType;
	toggleSelectionEnabled(enabled: boolean): void;
};

function SelectionMetadataOptionSetEditor({
	addOption,
	className,
	getFieldErrorMessage,
	handleMultiSelectionChange,
	handleOptionTextChange,
	handleSingleSelectionChange,
	id,
	isDisabled,
	label,
	options,
	removeOption,
	selectedOptionIndices,
	selectionEnabled,
	selectionType,
	toggleSelectionEnabled,
}: SelectionMetadataOptionSetEditorProps) {
	return (
		<div className={cx('flex flex-col gap-2.5', className)}>
			<div className="flex flex-col place-content-between gap-3 md:flex-row md:place-items-center md:gap-2">
				<Label htmlFor={id}>{label}</Label>
				<Switch
					className="text-base-sm"
					isSelected={selectionEnabled}
					onChange={toggleSelectionEnabled}
					size="sm"
					variant="green-lime"
				>
					Default option set
				</Switch>
			</div>
			<div className="flex flex-col gap-4">
				<div className="flex flex-row gap-3">
					{selectionType === 'SELECTION' ? (
						<RadioGroup
							aria-label="Selection options"
							className="mt-1.5 orientation-vertical:space-y-7"
							id={id}
							isDisabled={!selectionEnabled}
							onChange={(value) => handleSingleSelectionChange(Number.parseInt(value, 10))}
							value={
								selectionEnabled && selectedOptionIndices[0] !== undefined
									? selectedOptionIndices[0].toString()
									: '__none__'
							}
						>
							{options.map((_, index) => (
								<Radio
									aria-label={`Option ${index + 1}`}
									className={cx(
										getFieldErrorMessage(index) && '**:data-[slot=indicator]:mb-5.5',
										'**:data-[slot=indicator]:mt-1',
									)}
									key={index}
									value={index.toString()}
								/>
							))}
						</RadioGroup>
					) : (
						<CheckboxGroup
							aria-label="Selection options"
							className="mt-1.5 space-y-7"
							id={id}
							isDisabled={!selectionEnabled}
							onChange={handleMultiSelectionChange}
							value={selectionEnabled ? selectedOptionIndices.map((index) => index.toString()) : []}
						>
							{options.map((_, index) => (
								<Checkbox
									aria-label={`Option ${index + 1}`}
									className={cx(
										getFieldErrorMessage(index) && '**:data-[slot=indicator]:mb-5.5',
										'**:data-[slot=indicator]:mt-1',
									)}
									key={index}
									value={index.toString()}
								/>
							))}
						</CheckboxGroup>
					)}

					<div className="flex flex-1 flex-col gap-2">
						{options.map((option, index) => (
							<div className="flex items-center gap-2" key={index}>
								<TextField
									aria-label={`Option ${index + 1} value`}
									isDisabled={isDisabled}
									isInvalid={Boolean(getFieldErrorMessage(index))}
									onChange={(value) => handleOptionTextChange(index, value)}
									value={option}
								>
									<InputGroup>
										<Input placeholder="Option value ..." />
									</InputGroup>
									{getFieldErrorMessage(index) ? <FieldError>{getFieldErrorMessage(index)}</FieldError> : null}
								</TextField>
								<Button
									aria-label={`Remove option ${index + 1}`}
									className={cx(getFieldErrorMessage(index) && 'mb-5.5')}
									isDestructive
									isDisabled={options.length <= 2}
									onPress={() => removeOption(index)}
									size="icon"
									variant="discreet"
								>
									<XCircleIcon aria-hidden size={18} strokeWidth={1.5} />
								</Button>
							</div>
						))}
					</div>
				</div>
				<Button className={linkStyles({ className: 'ml-11.5 place-self-start' })} onPress={addOption} variant="unset">
					Add Option
				</Button>
			</div>
		</div>
	);
}

function SelectionMetadataEditor({
	selectionType,
	emittedFieldType: emittedFieldTypeOverride,
	label,
	metadataTemplateDescription,
	...props
}: SelectionMetadataEditorProps) {
	const id = useId();

	const initialOptions = props.fieldConfig?.options?.length ? props.fieldConfig.options : ['', ''];
	const isMultiSelection = selectionType === 'MULTI_SELECTION';
	const shouldEnforceSelection = !props.isMetadataTemplateField;

	const [options, setOptions] = useState<string[]>(initialOptions);
	const [selectedOptionIndices, setSelectedOptionIndices] = useState<number[]>(() =>
		normalizeSelectedOptionIndices(
			getSelectedOptionIndicesFromValue(initialOptions, props.value, selectionType),
			initialOptions,
			selectionType,
			shouldEnforceSelection,
		),
	);
	const [selectionEnabled, setSelectionEnabled] = useState<boolean>(
		isMultiSelection ? Array.isArray(props.value) && props.value.length > 0 : typeof props.value === 'string',
	);
	const shouldEmitSelectedIndices = (indices: number[]) =>
		props.isMetadataTemplateField || selectionEnabled ? indices : [];

	useEffect(() => {
		const newOptions = props.fieldConfig?.options?.length ? props.fieldConfig.options : ['', ''];
		const hasSelectedValue =
			selectionType === 'MULTI_SELECTION'
				? Array.isArray(props.value) && props.value.length > 0
				: typeof props.value === 'string';

		setOptions(newOptions);
		setSelectionEnabled(hasSelectedValue);

		setSelectedOptionIndices((currentIndices) => {
			if (hasSelectedValue) {
				if (selectionType === 'SELECTION') {
					const selectedValue = typeof props.value === 'string' ? props.value : null;
					const currentIndex = currentIndices[0];

					if (
						selectedValue !== null &&
						typeof currentIndex === 'number' &&
						currentIndex >= 0 &&
						currentIndex < newOptions.length &&
						newOptions[currentIndex] === selectedValue
					) {
						return [currentIndex];
					}
				} else {
					const selectedValues = Array.isArray(props.value) ? props.value : [];
					const preservedIndices = currentIndices.filter((currentIndex) => {
						const optionValue = newOptions[currentIndex];
						return typeof optionValue === 'string' && selectedValues.includes(optionValue);
					});

					if (preservedIndices.length > 0) {
						return normalizeSelectedOptionIndices(preservedIndices, newOptions, selectionType, shouldEnforceSelection);
					}
				}

				return normalizeSelectedOptionIndices(
					getSelectedOptionIndicesFromValue(newOptions, props.value, selectionType),
					newOptions,
					selectionType,
					shouldEnforceSelection,
				);
			}

			return normalizeSelectedOptionIndices(currentIndices, newOptions, selectionType, false);
		});
	}, [props.fieldConfig?.options, props.value, selectionType, shouldEnforceSelection]);

	const inlineOptionValidationMessages = getMetadataOptionValidationMessagesByIndex(options);
	const getFieldErrorMessage = (index: number) =>
		inlineOptionValidationMessages.get(index) ?? props.errorMessage?.config?.options?.[index]?.message;

	const emitChange = (updatedOptions: string[], indices: number[]) => {
		const normalizedIndices = normalizeSelectedOptionIndices(indices, updatedOptions, selectionType, false);
		const emittedFieldType = emittedFieldTypeOverride ?? selectionType;

		if (selectionType === 'SELECTION') {
			props.onChange({
				fieldType: emittedFieldType,
				value: {
					selectedValue: normalizedIndices[0] === undefined ? null : (updatedOptions[normalizedIndices[0]] ?? null),
					options: updatedOptions,
				},
			});
			return;
		}

		props.onChange({
			fieldType: emittedFieldType,
			value: {
				selectedValues: normalizedIndices.length
					? getSelectedOptionValuesFromIndices(updatedOptions, normalizedIndices)
					: null,
				options: updatedOptions,
			},
		});
	};

	const handleOptionTextChange = (index: number, newValue: string) => {
		const updatedOptions = [...options];
		updatedOptions[index] = newValue;
		setOptions(updatedOptions);

		const nextSelectedOptionIndices = normalizeSelectedOptionIndices(
			selectedOptionIndices,
			updatedOptions,
			selectionType,
			selectionEnabled,
		);
		setSelectedOptionIndices(nextSelectedOptionIndices);
		emitChange(updatedOptions, shouldEmitSelectedIndices(nextSelectedOptionIndices));
	};

	const handleSingleSelectionChange = (selectedIndex: number | null) => {
		const nextSelectedOptionIndices = normalizeSelectedOptionIndices(
			selectedIndex === null ? [] : [selectedIndex],
			options,
			selectionType,
			selectedIndex !== null && shouldEnforceSelection,
		);
		setSelectedOptionIndices(nextSelectedOptionIndices);
		emitChange(options, shouldEmitSelectedIndices(nextSelectedOptionIndices));
	};

	const handleMultiSelectionChange = (selectedKeys: string[]) => {
		const nextSelectedOptionIndices = normalizeSelectedOptionIndices(
			selectedKeys.map((selectedKey) => Number.parseInt(selectedKey, 10)),
			options,
			selectionType,
			false,
		);
		setSelectedOptionIndices(nextSelectedOptionIndices);
		emitChange(options, shouldEmitSelectedIndices(nextSelectedOptionIndices));
	};

	const toggleSelectionEnabled = (enabled: boolean) => {
		setSelectionEnabled(enabled);
		if (!enabled) {
			emitChange(options, []);
			return;
		}

		const nextSelectedOptionIndices = normalizeSelectedOptionIndices(
			selectedOptionIndices,
			options,
			selectionType,
			true,
		);
		setSelectedOptionIndices(nextSelectedOptionIndices);
		emitChange(options, nextSelectedOptionIndices);
	};

	const addOption = () => {
		const updatedOptions = [...options, ''];
		setOptions(updatedOptions);

		const nextSelectedOptionIndices = normalizeSelectedOptionIndices(
			selectedOptionIndices,
			updatedOptions,
			selectionType,
			selectionEnabled,
		);
		setSelectedOptionIndices(nextSelectedOptionIndices);
		emitChange(updatedOptions, shouldEmitSelectedIndices(nextSelectedOptionIndices));
	};

	const removeOption = (index: number) => {
		if (options.length <= 2) {
			return;
		}

		const updatedOptions = options.filter((_, optionIndex) => optionIndex !== index);
		const shiftedSelectedOptionIndices = selectedOptionIndices
			.filter((selectedIndex) => selectedIndex !== index)
			.map((selectedIndex) => (selectedIndex > index ? selectedIndex - 1 : selectedIndex));

		const nextSelectedOptionIndices = normalizeSelectedOptionIndices(
			shiftedSelectedOptionIndices,
			updatedOptions,
			selectionType,
			selectionEnabled,
		);

		setOptions(updatedOptions);
		setSelectedOptionIndices(nextSelectedOptionIndices);
		emitChange(updatedOptions, shouldEmitSelectedIndices(nextSelectedOptionIndices));
	};

	if (props.isMetadataTemplateField) {
		return (
			<SelectionMetadataTemplateValuePicker
				className={props.className}
				errorMessage={props.errorMessage}
				isDisabled={props.isDisabled}
				label={label}
				metadataTemplateDescription={metadataTemplateDescription}
				onMultiSelectionChange={handleMultiSelectionChange}
				onSingleSelectionChange={handleSingleSelectionChange}
				options={options}
				selectedOptionIndices={selectedOptionIndices}
				selectionType={selectionType}
			/>
		);
	}

	return (
		<SelectionMetadataOptionSetEditor
			addOption={addOption}
			className={props.className}
			getFieldErrorMessage={getFieldErrorMessage}
			handleMultiSelectionChange={handleMultiSelectionChange}
			handleOptionTextChange={handleOptionTextChange}
			handleSingleSelectionChange={handleSingleSelectionChange}
			id={id}
			isDisabled={props.isDisabled}
			label={label}
			options={options}
			removeOption={removeOption}
			selectedOptionIndices={selectedOptionIndices}
			selectionEnabled={selectionEnabled}
			selectionType={selectionType}
			toggleSelectionEnabled={toggleSelectionEnabled}
		/>
	);
}

function EditableTagMetadataEditor({ label, metadataTemplateDescription, ...props }: MetadataInternalProps) {
	const id = useId();

	const [availableTags, setAvailableTags] = useState<string[]>(() =>
		getAvailableTagOptions(props.fieldConfig?.options, props.value),
	);
	const [selectedTags, setSelectedTags] = useState<string[]>(() =>
		normalizeSelectedTagValues(props.value, getAvailableTagOptions(props.fieldConfig?.options, props.value)),
	);
	const [pendingTagLabel, setPendingTagLabel] = useState('');

	useEffect(() => {
		const normalizedOptions = getAvailableTagOptions(props.fieldConfig?.options, props.value);
		const normalizedSelectedTags = normalizeSelectedTagValues(props.value, normalizedOptions);

		setAvailableTags(normalizedOptions);
		setSelectedTags(normalizedSelectedTags);
	}, [props.fieldConfig?.options, props.value]);

	const emitTagChange = (nextOptions: string[], nextSelectedTags: string[]) => {
		props.onChange({
			fieldType: 'TAG',
			value: {
				options: nextOptions,
				selectedValues: nextSelectedTags.length > 0 ? nextSelectedTags : null,
			},
		});
	};

	const handleSelectionChange = (selection: Selection) => {
		if (selection === 'all') {
			return;
		}

		const selectionSet = new Set(availableTags);
		const nextSelectedTags = Array.from(selection)
			.map((item) => item.toString())
			.filter((item) => selectionSet.has(item));

		setSelectedTags(nextSelectedTags);
		emitTagChange(availableTags, nextSelectedTags);
	};

	const addTagFromInput = () => {
		const trimmedTag = pendingTagLabel.trim();
		if (!trimmedTag) {
			return;
		}

		let nextOptions = availableTags;
		if (!availableTags.includes(trimmedTag)) {
			nextOptions = [...availableTags, trimmedTag];
		}

		const nextSelectedTags = selectedTags.includes(trimmedTag) ? selectedTags : [...selectedTags, trimmedTag];

		setAvailableTags(nextOptions);
		setSelectedTags(nextSelectedTags);
		setPendingTagLabel('');
		emitTagChange(nextOptions, nextSelectedTags);
	};

	const handleTagRemove = (removedTagKeys: unknown) => {
		if (!(removedTagKeys instanceof Set)) {
			return;
		}

		const removedTagSet = new Set(Array.from(removedTagKeys).map((key) => key.toString()));
		const nextOptions = availableTags.filter((tagOption) => !removedTagSet.has(tagOption));
		const nextSelectedTags = selectedTags.filter((tagValue) => !removedTagSet.has(tagValue));

		setAvailableTags(nextOptions);
		setSelectedTags(nextSelectedTags);
		emitTagChange(nextOptions, nextSelectedTags);
	};

	const baseTagGroup = (
		<TagGroup
			aria-label="Tag options"
			onSelectionChange={handleSelectionChange}
			selectedKeys={new Set(selectedTags)}
			selectionMode="multiple"
			id={id}
		>
			{availableTags.map((tagOption) => (
				<Tag
					id={tagOption}
					isDisabled={props.isDisabled}
					key={tagOption}
					textValue={tagOption}
					color="selection"
					size="sm"
				>
					{tagOption}
				</Tag>
			))}
		</TagGroup>
	);

	if (props.isMetadataTemplateField) {
		return (
			<div className={cx('flex flex-col gap-2', props.className)}>
				<Label htmlFor={id}>{label}</Label>
				{baseTagGroup}
				{metadataTemplateDescription ? <Description>{metadataTemplateDescription}</Description> : null}
				{props.errorMessage?.message ? <FieldError>{props.errorMessage.message}</FieldError> : null}
			</div>
		);
	}

	return (
		<div className={cx('flex flex-col gap-2', props.className)}>
			<TextField
				isDisabled={props.isDisabled}
				className="gap-2"
				isInvalid={Boolean(props.errorMessage?.message)}
				onBlur={props.onBlur}
				onChange={(value) => setPendingTagLabel(value ?? '')}
				value={pendingTagLabel}
			>
				<Label>{label}</Label>
				<InputGroup>
					<Input
						onKeyDown={(event) => {
							if (event.key === 'Enter') {
								event.preventDefault();
								addTagFromInput();
							}
						}}
						placeholder="Add tags ..."
						type="text"
					/>
				</InputGroup>
				<Description>Press 'Enter' after naming a tag</Description>
				{props.errorMessage?.message ? <FieldError>{props.errorMessage.message}</FieldError> : null}
			</TextField>
			<TagGroup
				aria-label="Tag options"
				onRemove={handleTagRemove}
				onSelectionChange={handleSelectionChange}
				selectedKeys={new Set(selectedTags)}
				selectionMode="multiple"
			>
				{availableTags.map((tagOption) => (
					<Tag
						id={tagOption}
						isDisabled={props.isDisabled}
						key={tagOption}
						textValue={tagOption}
						color="selection"
						size="sm"
					>
						{tagOption}
					</Tag>
				))}
			</TagGroup>
		</div>
	);
}

function TagMetadataEditor({ label, metadataTemplateDescription, ...props }: MetadataInternalProps) {
	if (props.isMetadataTemplateFieldDefinition) {
		return (
			<SelectionMetadataEditor
				{...props}
				emittedFieldType="TAG"
				label={label}
				metadataTemplateDescription={metadataTemplateDescription}
				selectionType="MULTI_SELECTION"
			/>
		);
	}

	return (
		<EditableTagMetadataEditor {...props} label={label} metadataTemplateDescription={metadataTemplateDescription} />
	);
}

function TextMetadataFieldEditor({ errorMessage, metadataTemplateDescription, ...props }: MetadataInternalProps) {
	return (
		<TextField
			autoComplete="off"
			className={cx('gap-2', props.className)}
			isDisabled={props.isDisabled}
			isInvalid={Boolean(errorMessage?.message)}
			onBlur={props.onBlur}
			onChange={(value) => props.onChange({ fieldType: 'TEXT', value: value ?? null })}
			value={typeof props.value === 'string' ? props.value : ''}
		>
			<Label>{props.label}</Label>
			<InputGroup>
				<Input placeholder="Text value" type="text" />
				{props.value && !props.isDisabled && (
					<Button
						aria-label="Clear text value"
						onPress={() => props.onChange({ fieldType: 'TEXT', value: null })}
						size="icon"
						variant="unset"
					>
						<XCircleIcon aria-hidden className="size-6 shrink-0 stroke-[1.5]" />
					</Button>
				)}
			</InputGroup>
			{metadataTemplateDescription ? <Description>{metadataTemplateDescription}</Description> : null}
			{errorMessage?.message ? <FieldError>{errorMessage.message}</FieldError> : null}
		</TextField>
	);
}

function IntegerMetadataFieldEditor({ errorMessage, metadataTemplateDescription, ...props }: MetadataInternalProps) {
	return (
		<NumberField
			className={cx('gap-2', props.className)}
			isDisabled={props.isDisabled}
			isInvalid={Boolean(errorMessage?.message)}
			onBlur={props.onBlur}
			onChange={(value) => {
				if (value === null || Number.isNaN(value)) {
					props.onChange({ fieldType: 'INTEGER', value: null });
				} else {
					props.onChange({ fieldType: 'INTEGER', value: value.toString() });
				}
			}}
			value={
				typeof props.value === 'string' && props.value.trim() !== '' && Number.isFinite(Number(props.value))
					? Number(props.value)
					: Number.NaN
			}
		>
			<Label>{props.label}</Label>
			<NumberInput placeholder="Number value" />
			{metadataTemplateDescription ? <Description>{metadataTemplateDescription}</Description> : null}
			{errorMessage?.message ? <FieldError>{errorMessage.message}</FieldError> : null}
		</NumberField>
	);
}

function DecimalMetadataFieldEditor({ errorMessage, metadataTemplateDescription, ...props }: MetadataInternalProps) {
	return (
		<NumberField
			className={cx('gap-2', props.className)}
			formatOptions={{ maximumFractionDigits: 100, minimumFractionDigits: 2 }}
			isDisabled={props.isDisabled}
			isInvalid={Boolean(errorMessage?.message)}
			onBlur={props.onBlur}
			onChange={(value) => {
				if (value === null || Number.isNaN(value)) {
					props.onChange({ fieldType: 'DECIMAL', value: null });
				} else {
					props.onChange({ fieldType: 'DECIMAL', value: value.toString() });
				}
			}}
			value={
				typeof props.value === 'string' && props.value.trim() !== '' && Number.isFinite(Number(props.value))
					? Number(props.value)
					: Number.NaN
			}
		>
			<Label>{props.label}</Label>
			<NumberInput placeholder="Decimal value" />
			{metadataTemplateDescription ? <Description>{metadataTemplateDescription}</Description> : null}
			{errorMessage?.message ? <FieldError>{errorMessage.message}</FieldError> : null}
		</NumberField>
	);
}

function DateMetadataFieldEditor({
	errorMessage,
	metadataTemplateDescription,
	value,
	...props
}: MetadataInternalProps) {
	const parsedValue = ISO_DATE_REGEX.test(value) ? parseDate(value) : null;

	return (
		<DatePicker
			className={cx('gap-2', props.className)}
			isDisabled={props.isDisabled}
			isInvalid={Boolean(errorMessage?.message)}
			onBlur={props.onBlur}
			onChange={(nextValue) => props.onChange({ fieldType: 'DATE', value: nextValue?.toString() ?? null })}
			shouldForceLeadingZeros
			value={parsedValue}
		>
			<Label>{props.label}</Label>
			<DatePickerTrigger />
			{metadataTemplateDescription ? <Description>{metadataTemplateDescription}</Description> : null}
			{errorMessage?.message ? <FieldError>{errorMessage.message}</FieldError> : null}
		</DatePicker>
	);
}

function TimeMetadataFieldEditor({
	errorMessage,
	metadataTemplateDescription,
	value,
	...props
}: MetadataInternalProps) {
	const parsedValue = ISO_TIME_SECOND_REGEX.test(value) ? parseTime(value) : null;

	return (
		<TimeField
			className={cx('gap-2', props.className)}
			isDisabled={props.isDisabled}
			isInvalid={Boolean(errorMessage?.message)}
			onBlur={props.onBlur}
			onChange={(nextValue) => {
				props.onChange({ fieldType: 'TIME', value: nextValue?.toString() ?? null });
			}}
			shouldForceLeadingZeros
			value={parsedValue}
		>
			<Label>{props.label}</Label>
			<InputGroup>
				<TimeInput />
				<ClockIcon
					aria-hidden
					className="text-base-neutral-600 dark:text-base-neutral-300"
					data-slot="icon"
					size={18}
					strokeWidth={1.5}
				/>
			</InputGroup>
			{metadataTemplateDescription ? <Description>{metadataTemplateDescription}</Description> : null}
			{errorMessage?.message ? <FieldError>{errorMessage.message}</FieldError> : null}
		</TimeField>
	);
}

function DatetimeMetadataFieldEditor(_props: MetadataInternalProps) {
	return null;
}

function WysiwygMetadataFieldEditor(props: MetadataInternalProps) {
	const id = useId();
	const editorContent =
		typeof props.value === 'string' || (props.value !== null && typeof props.value === 'object') ? props.value : '';

	return (
		<div className={cx('flex flex-col gap-2', props.className)}>
			<Label htmlFor={id}>{props.label}</Label>
			<Editor
				aria-invalid={Boolean(props.errorMessage?.message)}
				autoComplete="off"
				content={editorContent}
				editable
				id={id}
				onBlur={props.onBlur}
				onChange={(value) =>
					props.onChange({
						fieldType: 'WYSIWYG',
						value: value ?? null,
					})
				}
				placeholder="Editor value"
			/>
			{props.metadataTemplateDescription ? <Description>{props.metadataTemplateDescription}</Description> : null}
		</div>
	);
}

function SelectionFieldMetadataEditor(props: MetadataInternalProps) {
	return <SelectionMetadataEditor {...props} selectionType="SELECTION" />;
}

function MultiSelectionFieldMetadataEditor(props: MetadataInternalProps) {
	return <SelectionMetadataEditor {...props} selectionType="MULTI_SELECTION" />;
}

function TagFieldMetadataEditor(props: MetadataInternalProps) {
	return <TagMetadataEditor {...props} />;
}

const MetadataTypeComponentsMap = {
	TEXT: TextMetadataFieldEditor,
	INTEGER: IntegerMetadataFieldEditor,
	DECIMAL: DecimalMetadataFieldEditor,
	DATE: DateMetadataFieldEditor,
	TIME: TimeMetadataFieldEditor,
	DATETIME: DatetimeMetadataFieldEditor,
	WYSIWYG: WysiwygMetadataFieldEditor,
	SELECTION: SelectionFieldMetadataEditor,
	MULTI_SELECTION: MultiSelectionFieldMetadataEditor,
	TAG: TagFieldMetadataEditor,
} satisfies Record<MetadataFieldType, ComponentType<MetadataInternalProps>>;

function getMetadataDefaultValueForType(type: MetadataFieldType) {
	switch (type) {
		case 'TEXT':
			return '';
		case 'INTEGER':
			return '0';
		case 'DECIMAL':
			return '0.00';
		case 'DATE':
			return today(getLocalTimeZone()).toString();
		case 'TIME': {
			const time = now(getLocalTimeZone());
			return `${time.hour}:${time.minute}:${time.second}`;
		}

		case 'DATETIME':
		case 'WYSIWYG':
			return '';
		case 'SELECTION':
			return {
				selectedValue: null,
				options: ['', ''],
			};
		case 'MULTI_SELECTION':
			return {
				selectedValues: null,
				options: ['', ''],
			};
		case 'TAG':
			return {
				selectedValues: null,
				options: [],
			};
		default:
			return '';
	}
}

export function getAvailableMetadataTypeOptions({
	disabledOptions = [],
}: {
	readonly disabledOptions?: MetadataFieldType[] | undefined;
} = {}) {
	return metadataFieldTypes.filter((option) => !disabledOptions.includes(option.fieldType));
}

function MetadataInternal({ onChange, disabledOptions = [], ...props }: MetadataInternalProps) {
	const metadataTemplateFieldTypeState = useMetadataTypeState({
		defaultFieldType: props.fieldType,
	});
	const metadataTypeOptions = getAvailableMetadataTypeOptions({ disabledOptions });
	const metadataTemplateDescription = getMetadataTemplateDescription(props.fieldConfig, props.isMetadataTemplateField);

	// oxlint-disable-next-line typescript/no-misused-spread
	const selectedType = [...metadataTemplateFieldTypeState.selected][0];
	const currentFieldType = (selectedType ?? 'TEXT') as MetadataFieldType;
	const MetadataTemplateFieldTypeComponent = MetadataTypeComponentsMap[currentFieldType];

	const handleTypeChange = (newFieldType: MetadataFieldType) => {
		if (onChange) {
			onChange({
				fieldType: newFieldType,
				value: getMetadataDefaultValueForType(newFieldType ?? 'TEXT'),
			});
		}
	};

	return (
		<MetadataTemplateFieldTypeComponent
			key={currentFieldType}
			{...props}
			metadataTemplateDescription={metadataTemplateDescription}
			label={
				<span className="flex place-items-center gap-3">
					{props.label}
					{props.isMetadataTemplateField ? null : (
						<MetadataTypeMenu
							metadataTemplateFieldTypeState={metadataTemplateFieldTypeState}
							onTypeChange={handleTypeChange}
							options={metadataTypeOptions}
						/>
					)}
				</span>
			}
			onChange={onChange}
		/>
	);
}

export function Metadata(props: MetadataProps) {
	return <MetadataInternal {...props} />;
}

export function MetadataTemplateFieldValueInput(props: MetadataTemplateFieldValueInputProps) {
	return <MetadataInternal {...props} isMetadataTemplateField />;
}

export function MetadataTemplateFieldDefinitionInput(props: MetadataTemplateFieldDefinitionInputProps) {
	return <MetadataInternal {...props} isMetadataTemplateFieldDefinition />;
}

type MetadataValueField = Omit<
	components['schemas']['MetadataTemplateField'],
	'field' | 'field_type' | 'metadata_template'
> & {
	readonly field_type?: MetadataFieldType;
};

export type MetadataValueProps = {
	readonly field: MetadataValueField;
	readonly hasMissingIndicator?: boolean | undefined;
	readonly showAllOptions?: boolean | undefined;
};

function hasNoMetadataValue(field: MetadataValueField) {
	return (
		field.value === null ||
		field.value === undefined ||
		(typeof field.value === 'string' && field.value.length === 0) ||
		(Array.isArray(field.value) && field.value.length === 0)
	);
}

function shouldHideMetadataValue(field: MetadataValueField) {
	return (
		field.value === null && !isSelectionFieldType(field.field_type) && Object.keys(field.config ?? {}).length === 0
	);
}

function MetadataValueCopyButton(props: { readonly value: string; readonly valueLabel: string }) {
	const [, copy] = useCopyToClipboard();
	const [isOpen, setIsOpen] = useState(false);
	const [tooltipText, setTooltipText] = useState('Copy content');
	const [tooltipTimeout, setTooltipTimeout] = useState<NodeJS.Timeout | undefined>();

	const handleCopy = async () => {
		await copy(props.value);
		setIsOpen(true);
		setTooltipText('Content copied');

		globalToastQueue.add(
			{
				message: 'Content has been copied to clipboard.',
				type: ToastType.TextOnly,
			},
			{ timeout: 2_500 },
		);

		setTooltipTimeout(
			setTimeout(() => {
				setIsOpen(false);
				setTooltipText('Copy content');
			}, 1_500),
		);
	};

	useEffect(
		() => () => {
			clearTimeout(tooltipTimeout);
			setTooltipTimeout(undefined);
		},
		[tooltipTimeout],
	);

	return (
		<Tooltip delay={400} isOpen={isOpen} onOpenChange={setIsOpen}>
			<TooltipTrigger
				aria-label={`Copy ${props.valueLabel}`}
				className="text-base-neutral-700 hover:bg-base-neutral-100 dark:text-base-neutral-100 dark:hover:bg-base-neutral-700"
				onPress={handleCopy}
				size="icon-sm"
				variant="unset"
			>
				<CopyIcon aria-hidden size={18} strokeWidth={2} />
			</TooltipTrigger>
			<TooltipContent arrow={false}>{tooltipText}</TooltipContent>
		</Tooltip>
	);
}

function ReadOnlySelectionIndicator(props: {
	readonly isSelected: boolean;
	readonly selectionType: SelectionFieldType;
}) {
	if (props.selectionType === 'SELECTION') {
		return (
			<span
				aria-hidden
				className={radioStyles({
					isSelected: props.isSelected,
					className: [
						'ml-2.5',
						'border-transparent bg-base-neutral-200 opacity-38',
						props.isSelected && 'border-transparent bg-base-neutral-200 before:bg-base-neutral-900',
					],
				})}
			/>
		);
	}

	return (
		<span aria-hidden className={boxStyles({ isSelected: props.isSelected, className: ['ml-2.5', 'opacity-38'] })}>
			{props.isSelected ? <CheckIcon aria-hidden size={14} strokeWidth={1.5} /> : null}
		</span>
	);
}

function MetadataValueRow(props: {
	readonly children: ReactNode;
	readonly copyLabel: string;
	readonly copyValue: string;
	readonly className?: string | undefined;
}) {
	return (
		<div className={cx('flex h-10 place-content-between place-items-center gap-3', props.className)}>
			<div className="min-w-0 grow">{props.children}</div>
			<MetadataValueCopyButton value={props.copyValue} valueLabel={props.copyLabel} />
		</div>
	);
}

export function MetadataValue({ field, hasMissingIndicator = false, showAllOptions = false }: MetadataValueProps) {
	const hasNoValue = hasNoMetadataValue(field);

	if (hasMissingIndicator && field.mandatory && hasNoValue) {
		return <FileMissingMetadataBadge />;
	}

	if (shouldHideMetadataValue(field)) {
		return null;
	}

	if (field.field_type === 'SELECTION') {
		const config = field.config as { options?: string[] };
		const selection = config.options?.find((option) => option === field.value);

		return (
			<RadioGroup
				aria-label="Selection options"
				className="mt-2 ml-2.5 orientation-vertical:space-y-5"
				defaultValue={selection ?? null}
				isDisabled
			>
				{config.options?.map((option) => (
					<Radio aria-label={`Option ${option}`} key={option} value={option}>
						<span className="opacity-100">{option}</span>
					</Radio>
				))}
			</RadioGroup>
		);
	}

	if (field.field_type === 'MULTI_SELECTION') {
		const config = field.config as { options?: string[] };
		const selectedOptionIndices = normalizeSelectedOptionIndices(
			getSelectedOptionIndicesFromValue(config.options ?? [], field.value, 'MULTI_SELECTION'),
			config.options ?? [],
			'MULTI_SELECTION',
			false,
		);

		return (
			<CheckboxGroup
				aria-label="Selection options"
				className="mt-2 ml-2.5 space-y-5"
				isDisabled
				value={selectedOptionIndices.map((selectedIndex) => selectedIndex.toString())}
			>
				{config.options?.map((option, index) => (
					<Checkbox
						className="disabled:opacity-100 **:data-[slot=checkbox]:gap-x-3 **:data-[slot=indicator]:group-disabled:opacity-38 **:data-[slot=label]:opacity-100"
						aria-label={`Option ${option}`}
						key={`${option}-${index}`}
						value={index.toString()}
					>
						<span>{option}</span>
					</Checkbox>
				))}
			</CheckboxGroup>
		);
	}

	if (field.field_type === 'TAG') {
		const config = field.config as { options?: string[] };
		const availableTagOptions = getAvailableTagOptions(config.options, field.value);
		const selectedTagValues = normalizeSelectedTagValues(field.value, availableTagOptions);
		const displayedTagValues = showAllOptions ? availableTagOptions : selectedTagValues;

		if (displayedTagValues.length === 0) {
			return null;
		}

		return (
			<TagGroup aria-label="Selected tags" selectedKeys={new Set(selectedTagValues)} selectionMode="multiple">
				{displayedTagValues.map((tagValue) => (
					<Tag id={tagValue} key={tagValue} textValue={tagValue} color="selection" size="sm">
						{tagValue}
					</Tag>
				))}
			</TagGroup>
		);
	}

	if (field.field_type === 'WYSIWYG' && typeof field.value === 'object') {
		return <Editor content={field.value} />;
	}

	if (typeof field.value === 'string') {
		return <span className="text-base-md break-all">{field.value}</span>;
	}

	return null;
}

export function MetadataValueWithCopyActions({
	field,
	hasMissingIndicator = false,
	showAllOptions = false,
}: MetadataValueProps) {
	const hasNoValue = hasNoMetadataValue(field);

	if (hasMissingIndicator && field.mandatory && hasNoValue) {
		return <FileMissingMetadataBadge />;
	}

	if (shouldHideMetadataValue(field)) {
		return null;
	}

	if (field.field_type === 'SELECTION') {
		const config = field.config as { options?: string[] };
		const selectedValue = typeof field.value === 'string' ? field.value : null;

		return (
			<div aria-label="Selection options">
				{config.options?.map((option, index) => (
					<MetadataValueRow copyLabel={`option ${index + 1}`} copyValue={option} key={`${option}-${index}`}>
						<div className="flex place-items-center gap-4">
							<ReadOnlySelectionIndicator isSelected={selectedValue === option} selectionType="SELECTION" />
							<span className="break-all">{option}</span>
						</div>
					</MetadataValueRow>
				))}
			</div>
		);
	}

	if (field.field_type === 'MULTI_SELECTION') {
		const config = field.config as { options?: string[] };
		const selectedValues = new Set(
			Array.isArray(field.value) ? field.value.filter((value): value is string => typeof value === 'string') : [],
		);

		return (
			<div aria-label="Selection options">
				{config.options?.map((option, index) => (
					<MetadataValueRow copyLabel={`option ${index + 1}`} copyValue={option} key={`${option}-${index}`}>
						<div className="flex place-items-center gap-4">
							<ReadOnlySelectionIndicator isSelected={selectedValues.has(option)} selectionType="MULTI_SELECTION" />
							<span className="break-all">{option}</span>
						</div>
					</MetadataValueRow>
				))}
			</div>
		);
	}

	if (field.field_type === 'TAG') {
		const config = field.config as { options?: string[] };
		const availableTagOptions = getAvailableTagOptions(config.options, field.value);
		const selectedTagValues = normalizeSelectedTagValues(field.value, availableTagOptions);
		const displayedTagValues = showAllOptions ? availableTagOptions : selectedTagValues;

		if (displayedTagValues.length === 0) {
			return null;
		}

		return (
			<div aria-label="Selected tags" className="flex flex-col gap-2">
				{displayedTagValues.map((tagValue) => (
					<MetadataValueRow copyLabel={`tag ${tagValue}`} copyValue={tagValue} key={tagValue}>
						<span className={tagStyles({ color: 'selection', size: 'sm', isSelected: true })}>{tagValue}</span>
					</MetadataValueRow>
				))}
			</div>
		);
	}

	if (field.field_type === 'WYSIWYG' && typeof field.value === 'object') {
		return <Editor content={field.value} />;
	}

	if (typeof field.value === 'string') {
		return (
			<MetadataValueRow copyLabel="value" copyValue={field.value}>
				<span className="text-base-md break-all">{field.value}</span>
			</MetadataValueRow>
		);
	}

	return null;
}
