'use client';

import { RestrictToVerticalAxis } from '@dnd-kit/abstract/modifiers';
import { DragDropProvider } from '@dnd-kit/react';
import { useSortable } from '@dnd-kit/react/sortable';
import { parseDate, parseTime } from '@internationalized/date';
import { ChevronDownIcon, GripVerticalIcon, PlusIcon, RadarIcon, SlidersVerticalIcon, XCircleIcon } from 'lucide-react';
import { useEffect, useState, type ReactNode, type Ref } from 'react';
import { useDebounceValue } from 'usehooks-ts';
import { Button } from '@/components/ui/Button';
import {
	ComboBox,
	ComboBoxContent,
	ComboBoxInput,
	ComboBoxItem,
	ComboBoxLabel,
	ComboBoxSection,
} from '@/components/ui/ComboBox';
import { DatePicker, DatePickerTrigger } from '@/components/ui/DatePicker';
import { Input } from '@/components/ui/Input';
import { Menu, MenuContent, MenuItem, MenuTrigger } from '@/components/ui/Menu';
import {
	Select,
	SelectContent,
	SelectDescription,
	SelectItem,
	SelectLabel,
	SelectTrigger,
} from '@/components/ui/Select';
import { TextField } from '@/components/ui/TextField';
import { TimeField, TimeInput } from '@/components/ui/TimeField';
import { cx } from '@/styles/cva';
import { getSortableDragIndices } from '@/util/dndSortable';
import {
	filterContext,
	getBoundedMetadataKeys,
	isChoiceFieldType,
	type MetadataKeyScope,
	type MetadataValueFieldType,
	type ScalarFieldType,
} from '@/util/filterContext';
import type { FilterPreset } from '@/util/filterPresets';
import {
	availableFieldsForCluster,
	type ClusterEligibleField,
	type EnrichedSearchField,
	getOperatorsForMixedField,
	getSearchOperatorOptions,
	getSearchFieldById,
	getSearchFieldValueOptions,
	getTypeaheadConfig,
	isClusterItem,
	type MetadataCluster,
	type MetadataClusterRow,
	type SearchFilterConnector,
	type SearchFilterItem,
	type SearchFilterRowItem,
	type SearchFilterValue,
	type SearchSchemaField,
	STRING_ONLY_OPERATORS,
} from '@/util/globalSearch';
import { SearchFilterChoiceValueControl } from './SearchFilterChoiceValueControl';
import { SearchFilterMetadataKeyValueControl } from './SearchFilterMetadataKeyValueControl';
import { SearchFilterPresetMenu } from './SearchFilterPresetMenu';
import { SearchFilterResourceValueControl } from './SearchFilterResourceValueControl';

const CONNECTOR_OPTIONS = [
	{ id: 'AND', label: 'and' },
	{ id: 'OR', label: 'or' },
] satisfies { id: SearchFilterConnector; label: string }[];

function AdvancedFilterEmptyIllustration() {
	return (
		<div aria-hidden className="relative h-[60px] w-[76px] text-base-crystal-500 dark:text-base-crystal-300">
			<RadarIcon aria-hidden size={48} strokeWidth={1} className="absolute top-0 left-0" />
			<SlidersVerticalIcon aria-hidden size={24} strokeWidth={1.5} className="absolute right-0 bottom-0" />
		</div>
	);
}

function SearchFilterEmptyState(props: {
	readonly isDisabled?: boolean;
	onAddRow(): void;
	onPresetSelect(preset: FilterPreset): void;
	readonly variant: 'card' | 'embedded';
}) {
	const content = (
		<div className="flex flex-col place-items-center gap-4 px-6 pt-10 pb-8 text-center">
			<AdvancedFilterEmptyIllustration />
			<p>Apply conditions for advanced filtering</p>
			<SearchFilterPresetMenu onPresetSelect={props.onPresetSelect} />
			<Button isDisabled={props.isDisabled} onPress={props.onAddRow} variant="discreet">
				<PlusIcon aria-hidden size={18} strokeWidth={1.5} /> Or add a condition
			</Button>
		</div>
	);

	if (props.variant === 'embedded') {
		return content;
	}

	return (
		<div className="rounded-sm border border-base-neutral-200 bg-base-neutral-0 shadow-base-sm dark:border-base-neutral-600 dark:bg-base-neutral-800">
			{content}
		</div>
	);
}

function SearchFilterShell(props: { readonly children: ReactNode; readonly variant: 'card' | 'embedded' }) {
	if (props.variant === 'embedded') {
		return <div className="flex flex-col gap-4 px-6 pt-10 pb-8">{props.children}</div>;
	}

	return (
		<div className="rounded-sm border border-base-neutral-200 bg-base-neutral-0 shadow-base-sm dark:border-base-neutral-600 dark:bg-base-neutral-800">
			<div className="flex flex-col gap-4 p-4 sm:p-6">{props.children}</div>
		</div>
	);
}

