'use client';

import { valibotResolver } from '@hookform/resolvers/valibot';
import { getLocalTimeZone, now, parseDate, parseTime, today } from '@internationalized/date';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
	BinaryIcon,
	CalendarIcon,
	ChevronDownIcon,
	ChevronUpIcon,
	ClockIcon,
	Loader2Icon,
	PlusIcon,
	SquareMousePointerIcon,
	SquarePenIcon,
	WholeWordIcon,
	XCircleIcon,
} from 'lucide-react';
import { useEffect, useId, useState, type ComponentType, type ReactNode } from 'react';
import type { Key, Selection } from 'react-aria-components';
import { useFieldArray, useForm, Controller } from 'react-hook-form';
import { ISO_TIME_SECOND_REGEX, ISO_DATE_REGEX, type InferInput } from 'valibot';
import { Editor } from '@/components/editor/Editor';
import { Button, type ButtonProps } from '@/components/ui/Button';
import { DatePicker } from '@/components/ui/DatePicker';
import { Label } from '@/components/ui/Field';
import { Menu, MenuContent, MenuItem, MenuTrigger } from '@/components/ui/Menu';
import { ModalBody, ModalClose, ModalContent, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import { NumberField } from '@/components/ui/NumberField';
import { Radio, RadioGroup } from '@/components/ui/RadioGroup';
import { Select, SelectLabel, SelectList, SelectOption, SelectTrigger } from '@/components/ui/Select';
import { Separator } from '@/components/ui/Separator';
import { Switch } from '@/components/ui/Switch';
import { TextField } from '@/components/ui/TextField';
import { TimeField } from '@/components/ui/TimeField';
import { MetadataSchema } from '@/schemas/MetadataSchema';
import { cx } from '@/styles/cva';
import { linkStyles } from '@/styles/ui/link';
import { $api, openAPIClient } from '@/util/clientFetch';
import { formatErrorMessage } from '@/util/formatErrorMessage';
import type { components } from '@/util/openapiSchema';

export function MetadataBorder(props: ButtonProps & { readonly classNames?: { readonly border?: string } }) {
	return (
		<div
			className={cx(
				'[&:has(button[data-focus-visible])>div]:border-base-sunset-500 [&:has(button[data-hovered])>div]:border-base-sunset-500 [&:has(button[data-pressed])>div]:border-base-sunset-500 pointer-events-none absolute flex h-full w-full',
				props.classNames?.border,
			)}
		>
			<div className="border-base-neutral-100 dark:border-base-neutral-700 w-[80%] shrink-0 rounded-tl-lg rounded-bl-lg border-t border-b border-l sm:w-[85%]" />
			<div className="border-base-neutral-100 dark:border-base-neutral-700 relative border-b">
				<div className="pointer-events-auto flex -translate-y-1/2 place-items-center gap-2">
					<Button {...props} isDestructive size="icon" variant="discreet">
						<XCircleIcon aria-hidden size={18} strokeWidth={1.5} />
					</Button>
				</div>
			</div>
			<div className="border-base-neutral-100 dark:border-base-neutral-700 flex-1 rounded-tr-lg rounded-br-lg border-t border-r border-b" />
		</div>
	);
}

export function MetadataAssignModal(props: {
	readonly isOpen?: boolean | undefined;
	readonly onOpenChange?: ((isOpen: boolean) => void) | undefined;
	readonly selected: string[];
}) {
	const queryClient = useQueryClient();

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
			const { data, error } = await openAPIClient.POST('/api/v1/metadata/bulk-add-to-uploads-datasets/', {
				body: {
					metadata: input.metadata,
					uploads_datasets: props.selected,
				},
			});

			if (error) {
				throw new Error(formatErrorMessage(error));
			}

			return { data };
		},
		async onSuccess() {
			props.onOpenChange?.(false);

			await queryClient.invalidateQueries({
				queryKey: $api.queryOptions('get', '/api/v1/uploads-dataset/').queryKey,
			});

			reset();
		},
		onError(error) {
			console.error(error);
		},
	});

	useEffect(() => {
		reset();
	}, [props.selected, reset]);

	return (
		<ModalContent
			aria-label="Add metadata for all selected files"
			isOpen={props.isOpen!}
			onOpenChange={props.onOpenChange!}
		>
			<form onSubmit={handleSubmit((data) => mutate(data))}>
				<ModalHeader className="text-base-xl" hasBorder>
					Add metadata for all selected files
				</ModalHeader>
				<ModalBody>
					<div className="flex flex-col gap-8 py-6">
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
								onPress={() => append({ custom_key: '', value: '' })}
								size="icon"
								variant="secondary-tonal"
							>
								<PlusIcon aria-hidden size={18} strokeWidth={1.5} />
							</Button>
						) : (
							<Button
								aria-label="Add metadata"
								className="w-fit"
								onPress={() => append({ custom_key: '', value: '' })}
								variant="secondary-tonal"
							>
								<PlusIcon aria-hidden className="mr-2" size={18} strokeWidth={1.5} /> Metadata
							</Button>
						)}
					</div>
				</ModalBody>
				<ModalFooter hasBorder>
					<ModalClose variant="secondary-discreet">Cancel</ModalClose>
					{formState.isDirty ? (
						<Button type="submit" variant="filled">
							{isPending ? <Loader2Icon aria-hidden className="mr-2 h-4 w-4 animate-spin" /> : null}
							Save metadata
						</Button>
					) : null}
				</ModalFooter>
			</form>
		</ModalContent>
	);
}