const BOOLEAN_OPTIONS = [
	{ id: 'true', label: 'True' },
	{ id: 'false', label: 'False' },
];

const EMPTY_CHECK_OPERATORS = new Set(['is_empty', 'is_not_empty']);
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^\d{2}:\d{2}(?::\d{2})?$/;

function tryParseDate(value: string) {
	return DATE_ONLY_PATTERN.test(value) ? parseDate(value) : null;
}

function tryParseTime(value: string) {
	if (!TIME_PATTERN.test(value)) {
		return null;
	}
	try {
		return parseTime(value);
	} catch {
		return null;
	}
}

function SearchFilterDateValueControl(props: {
	onValueChange(value: SearchFilterValue): void;
	readonly value: SearchFilterValue;
}) {
	const stringValue = typeof props.value === 'string' ? props.value : '';
	const parsedValue = tryParseDate(stringValue);

	return (
		<DatePicker
			aria-label="Condition value"
			onChange={(nextValue) => props.onValueChange(nextValue?.toString() ?? '')}
			shouldForceLeadingZeros
			value={parsedValue}
		>
			<DatePickerTrigger className="sm:rounded-l-none" />
		</DatePicker>
	);
}

function SearchFilterDateRangeValueControl(props: {
	onValueChange(value: SearchFilterValue): void;
	readonly value: SearchFilterValue;
}) {
	const rangeValue = Array.isArray(props.value) ? props.value : ['', ''];
	const fromDate = tryParseDate(rangeValue[0] ?? '');
	const toDate = tryParseDate(rangeValue[1] ?? '');

	return (
		<div className="flex gap-1 sm:rounded-l-none">
			<DatePicker
				aria-label="From date"
				onChange={(nextValue) => {
					const nextFrom = nextValue?.toString() ?? '';
					props.onValueChange([nextFrom, rangeValue[1] ?? '']);
				}}
				shouldForceLeadingZeros
				value={fromDate}
			>
				<DatePickerTrigger />
			</DatePicker>
			<DatePicker
				aria-label="To date"
				onChange={(nextValue) => {
					const nextTo = nextValue?.toString() ?? '';
					props.onValueChange([rangeValue[0] ?? '', nextTo]);
				}}
				shouldForceLeadingZeros
				value={toDate}
			>
				<DatePickerTrigger />
			</DatePicker>
		</div>
	);
}

const MULTI_VALUE_OPERATORS = new Set(['in', 'not_in']);

function SearchFilterTimeValueControl(props: {
	onValueChange(value: SearchFilterValue): void;
	readonly value: SearchFilterValue;
}) {
	const stringValue = typeof props.value === 'string' ? props.value : '';
	const parsedValue = tryParseTime(stringValue);

	return (
		<TimeField
			aria-label="Condition value"
			className="sm:rounded-l-none"
			onChange={(nextValue) => props.onValueChange(nextValue?.toString() ?? '')}
			shouldForceLeadingZeros
			value={parsedValue}
		>
			<TimeInput />
		</TimeField>
	);
}

function SearchFilterTimeRangeValueControl(props: {
	onValueChange(value: SearchFilterValue): void;
	readonly value: SearchFilterValue;
}) {
	const rangeValue = Array.isArray(props.value) ? props.value : ['', ''];
	const fromTime = tryParseTime(rangeValue[0] ?? '');
	const toTime = tryParseTime(rangeValue[1] ?? '');

	return (
		<div className="flex gap-1 sm:rounded-l-none">
			<TimeField
				aria-label="From time"
				onChange={(nextValue) => {
					const nextFrom = nextValue?.toString() ?? '';
					props.onValueChange([nextFrom, rangeValue[1] ?? '']);
				}}
				shouldForceLeadingZeros
				value={fromTime}
			>
				<TimeInput />
			</TimeField>
			<TimeField
				aria-label="To time"
				onChange={(nextValue) => {
					const nextTo = nextValue?.toString() ?? '';
					props.onValueChange([rangeValue[0] ?? '', nextTo]);
				}}
				shouldForceLeadingZeros
				value={toTime}
			>
				<TimeInput />
			</TimeField>
		</div>
	);
}

function SearchFilterNumberValueControl(props: {
	readonly isInteger: boolean;
	onValueChange(value: SearchFilterValue): void;
	readonly value: SearchFilterValue;
}) {
	const stringValue = typeof props.value === 'string' ? props.value : '';

	return (
		<TextField
			aria-label="Condition value"
			onChange={(nextValue) => props.onValueChange(nextValue)}
			value={stringValue}
		>
			<Input
				className="sm:rounded-l-none"
				inputMode={props.isInteger ? 'numeric' : 'decimal'}
				placeholder={props.isInteger ? 'Enter integer' : 'Enter number'}
				type="number"
				step={props.isInteger ? '1' : 'any'}
			/>
		</TextField>
	);
}

function SearchFilterMixedValueControl(props: {
	readonly fieldType: ScalarFieldType | undefined;
	onValueChange(value: SearchFilterValue): void;
	readonly operator: string;
	readonly value: SearchFilterValue;
}) {
	const effectiveFieldType = props.fieldType;

	if (effectiveFieldType === 'DATE' || effectiveFieldType === 'DATETIME') {
		if (props.operator === 'between') {
			return <SearchFilterDateRangeValueControl onValueChange={props.onValueChange} value={props.value} />;
		}
		return <SearchFilterDateValueControl onValueChange={props.onValueChange} value={props.value} />;
	}

	if (effectiveFieldType === 'TIME') {
		if (props.operator === 'between') {
			return <SearchFilterTimeRangeValueControl onValueChange={props.onValueChange} value={props.value} />;
		}
		return <SearchFilterTimeValueControl onValueChange={props.onValueChange} value={props.value} />;
	}

	if (effectiveFieldType === 'INTEGER' || effectiveFieldType === 'DECIMAL') {
		return (
			<SearchFilterNumberValueControl
				isInteger={effectiveFieldType === 'INTEGER'}
				onValueChange={props.onValueChange}
				value={props.value}
			/>
		);
	}

	const textValue = typeof props.value === 'string' ? props.value : '';
	return <SearchFilterTextValueControl onValueChange={props.onValueChange} value={textValue} />;
}

function SearchFilterChipMultiSelect(props: {
	readonly entityLabels?: Record<string, string>;
	readonly items: readonly { readonly id: string; readonly label: string }[];
	onValueChange(value: SearchFilterValue): void;
	readonly value: SearchFilterValue;
}) {
	const arrayValue = Array.isArray(props.value) ? props.value : [];
	const [inputValue, setInputValue] = useState('');
	const comboItems = props.items.filter((item) => !arrayValue.includes(item.id));

	const handleSelect = (key: string | number | null) => {
		if (key === null) {
			return;
		}

		const keyStr = String(key);
		if (arrayValue.includes(keyStr)) {
			return;
		}

		props.onValueChange([...arrayValue, keyStr]);
		setInputValue('');
	};

	const handleRemove = (keyToRemove: string) => {
		props.onValueChange(arrayValue.filter((key) => key !== keyToRemove));
	};

	const getChipLabel = (key: string) => {
		if (props.entityLabels?.[key]) {
			return props.entityLabels[key];
		}

		const staticItem = props.items.find((item) => item.id === key);
		return staticItem?.label ?? key;
	};

	return (
		<div className="flex w-full min-w-0 flex-col gap-1">
			{arrayValue.length > 0 ? (
				<div className="flex flex-wrap gap-1">
					{arrayValue.map((key) => (
						<span
							className="inline-flex place-items-center gap-1 rounded-sm bg-base-neutral-100 px-2 py-0.5 text-base-sm dark:bg-base-neutral-700"
							key={key}
						>
							{getChipLabel(key)}
							<button
								aria-label={`Remove ${getChipLabel(key)}`}
								className="shrink-0 cursor-pointer text-base-neutral-500 hover:text-base-neutral-900 dark:hover:text-base-neutral-100"
								onClick={() => handleRemove(key)}
								type="button"
							>
								<XCircleIcon aria-hidden size={14} strokeWidth={1.5} />
							</button>
						</span>
					))}
				</div>
			) : null}
			<ComboBox
				allowsCustomValue
				allowsEmptyCollection
				aria-label="Add value"
				inputValue={inputValue}
				items={comboItems}
				menuTrigger="focus"
				onInputChange={setInputValue}
				onChange={handleSelect}
			>
				<ComboBoxInput className="sm:rounded-l-none" placeholder="Select value..." />
				<ComboBoxContent
					renderEmptyState={() => (
						<div className="px-3 py-2 text-base-label-sm text-base-neutral-600 dark:text-base-neutral-300">
							No results found
						</div>
					)}
				>
					<ComboBoxSection title={comboItems.length === 0 ? '' : 'Results'}>
						{comboItems.map((item) => (
							<ComboBoxItem id={item.id} key={item.id} textValue={item.label}>
								<ComboBoxLabel>{item.label}</ComboBoxLabel>
							</ComboBoxItem>
						))}
					</ComboBoxSection>
				</ComboBoxContent>
			</ComboBox>
		</div>
	);
}