export function useMetadataTypeState({
	defaultFieldType = 'TEXT',
}: {
	readonly defaultFieldType?: components['schemas']['MetadataTemplateField']['field_type'];
} = {}) {
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [selected, setSelected] = useState<Selection>(new Set([defaultFieldType ?? 'TEXT']));

	const handleType = async (type = 'TEXT') => {
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
	...props
}: {
	readonly isDisabled?: boolean | undefined;
	readonly metadataTemplateFieldTypeState: ReturnType<typeof useMetadataTypeState>;
	readonly options: { fieldType: string; icon: ReactNode; label: string }[];
}) {
	return (
		<Menu
			isOpen={props.metadataTemplateFieldTypeState.isMenuOpen}
			onOpenChange={props.metadataTemplateFieldTypeState.setIsMenuOpen}
			respectScreen={false}
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
				{
					props.options.find((option) => option.fieldType === [...props.metadataTemplateFieldTypeState.selected][0])
						?.icon
				}
				<span>
					<span className="text-base-label-md">
						{
							props.options.find((option) => option.fieldType === [...props.metadataTemplateFieldTypeState.selected][0])
								?.label
						}
					</span>
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
				selectedKeys={props.metadataTemplateFieldTypeState.selected}
				selectionMode="single"
			>
				{props.options.map((option) => (
					<MenuItem
						id={option.fieldType}
						key={option.fieldType}
						onAction={async () => props.metadataTemplateFieldTypeState.handleType(option.fieldType)}
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

const metadataOptions = [
	{
		icon: <WholeWordIcon aria-hidden data-slot="icon" size={18} strokeWidth={1.5} />,
		label: 'Text',
		fieldType: 'TEXT',
	},
	{
		icon: <BinaryIcon aria-hidden data-slot="icon" size={18} strokeWidth={1.5} />,
		label: 'Integer',
		fieldType: 'INTEGER',
	},
	{
		icon: <BinaryIcon aria-hidden data-slot="icon" size={18} strokeWidth={1.5} />,
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
		label: 'Selection',
		fieldType: 'SELECTION',
	},
] satisfies {
	fieldType: components['schemas']['MetadataTemplateField']['field_type'];
	icon: ReactNode;
	label: string;
}[];

export type MetadataProps = {
	// eslint-disable-next-line react/no-unused-prop-types
	readonly disabledOptions?: string[];

	readonly errorMessage: any | undefined;
	// eslint-disable-next-line react/no-unused-prop-types
	readonly fieldConfig?: Record<string, any> | undefined;
	// eslint-disable-next-line react/no-unused-prop-types
	readonly fieldType?: components['schemas']['MetadataTemplateField']['field_type'];
	// eslint-disable-next-line react/no-unused-prop-types
	readonly isDisabled: boolean;
	// eslint-disable-next-line react/no-unused-prop-types
	readonly isMetadataTemplateField?: boolean;
	readonly label: ReactNode | string;
	onBlur(...args: any): void;
	onChange(value: {
		readonly fieldType: components['schemas']['MetadataTemplateField']['field_type'];
		readonly value:
			| Record<string, any>
			| string
			| {
					readonly options: { readonly id: string; readonly value: string }[];
					readonly selectedValue: string | null;
			  }
			| null;
	}): void;
	readonly value: any;
};

const MetadataTypeComponentsMap = {
	TEXT: ({ errorMessage, ...props }: MetadataProps) => (
		<TextField
			{...props}
			autoComplete="off"
			className="gap-2"
			errorMessage={errorMessage?.message}
			isClearable
			onChange={(value) => props.onChange({ fieldType: 'TEXT', value: value ?? null })}
			placeholder="Text value"
			type="text"
		/>
	),
	INTEGER: ({ errorMessage, ...props }: MetadataProps) => (
		<NumberField
			{...props}
			className="gap-2"
			errorMessage={errorMessage?.message}
			onChange={(value) => {
				if (value === null || Number.isNaN(value)) {
					props.onChange({ fieldType: 'INTEGER', value: null });
				} else {
					props.onChange({ fieldType: 'INTEGER', value: value.toString() });
				}
			}}
			placeholder="Number value"
		/>
	),
	DECIMAL: ({ errorMessage, ...props }: MetadataProps) => (
		<NumberField
			{...props}
			className="gap-2"
			errorMessage={errorMessage?.message}
			formatOptions={{
				minimumFractionDigits: 2,
				maximumFractionDigits: 100,
			}}
			onChange={(value) => {
				if (value === null || Number.isNaN(value)) {
					props.onChange({ fieldType: 'DECIMAL', value: null });
				} else {
					props.onChange({ fieldType: 'DECIMAL', value: value.toString() });
				}
			}}
			placeholder="Decimal value"
		/>
	),
	DATE: ({ errorMessage, value, ...props }: MetadataProps) => {
		const parsedValue = ISO_DATE_REGEX.test(value) ? parseDate(value) : null;

		return (
			<DatePicker
				{...props}
				className="gap-2"
				errorMessage={errorMessage?.message}
				onChange={(value) => props.onChange({ fieldType: 'DATE', value: value?.toString() ?? null })}
				shouldForceLeadingZeros
				value={parsedValue}
			/>
		);
	},
	TIME: ({ errorMessage, value, ...props }: MetadataProps) => {
		const parsedValue = ISO_TIME_SECOND_REGEX.test(value) ? parseTime(value) : null;

		return (
			<TimeField
				{...props}
				className="gap-2"
				errorMessage={errorMessage?.message}
				onChange={(value) => props.onChange({ fieldType: 'TIME', value: value?.toString() ?? null })}
				shouldForceLeadingZeros
				suffix={
					<ClockIcon
						aria-hidden
						className="text-base-neutral-600 dark:text-base-neutral-300 top-[calc(var(--spacing)_*_2.5)]! mr-1! size-4.5!"
						data-slot="icon"
						size={18}
						strokeWidth={1.5}
					/>
				}
				value={parsedValue}
			/>
		);
	},
	DATETIME: (_props: MetadataProps) => null,
	WYSIWYG: (props: MetadataProps) => {
		const id = useId();

		return (
			<div className="flex flex-col gap-2">
				<Label htmlFor={id}>{props.label}</Label>
				<Editor
					aria-invalid={props.errorMessage?.message}
					autoComplete="off"
					content={props.value ?? ''}
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
			</div>
		);
	},
	SELECTION: ({ label, ...props }: MetadataProps) => {
		const id = useId();
		const [options, setOptions] = useState<string[]>(() => {
			if (props.fieldConfig?.options?.length) {
				return props.fieldConfig.options;
			}

			return ['', ''];
		});

		const [selectedOptionIndex, setSelectedOptionIndex] = useState<number>(() => {
			if (props.value === null) return 0;
			return options.indexOf(props.value);
		});
		const [selectionEnabled, setSelectionEnabled] = useState<boolean>(Boolean(props.value));

		const getFieldErrorMessage = (idx: number) => props.errorMessage?.config?.options?.[idx]?.message;

		const handleChange = (updatedOptions: string[], selectedIndex: number | null) => {
			props.onChange({
				fieldType: 'SELECTION',
				value: {
					selectedValue: selectedIndex === null ? null : updatedOptions[selectedIndex],
					options: updatedOptions,
				},
			});
		};

		const handleOptionTextChange = (index: number, newValue: string) => {
			const updatedOptions = [...options];
			updatedOptions[index] = newValue;
			setOptions(updatedOptions);
			handleChange(updatedOptions, selectionEnabled ? selectedOptionIndex : null);
		};

		const handleRadioChange = (newSelectedIndex: number) => {
			setSelectedOptionIndex(newSelectedIndex);
			handleChange(options, selectionEnabled ? newSelectedIndex : null);
		};

		const toggleSelectionEnabled = (enabled: boolean) => {
			setSelectionEnabled(enabled);
			handleChange(options, enabled ? selectedOptionIndex : null);
		};

		const addOption = () => {
			const updatedOptions = [...options, ''];
			setOptions(updatedOptions);
			handleChange(updatedOptions, selectionEnabled ? selectedOptionIndex : null);
		};

		const removeOption = (index: number) => {
			if (options.length <= 2) {
				return;
			}

			const updatedOptions = options.filter((_, optionIndex) => optionIndex !== index);
			const newSelectedIndex = selectedOptionIndex === index ? 0 : selectedOptionIndex;

			setOptions(updatedOptions);
			setSelectedOptionIndex(newSelectedIndex);
			handleChange(updatedOptions, selectionEnabled ? newSelectedIndex : null);
		};

		if (props.isMetadataTemplateField) {
			return (
				<Select
					autoComplete="off"
					errorMessage={props.errorMessage?.message}
					isDisabled={props.isDisabled}
					label={label}
					onBlur={props.onBlur}
					onSelectionChange={(key) =>
						props.onChange({
							fieldType: 'SELECTION',
							value: { selectedValue: options[key as number] ?? null, options },
						})
					}
					selectedKey={options.indexOf(props.value).toString() ?? ''}
				>
					<SelectTrigger />
					<SelectList items={options.map((option, index) => ({ id: index.toString(), value: option }))}>
						{(item) => (
							<SelectOption id={item.id} textValue={item.value}>
								<SelectLabel>{item.value}</SelectLabel>
							</SelectOption>
						)}
					</SelectList>
				</Select>
			);
		}

		return (
			<div className="flex flex-col gap-2.5">
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
					<div className="flex flex-row gap-1">
						<RadioGroup
							aria-label="Selection options"
							classNames={{ content: 'h-full flex-wrap place-content-around' }}
							id={id}
							isDisabled={!selectionEnabled}
							onChange={(value) => handleRadioChange(Number.parseInt(value, 10))}
							value={selectedOptionIndex.toString()}
						>
							{options.map((_, index) => (
								<Radio
									aria-label={`Option ${index + 1}`}
									className={cx(getFieldErrorMessage(index) && 'mb-5.5')}
									key={index}
									value={index.toString()}
								/>
							))}
						</RadioGroup>

						<div className="flex flex-1 flex-col gap-2">
							{options.map((option, idx) => (
								<div className="flex items-center gap-2" key={idx}>
									<TextField
										aria-label={`Option ${idx + 1} value`}
										errorMessage={getFieldErrorMessage(idx)}
										isDisabled={props.isDisabled}
										onChange={(value) => handleOptionTextChange(idx, value)}
										placeholder="Option value ..."
										value={option}
									/>
									<Button
										aria-label={`Remove option ${idx + 1}`}
										className={cx(getFieldErrorMessage(idx) && 'mb-5.5')}
										isDestructive
										isDisabled={options.length <= 2}
										onPress={() => removeOption(idx)}
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
	},
} satisfies Record<NonNullable<components['schemas']['MetadataTemplateField']['field_type']>, ComponentType<any>>;

function getMetadataDefaultValueForType(
	type: NonNullable<components['schemas']['MetadataTemplateField']['field_type']>,
) {
	switch (type) {
		case 'TEXT':
			return '';
		case 'INTEGER':
			return '0';
		case 'DECIMAL':
			return '0.00';
		case 'DATE':
			return today(getLocalTimeZone()).toString();
		case 'TIME':
			return now(getLocalTimeZone()).toString();
		case 'DATETIME':
		case 'WYSIWYG':
			return '';
		case 'SELECTION':
			return {
				selectedId: null,
				options: ['', ''],
			};
		default:
			return '';
	}
}

export function Metadata({ onChange, disabledOptions = [], ...props }: MetadataProps) {
	const metadataTemplateFieldTypeState = useMetadataTypeState({
		defaultFieldType: props.fieldType,
	});
	const [previousFieldType, setPreviousFieldType] = useState<Key | undefined>(
		[...metadataTemplateFieldTypeState.selected][0],
	);

	const currentFieldType = [...metadataTemplateFieldTypeState.selected][0] as keyof typeof MetadataTypeComponentsMap;
	const MetadataTemplateFieldTypeComponent = MetadataTypeComponentsMap[currentFieldType];

	useEffect(() => {
		if (currentFieldType !== previousFieldType && onChange) {
			onChange({
				fieldType: currentFieldType,
				value: getMetadataDefaultValueForType(currentFieldType),
			});
			setPreviousFieldType(currentFieldType);
		}
	}, [currentFieldType, previousFieldType, onChange]);

	return (
		<MetadataTemplateFieldTypeComponent
			{...props}
			label={
				<span className="flex place-items-center gap-3">
					{props.label}
					{props.isMetadataTemplateField ? null : (
						<MetadataTypeMenu
							metadataTemplateFieldTypeState={metadataTemplateFieldTypeState}
							options={metadataOptions.filter((option) => !disabledOptions.includes(option.fieldType))}
						/>
					)}
				</span>
			}
			onChange={onChange}
		/>
	);
}

export function MetadataValue({
	field,
}: {
	readonly field: Omit<components['schemas']['MetadataTemplateField'], 'field' | 'metadata_template'>;
}) {
	if (field.value === null) {
		return null;
	}

	if (field.field_type === 'SELECTION' && typeof field.value === 'string') {
		const config = field.config as { options?: string[] };
		const option = config.options?.find((option) => option === field.value);

		return option ? <span className="text-base-md break-all">{option}</span> : null;
	}

	if (field.field_type === 'WYSIWYG' && typeof field.value === 'object') {
		return <Editor content={field.value} />;
	}

	if (typeof field.value === 'string') {
		return <span className="text-base-md break-all">{field.value}</span>;
	}

	return null;
}