function SearchFilterValueControl(props: {
	readonly boundedMetadataKeys?: readonly string[];
	readonly entityLabels?: Record<string, string>;
	readonly field: SearchSchemaField | undefined;
	readonly inferredFieldType: MetadataValueFieldType | undefined;
	readonly metadataKeyScope?: MetadataKeyScope;
	onEntityLabelsChange?(labels: Record<string, string>): void;
	onValueChange(value: SearchFilterValue): void;
	readonly operator: string;
	readonly value: SearchFilterValue;
}) {
	if (EMPTY_CHECK_OPERATORS.has(props.operator)) {
		return null;
	}

	const valueType = props.field?.value_type;

	if (valueType === 'mixed' && props.field) {
		if (isChoiceFieldType(props.inferredFieldType)) {
			return (
				<SearchFilterChoiceValueControl
					fieldType={props.inferredFieldType}
					keys={props.boundedMetadataKeys ?? []}
					onValueChange={props.onValueChange}
					operator={props.operator}
					scope={props.metadataKeyScope}
					value={props.value}
				/>
			);
		}
		return (
			<SearchFilterMixedValueControl
				fieldType={props.inferredFieldType}
				onValueChange={props.onValueChange}
				operator={props.operator}
				value={props.value}
			/>
		);
	}

	if (props.field?.id === 'metadata.key') {
		return (
			<SearchFilterMetadataKeyValueControl
				onValueChange={props.onValueChange}
				operator={props.operator}
				scope={props.metadataKeyScope}
				value={props.value}
			/>
		);
	}

	const typeaheadConfig = props.field ? getTypeaheadConfig(props.field.id) : undefined;
	const isMulti = MULTI_VALUE_OPERATORS.has(props.operator);

	if (isMulti && typeaheadConfig) {
		return (
			<SearchFilterResourceValueControl
				config={typeaheadConfig}
				entityLabels={props.entityLabels}
				onEntityLabelsChange={props.onEntityLabelsChange}
				operator={props.operator}
				onValueChange={props.onValueChange}
				value={props.value}
			/>
		);
	}

	if (isMulti) {
		const enumValues = getSearchFieldValueOptions(props.field);
		const staticItems = enumValues.map((v) => ({ id: v, label: v }));

		return (
			<SearchFilterChipMultiSelect
				entityLabels={props.entityLabels}
				items={staticItems}
				onValueChange={props.onValueChange}
				value={props.value}
			/>
		);
	}

	if (typeaheadConfig && !STRING_ONLY_OPERATORS.has(props.operator)) {
		return (
			<SearchFilterResourceValueControl
				config={typeaheadConfig}
				entityLabels={props.entityLabels}
				onEntityLabelsChange={props.onEntityLabelsChange}
				operator={props.operator}
				onValueChange={props.onValueChange}
				value={props.value}
			/>
		);
	}

	if (valueType === 'boolean') {
		const boolValue = props.value === true ? 'true' : props.value === false ? 'false' : '';

		return (
			<Select
				aria-label="Condition value"
				onChange={(key) => props.onValueChange(String(key) === 'true')}
				value={boolValue}
			>
				<SelectTrigger className="sm:rounded-l-none" />
				<SelectContent items={BOOLEAN_OPTIONS}>
					{(item) => (
						<SelectItem id={item.id} textValue={item.label}>
							<SelectLabel>{item.label}</SelectLabel>
						</SelectItem>
					)}
				</SelectContent>
			</Select>
		);
	}

	if (valueType === 'datetime') {
		if (props.operator === 'between') {
			return <SearchFilterDateRangeValueControl onValueChange={props.onValueChange} value={props.value} />;
		}

		return <SearchFilterDateValueControl onValueChange={props.onValueChange} value={props.value} />;
	}

	const enumValues = getSearchFieldValueOptions(props.field);

	if (enumValues.length > 0) {
		const stringValue = typeof props.value === 'string' ? props.value : '';

		return (
			<Select aria-label="Condition value" onChange={(key) => props.onValueChange(String(key))} value={stringValue}>
				<SelectTrigger className="sm:rounded-l-none" />
				<SelectContent items={enumValues.map((value) => ({ id: value, label: value }))}>
					{(item) => (
						<SelectItem id={item.id} textValue={item.label}>
							<SelectLabel>{item.label}</SelectLabel>
						</SelectItem>
					)}
				</SelectContent>
			</Select>
		);
	}

	const textValue = typeof props.value === 'string' ? props.value : '';

	return <SearchFilterTextValueControl onValueChange={props.onValueChange} value={textValue} />;
}

function SearchFilterTextValueControl(props: { onValueChange(value: string): void; readonly value: string }) {
	const { onValueChange, value: committedValue } = props;
	const [value, setValue] = useState(committedValue);
	const [debouncedValue, setDebouncedValue] = useDebounceValue(committedValue, 250);

	useEffect(() => {
		setValue(committedValue);
		setDebouncedValue(committedValue);
	}, [committedValue, setDebouncedValue]);

	useEffect(() => {
		if (debouncedValue === committedValue) {
			return;
		}

		onValueChange(debouncedValue);
	}, [committedValue, debouncedValue, onValueChange]);

	return (
		<TextField
			aria-label="Condition value"
			onChange={(nextValue) => {
				setValue(nextValue);
				setDebouncedValue(nextValue);
			}}
			value={value}
		>
			<Input className="sm:rounded-l-none" placeholder="Enter term" />
		</TextField>
	);
}

function isEnrichedField(field: SearchSchemaField): field is EnrichedSearchField {
	return 'applicableTypes' in field;
}

function getFieldTypeBadge(field: SearchSchemaField, totalSelectedTypes: number): string | null {
	if (!isEnrichedField(field) || field.applicableTypes.length >= totalSelectedTypes) {
		return null;
	}

	return field.applicableTypes.join(', ');
}

function StaleFieldTriggerContent(props: { readonly rawId: string }) {
	return (
		<>
			<span className="truncate text-base-lg text-base-neutral-900 sm:text-base-md dark:text-base-neutral-40">
				{props.rawId}
			</span>
			<ChevronDownIcon
				aria-hidden
				className="ml-auto size-6 shrink-0 stroke-[1.5] duration-200 group-open:rotate-180"
				data-slot="icon"
			/>
		</>
	);
}

function ItemConnectorSlot(props: {
	readonly connector: SearchFilterConnector | undefined;
	readonly id: string;
	readonly index: number;
	onConnectorChange(id: string, connector: SearchFilterConnector): void;
}) {
	return (
		<div className="w-[70px] text-center">
			{props.index === 0 ? (
				<span>Where</span>
			) : (
				<Select
					aria-label="Condition connector"
					onChange={(key) => props.onConnectorChange(props.id, String(key) as SearchFilterConnector)}
					value={props.connector ?? 'AND'}
				>
					<SelectTrigger className="h-8 border-transparent bg-transparent px-2 py-1 text-left text-base-sm text-base-neutral-900 shadow-none hover:bg-base-neutral-100 dark:text-base-neutral-40 dark:hover:bg-base-neutral-700" />
					<SelectContent items={CONNECTOR_OPTIONS}>
						{(item) => (
							<SelectItem id={item.id} textValue={item.label}>
								<SelectLabel>{item.label}</SelectLabel>
							</SelectItem>
						)}
					</SelectContent>
				</Select>
			)}
		</div>
	);
}

function SearchAdvancedFilterRow(props: {
	readonly fields: readonly EnrichedSearchField[];
	readonly index: number;
	readonly metadataKeyScope: MetadataKeyScope | undefined;
	onConnectorChange(id: string, connector: SearchFilterConnector): void;
	onEntityLabelsChange(id: string, labels: Record<string, string>): void;
	onFieldChange(id: string, fieldId: string): void;
	onOperatorChange(id: string, operator: string): void;
	onRemove(id: string): void;
	onValueChange(id: string, value: SearchFilterValue): void;
	readonly row: SearchFilterRowItem;
	readonly totalSelectedTypes: number;
}) {
	const { ref, handleRef } = useSortable({
		id: props.row.id,
		index: props.index,
		data: { idx: props.index },
	});
	const selectedField = getSearchFieldById(props.fields, props.row.field);
	// Top-level rows cannot host metadata.value (cluster-eligible), so per-cluster narrowing
	// is not in play here. Mixed-field operators always render in text mode at the top level.
	const isMixed = selectedField?.value_type === 'mixed';
	const allOperators = selectedField?.operators ?? [];
	const operatorOptions = getSearchOperatorOptions(
		isMixed ? getOperatorsForMixedField(selectedField, undefined) : allOperators,
	);
	const warningBadge = selectedField ? getFieldTypeBadge(selectedField, props.totalSelectedTypes) : null;
	const hasValueControl = !EMPTY_CHECK_OPERATORS.has(props.row.operator);

	return (
		<div className="flex flex-col gap-1" ref={ref}>
			<div className="flex flex-row place-items-center gap-2">
				<ItemConnectorSlot
					connector={props.row.connector}
					id={props.row.id}
					index={props.index}
					onConnectorChange={props.onConnectorChange}
				/>
				<div className="flex grow flex-row place-items-center gap-2">
					<div className="flex w-full flex-col gap-2 sm:flex-row">
						<Select
							aria-label="Condition field"
							onChange={(key) => props.onFieldChange(props.row.id, String(key))}
							value={props.row.field}
						>
							<SelectTrigger className="sm:rounded-r-none">
								{selectedField ? undefined : <StaleFieldTriggerContent rawId={props.row.field} />}
							</SelectTrigger>
							<SelectContent items={props.fields}>
								{(item) => {
									const badge = getFieldTypeBadge(item, props.totalSelectedTypes);
									const label = item.label ?? item.id;
									return (
										<SelectItem id={item.id} textValue={label}>
											<SelectLabel>{label}</SelectLabel>
											{badge ? (
												<SelectDescription className="text-base-xs text-base-neutral-400 dark:text-base-neutral-500">
													{badge}
												</SelectDescription>
											) : null}
										</SelectItem>
									);
								}}
							</SelectContent>
						</Select>
						<Select
							aria-label="Condition operator"
							onChange={(key) => props.onOperatorChange(props.row.id, String(key))}
							value={props.row.operator}
						>
							<SelectTrigger className={hasValueControl ? 'sm:rounded-none' : 'sm:rounded-l-none'} />
							<SelectContent items={operatorOptions}>
								{(item) => (
									<SelectItem id={item.id} textValue={item.label}>
										<SelectLabel>{item.label}</SelectLabel>
									</SelectItem>
								)}
							</SelectContent>
						</Select>
						<SearchFilterValueControl
							entityLabels={props.row.entityLabels}
							field={selectedField}
							inferredFieldType={undefined}
							metadataKeyScope={props.metadataKeyScope}
							onEntityLabelsChange={(labels) => props.onEntityLabelsChange(props.row.id, labels)}
							onValueChange={(value) => props.onValueChange(props.row.id, value)}
							operator={props.row.operator}
							value={props.row.value}
						/>
					</div>
					<div className="flex place-items-center gap-1">
						<Button
							aria-label="Remove condition"
							isDestructive
							onPress={() => props.onRemove(props.row.id)}
							size="icon"
							variant="discreet"
						>
							<XCircleIcon aria-hidden size={18} strokeWidth={1.5} />
						</Button>
						<div className="hidden sm:flex">
							<SearchFilterDragHandle dragHandleRef={handleRef} />
						</div>
					</div>
				</div>
			</div>
			{warningBadge ? (
				<p className="text-base-xs text-base-neutral-400 sm:pl-[86px] dark:text-base-neutral-500">
					Only applies to: {warningBadge}
				</p>
			) : null}
		</div>
	);
}

const CLUSTER_FIELD_SHORT_LABEL: Record<ClusterEligibleField, string> = {
	'metadata.key': 'Metadata key',
	'metadata.value': 'Metadata value',
	'metadata.field_type': 'Metadata field type',
};

function clusterRowFieldOptions(
	cluster: MetadataCluster,
	currentField: ClusterEligibleField,
): { readonly id: ClusterEligibleField; readonly label: string }[] {
	const available = availableFieldsForCluster(cluster);
	const ids: ClusterEligibleField[] = [currentField, ...available];
	return ids.map((id) => ({ id, label: CLUSTER_FIELD_SHORT_LABEL[id] }));
}

function MetadataClusterRowRenderer(props: {
	readonly cluster: MetadataCluster;
	readonly fields: readonly EnrichedSearchField[];
	readonly inferredFieldType: MetadataValueFieldType | undefined;
	readonly metadataKeyScope: MetadataKeyScope | undefined;
	onFieldChange(clusterId: string, rowId: string, fieldId: ClusterEligibleField): void;
	onOperatorChange(clusterId: string, rowId: string, operator: string): void;
	onRemove(clusterId: string, rowId: string): void;
	onValueChange(clusterId: string, rowId: string, value: SearchFilterValue): void;
	readonly position: 'first' | 'subsequent';
	readonly row: MetadataClusterRow;
}) {
	const selectedField = getSearchFieldById(props.fields, props.row.field);
	const isMixed = selectedField?.value_type === 'mixed';
	const allOperators = selectedField?.operators ?? [];
	const operatorOptions = getSearchOperatorOptions(
		isMixed ? getOperatorsForMixedField(selectedField, props.inferredFieldType) : allOperators,
	);
	const hasValueControl = !EMPTY_CHECK_OPERATORS.has(props.row.operator);
	const fieldOptions = clusterRowFieldOptions(props.cluster, props.row.field as ClusterEligibleField);
	const boundedMetadataKeys = getBoundedMetadataKeys(props.cluster.rows);

	return (
		<div className="flex flex-col gap-1">
			<div className="flex flex-row place-items-center gap-2">
				<div className="w-[70px] text-center text-base-sm text-base-neutral-600 dark:text-base-neutral-300">
					{props.position === 'first' ? 'Where' : 'and'}
				</div>
				<div className="flex grow flex-row place-items-center gap-2">
					<div className="flex w-full flex-col gap-2 sm:flex-row">
						<Select
							aria-label="Metadata field"
							onChange={(key) =>
								props.onFieldChange(props.cluster.id, props.row.id, String(key) as ClusterEligibleField)
							}
							value={props.row.field}
						>
							<SelectTrigger className="sm:rounded-r-none" />
							<SelectContent items={fieldOptions}>
								{(item) => (
									<SelectItem id={item.id} textValue={item.label}>
										<SelectLabel>{item.label}</SelectLabel>
									</SelectItem>
								)}
							</SelectContent>
						</Select>
						<Select
							aria-label="Condition operator"
							onChange={(key) => props.onOperatorChange(props.cluster.id, props.row.id, String(key))}
							value={props.row.operator}
						>
							<SelectTrigger className={hasValueControl ? 'sm:rounded-none' : 'sm:rounded-l-none'} />
							<SelectContent items={operatorOptions}>
								{(item) => (
									<SelectItem id={item.id} textValue={item.label}>
										<SelectLabel>{item.label}</SelectLabel>
									</SelectItem>
								)}
							</SelectContent>
						</Select>
						<SearchFilterValueControl
							boundedMetadataKeys={boundedMetadataKeys}
							field={selectedField}
							inferredFieldType={props.inferredFieldType}
							metadataKeyScope={props.metadataKeyScope}
							onValueChange={(value) => props.onValueChange(props.cluster.id, props.row.id, value)}
							operator={props.row.operator}
							value={props.row.value}
						/>
					</div>
					<div className="flex place-items-center gap-1">
						<Button
							aria-label="Remove metadata row"
							isDestructive
							onPress={() => props.onRemove(props.cluster.id, props.row.id)}
							size="icon"
							variant="discreet"
						>
							<XCircleIcon aria-hidden size={18} strokeWidth={1.5} />
						</Button>
					</div>
				</div>
			</div>
			{props.row.field === 'metadata.value' && !props.row.operator && isChoiceFieldType(props.inferredFieldType) ? (
				<p className="pl-[78px] text-base-xs text-base-sunset-700 dark:text-base-sunset-300">
					Choose a compatible operator to include this metadata value in the search.
				</p>
			) : null}
		</div>
	);
}

function MetadataClusterCard(props: {
	readonly cluster: MetadataCluster;
	readonly fields: readonly EnrichedSearchField[];
	readonly inferredFieldType: MetadataValueFieldType | undefined;
	readonly index: number;
	readonly metadataKeyScope: MetadataKeyScope | undefined;
	onAddRow(clusterId: string, field: ClusterEligibleField): void;
	onClusterRemove(clusterId: string): void;
	onConnectorChange(id: string, connector: SearchFilterConnector): void;
	onRowFieldChange(clusterId: string, rowId: string, fieldId: ClusterEligibleField): void;
	onRowOperatorChange(clusterId: string, rowId: string, operator: string): void;
	onRowRemove(clusterId: string, rowId: string): void;
	onRowValueChange(clusterId: string, rowId: string, value: SearchFilterValue): void;
}) {
	const { ref, handleRef } = useSortable({
		id: props.cluster.id,
		index: props.index,
		data: { idx: props.index },
	});
	const available = availableFieldsForCluster(props.cluster);

	return (
		<div className="flex flex-row place-items-start gap-2" ref={ref}>
			<ItemConnectorSlot
				connector={props.cluster.connector}
				id={props.cluster.id}
				index={props.index}
				onConnectorChange={props.onConnectorChange}
			/>
			<div className="bg-base-neutral-50 grow rounded-sm border border-base-neutral-200 px-4 pt-2 pb-4 dark:border-base-neutral-700 dark:bg-base-neutral-800/40">
				<div className="mb-2 flex place-items-center justify-between gap-2">
					<span>All of the following are true ...</span>
					<div className="flex place-items-center gap-1">
						{available.length > 0 ? (
							<Menu>
								<MenuTrigger aria-label="Add to this metadata" size="icon" variant="discreet">
									<PlusIcon aria-hidden size={18} strokeWidth={1.5} />
								</MenuTrigger>
								<MenuContent
									popover={{ arrow: false }}
									items={available.map((field) => ({ id: field, label: CLUSTER_FIELD_SHORT_LABEL[field] }))}
								>
									{(item) => (
										<MenuItem
											id={item.id}
											onAction={() => props.onAddRow(props.cluster.id, item.id as ClusterEligibleField)}
											textValue={item.label}
										>
											{item.label}
										</MenuItem>
									)}
								</MenuContent>
							</Menu>
						) : null}
						<Button
							aria-label="Remove metadata predicate"
							isDestructive
							onPress={() => props.onClusterRemove(props.cluster.id)}
							size="icon"
							variant="discreet"
						>
							<XCircleIcon aria-hidden size={18} strokeWidth={1.5} />
						</Button>
						<div className="hidden sm:flex">
							<SearchFilterDragHandle dragHandleRef={handleRef} />
						</div>
					</div>
				</div>
				<div className="flex flex-col gap-2">
					{props.cluster.rows.map((row, rowIndex) => (
						<MetadataClusterRowRenderer
							cluster={props.cluster}
							fields={props.fields}
							inferredFieldType={props.inferredFieldType}
							key={row.id}
							metadataKeyScope={props.metadataKeyScope}
							onFieldChange={props.onRowFieldChange}
							onOperatorChange={props.onRowOperatorChange}
							onRemove={props.onRowRemove}
							onValueChange={props.onRowValueChange}
							position={rowIndex === 0 ? 'first' : 'subsequent'}
							row={row}
						/>
					))}
				</div>
			</div>
		</div>
	);
}

function SearchFilterDragHandle(props: { readonly dragHandleRef: Ref<HTMLButtonElement> | undefined }) {
	return (
		<Button
			aria-label="Reorder condition"
			className="cursor-grab"
			ref={props.dragHandleRef}
			size="icon"
			variant="discreet"
		>
			<GripVerticalIcon aria-hidden size={18} strokeWidth={1.5} />
		</Button>
	);
}

export function SearchAdvancedFilters(props: {
	readonly fields: readonly EnrichedSearchField[];
	readonly items: readonly SearchFilterItem[];
	onAddItem(fieldId: string): void;
	onClusterAddRow(clusterId: string, field: ClusterEligibleField): void;
	onClusterRemove(clusterId: string): void;
	onClusterRowFieldChange(clusterId: string, rowId: string, fieldId: ClusterEligibleField): void;
	onClusterRowOperatorChange(clusterId: string, rowId: string, operator: string): void;
	onClusterRowRemove(clusterId: string, rowId: string): void;
	onClusterRowValueChange(clusterId: string, rowId: string, value: SearchFilterValue): void;
	onConnectorChange(id: string, connector: SearchFilterConnector): void;
	onMove(fromIndex: number, toIndex: number): void;
	onPresetSelect(preset: FilterPreset): void;
	onRemoveItem(id: string): void;
	onRowEntityLabelsChange(id: string, labels: Record<string, string>): void;
	onRowFieldChange(id: string, fieldId: string): void;
	onRowOperatorChange(id: string, operator: string): void;
	onRowValueChange(id: string, value: SearchFilterValue): void;
	readonly totalSelectedTypes?: number;
	readonly variant?: 'card' | 'embedded';
}) {
	const onAddDefault = () => {
		const firstFieldId = props.fields[0]?.id ?? '';
		props.onAddItem(firstFieldId);
	};

	if (props.items.length === 0) {
		return (
			<SearchFilterEmptyState
				isDisabled={props.fields.length === 0}
				onAddRow={onAddDefault}
				onPresetSelect={props.onPresetSelect}
				variant={props.variant ?? 'card'}
			/>
		);
	}

	const ctx = filterContext(props.items);
	const metadataKeyScope = ctx.scope;

	return (
		<SearchFilterShell variant={props.variant ?? 'card'}>
			<p className="text-base-neutral-600 dark:text-base-neutral-300">Show results ...</p>
			<DragDropProvider
				modifiers={[RestrictToVerticalAxis]}
				onDragEnd={(event) => {
					const sortableIndices = getSortableDragIndices(event);
					if (!sortableIndices) {
						return;
					}

					props.onMove(sortableIndices.initialIndex, sortableIndices.index);
				}}
			>
				<div className="flex flex-col gap-2">
					{props.items.map((item, index) =>
						isClusterItem(item) ? (
							<MetadataClusterCard
								cluster={item}
								fields={props.fields}
								index={index}
								inferredFieldType={ctx.cluster(item.id).inferredFieldType}
								key={item.id}
								metadataKeyScope={metadataKeyScope}
								onAddRow={props.onClusterAddRow}
								onClusterRemove={props.onClusterRemove}
								onConnectorChange={props.onConnectorChange}
								onRowFieldChange={props.onClusterRowFieldChange}
								onRowOperatorChange={props.onClusterRowOperatorChange}
								onRowRemove={props.onClusterRowRemove}
								onRowValueChange={props.onClusterRowValueChange}
							/>
						) : (
							<SearchAdvancedFilterRow
								fields={props.fields}
								index={index}
								key={item.id}
								metadataKeyScope={metadataKeyScope}
								onConnectorChange={props.onConnectorChange}
								onEntityLabelsChange={props.onRowEntityLabelsChange}
								onFieldChange={props.onRowFieldChange}
								onOperatorChange={props.onRowOperatorChange}
								onRemove={props.onRemoveItem}
								onValueChange={props.onRowValueChange}
								row={item}
								totalSelectedTypes={props.totalSelectedTypes ?? 0}
							/>
						),
					)}
				</div>
			</DragDropProvider>
			<div className={cx('flex gap-2 sm:pl-[86px]', props.items.length === 1 ? 'pt-1' : '')}>
				<Button aria-label="Add condition" onPress={onAddDefault} size="icon" variant="crystal-tonal">
					<PlusIcon aria-hidden size={18} strokeWidth={1.5} />
				</Button>
				<SearchFilterPresetMenu onPresetSelect={props.onPresetSelect} />
			</div>
		</SearchFilterShell>
	);
}
