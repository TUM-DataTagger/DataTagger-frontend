'use client';

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import {
	ComboBox,
	ComboBoxContent,
	ComboBoxInput,
	ComboBoxItem,
	ComboBoxLabel,
	ComboBoxSection,
} from '@/components/ui/ComboBox';
import { dropdownItemStyles } from '@/components/ui/Dropdown';
import { PopoverContent } from '@/components/ui/Popover';
import { SearchField, SearchInput } from '@/components/ui/SearchField';
import { Tag, TagGroup } from '@/components/ui/TagGroup';
import { cx } from '@/styles/cva';
import type { ChoiceFieldType, MetadataKeyScope } from '@/util/filterContext';
import { isChoiceFilterValueState, toChoiceFilterValueState, type SearchFilterValue } from '@/util/globalSearch';
import { useMetadataChoiceSuggestions, type MetadataChoiceSuggestionGroup } from './useMetadataChoiceSuggestions';

const SELECTION_TOKEN_OPERATORS = new Set(['in', 'not_in']);
const SOURCE_LABEL = { project: 'Project', folder: 'Folder', dataset: 'Dataset', template: 'Template' } as const;
function suggestionLiteralById(
	id: string,
	suggestions: ReturnType<typeof useMetadataChoiceSuggestions>,
): string | undefined {
	return suggestions.idToValue.get(id);
}

function suggestionGroupLabel(group: MetadataChoiceSuggestionGroup): string {
	return `${group.key} · ${group.metadata_template_container_name} · ${SOURCE_LABEL[group.source]} ${group.source_name}`;
}

type ChoiceCollectionOption = {
	readonly id: string;
	readonly value: string;
};

type ChoiceCollectionSection = {
	readonly id: string;
	readonly options: readonly ChoiceCollectionOption[];
	readonly title: string;
};

function suggestionSections(groups: readonly MetadataChoiceSuggestionGroup[]): ChoiceCollectionSection[] {
	return groups.map((group) => ({
		id: group.id,
		options: group.options,
		title: suggestionGroupLabel(group),
	}));
}

function ChoiceCollection(props: {
	readonly emptyMessage: string;
	readonly isError: boolean;
	readonly selectedValues: ReadonlySet<string>;
	readonly sections: readonly ChoiceCollectionSection[];
}) {
	return (
		<ComboBoxContent
			items={props.sections}
			renderEmptyState={() => (
				<div
					className={cx(
						'px-3 py-2 text-base-label-sm',
						props.isError
							? 'text-base-sunset-700 dark:text-base-sunset-300'
							: 'text-base-neutral-600 dark:text-base-neutral-300',
					)}
				>
					{props.emptyMessage}
				</div>
			)}
		>
			{(section) => (
				<ComboBoxSection id={section.id} items={section.options} title={section.title}>
					{(option) => (
						<ComboBoxItem
							data-selected-literal={props.selectedValues.has(option.value) ? 'true' : 'false'}
							forceSelectedIndicator={props.selectedValues.has(option.value)}
							id={option.id}
							key={option.id}
							textValue={option.value}
						>
							<ComboBoxLabel>{option.value}</ComboBoxLabel>
						</ComboBoxItem>
					)}
				</ComboBoxSection>
			)}
		</ComboBoxContent>
	);
}

function SingleChoiceControl(props: SearchFilterChoiceValueControlProps) {
	const [isOpen, setIsOpen] = useState(false);
	const stringValue = typeof props.value === 'string' ? props.value : '';
	const suggestions = useMetadataChoiceSuggestions({
		enabled: isOpen,
		fieldType: props.fieldType,
		keys: props.keys,
		scope: props.scope,
	});
	const selectedValues = new Set(stringValue ? [stringValue] : []);
	const sections = useMemo(() => suggestionSections(suggestions.groups), [suggestions.groups]);
	const emptyMessage = suggestions.isError
		? 'Configured choices could not be loaded. You can still enter a value.'
		: suggestions.isLoading
			? 'Loading configured choices...'
			: 'No configured choices. You can enter any literal.';

	return (
		<ComboBox
			allowsCustomValue
			allowsEmptyCollection
			aria-label="Choice value"
			inputValue={stringValue}
			menuTrigger="focus"
			onChange={(id) => {
				if (id === null) return;
				const literal = suggestionLiteralById(String(id), suggestions);
				if (literal !== undefined) props.onValueChange(literal);
			}}
			onInputChange={props.onValueChange}
			onOpenChange={setIsOpen}
		>
			<ComboBoxInput className="sm:rounded-l-none" placeholder="Enter or select a value..." />
			<ChoiceCollection
				emptyMessage={emptyMessage}
				isError={suggestions.isError}
				sections={sections}
				selectedValues={selectedValues}
			/>
		</ComboBox>
	);
}

function MultiChoiceControl(props: SearchFilterChoiceValueControlProps) {
	const [inputValue, setInputValue] = useState('');
	const [isOpen, setIsOpen] = useState(false);
	const [activeOptionIndex, setActiveOptionIndex] = useState(-1);
	const activeOptionIndexRef = useRef(-1);
	const inputRef = useRef<HTMLInputElement>(null);
	const triggerRef = useRef<HTMLDivElement>(null);
	const listBoxId = useId();
	const valueState = useMemo(() => toChoiceFilterValueState(props.value), [props.value]);
	const selectedValues = [...valueState.selected];
	const incomingTagValues = useMemo(
		() => [...valueState.selected, ...valueState.unselected.filter((value) => !valueState.selected.includes(value))],
		[valueState],
	);
	const [candidateOrder, setCandidateOrder] = useState(incomingTagValues);
	const tagValues = useMemo(() => {
		const incomingSet = new Set(incomingTagValues);
		const retainedValues = candidateOrder.filter((value) => incomingSet.has(value));
		const retainedSet = new Set(retainedValues);
		return [...retainedValues, ...incomingTagValues.filter((value) => !retainedSet.has(value))];
	}, [candidateOrder, incomingTagValues]);
	const tagItems = tagValues.map((value) => ({ id: value, value }));
	const suggestions = useMetadataChoiceSuggestions({
		enabled: isOpen,
		fieldType: props.fieldType,
		keys: props.keys,
		scope: props.scope,
	});
	const representedValues = new Set(tagValues);
	const sections = suggestionSections(suggestions.groups)
		.map((section) => ({
			...section,
			options: section.options.filter((option) => !representedValues.has(option.value)),
		}))
		.filter((section) => section.options.length > 0);
	const normalizedInput = inputValue.trim().toLocaleLowerCase();
	const visibleSections = sections
		.map((section) => ({
			...section,
			options: normalizedInput
				? section.options.filter((option) => option.value.toLocaleLowerCase().includes(normalizedInput))
				: section.options,
		}))
		.filter((section) => section.options.length > 0);
	const flattenedOptions = visibleSections.flatMap((section) => section.options);
	const emptyMessage = suggestions.isError
		? 'Configured choices could not be loaded. You can still enter a value.'
		: suggestions.isLoading
			? 'Loading configured choices...'
			: 'No matching configured choices. Press Enter to add this value.';
	const updateActiveOptionIndex = (index: number) => {
		activeOptionIndexRef.current = index;
		setActiveOptionIndex(index);
	};

	useEffect(() => {
		if (
			candidateOrder.length === tagValues.length &&
			candidateOrder.every((value, index) => value === tagValues[index])
		) {
			return;
		}
		setCandidateOrder(tagValues);
	}, [candidateOrder, tagValues]);

	const addCandidate = (literal: string) => {
		if (!literal.trim()) return;
		setCandidateOrder((values) => (values.includes(literal) ? values : [...values, literal]));
		props.onValueChange({
			selected: selectedValues.includes(literal) ? selectedValues : [...selectedValues, literal],
			unselected: valueState.unselected.filter((value) => value !== literal),
		});
		setInputValue('');
		updateActiveOptionIndex(-1);
	};

	const handleKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
		if (event.key === 'Escape') {
			event.preventDefault();
			setIsOpen(false);
			updateActiveOptionIndex(-1);
			return;
		}
		if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
			event.preventDefault();
			setIsOpen(true);
			const direction = event.key === 'ArrowDown' ? 1 : -1;
			const current = activeOptionIndexRef.current;
			const nextIndex =
				flattenedOptions.length === 0
					? -1
					: current < 0
						? direction > 0
							? 0
							: flattenedOptions.length - 1
						: (current + direction + flattenedOptions.length) % flattenedOptions.length;
			updateActiveOptionIndex(nextIndex);
			return;
		}
		if (event.key !== 'Enter') return;
		const activeOption = flattenedOptions[activeOptionIndexRef.current];
		event.preventDefault();
		if (activeOption) {
			addCandidate(activeOption.value);
			return;
		}
		addCandidate(inputValue);
	};

	return (
		<div className="flex w-full min-w-0 flex-col gap-1">
			{tagItems.length > 0 ? (
				<TagGroup
					aria-label="Choice value candidates"
					className="w-full place-self-stretch"
					color="selection"
					items={tagItems}
					onRemove={(keys) => {
						setCandidateOrder((values) => values.filter((value) => !keys.has(value)));
						props.onValueChange({
							selected: selectedValues.filter((value) => !keys.has(value)),
							unselected: valueState.unselected.filter((value) => !keys.has(value)),
						});
					}}
					onSelectionChange={(keys) => {
						const nextSelected = keys === 'all' ? tagValues : tagValues.filter((value) => keys.has(value));
						const nextSelectedSet = new Set(nextSelected);
						props.onValueChange({
							selected: nextSelected,
							unselected: tagValues.filter((value) => !nextSelectedSet.has(value)),
						});
					}}
					selectedKeys={new Set(selectedValues)}
					selectionMode="multiple"
				>
					{(item) => (
						<Tag data-choice-value={item.value} id={item.id} size="sm" textValue={item.value}>
							{item.value}
						</Tag>
					)}
				</TagGroup>
			) : null}
			<div
				onBlur={(event) => {
					if (!event.currentTarget.contains(event.relatedTarget)) setIsOpen(false);
				}}
				ref={triggerRef}
			>
				<SearchField
					aria-label="Search and add choice values"
					className="w-full"
					onChange={(value) => {
						setInputValue(value);
						updateActiveOptionIndex(-1);
						setIsOpen(true);
					}}
					value={inputValue}
				>
					<SearchInput
						aria-activedescendant={activeOptionIndex >= 0 ? `${listBoxId}-option-${activeOptionIndex}` : undefined}
						aria-autocomplete="list"
						aria-controls={listBoxId}
						aria-expanded={isOpen}
						className="sm:rounded-l-none"
						onFocus={() => setIsOpen(true)}
						onKeyDown={handleKeyDown}
						placeholder="Search or add values..."
						ref={inputRef}
						role="combobox"
						tabIndex={0}
					/>
				</SearchField>
				<PopoverContent
					arrow={false}
					className="z-50 max-h-96 w-(--trigger-width) max-w-(--trigger-width) p-0"
					isNonModal
					isOpen={isOpen}
					onOpenChange={setIsOpen}
					placement="bottom start"
					triggerRef={triggerRef}
				>
					<div aria-label="Choice values" className="grid w-full min-w-0 grid-cols-1 p-1" id={listBoxId} role="listbox">
						{visibleSections.length === 0 ? (
							<div
								className={cx(
									'px-3 py-2 text-base-label-sm',
									suggestions.isError
										? 'text-base-sunset-700 dark:text-base-sunset-300'
										: 'text-base-neutral-600 dark:text-base-neutral-300',
								)}
							>
								{emptyMessage}
							</div>
						) : null}
						{visibleSections.map((section) => {
							const sectionStartIndex = flattenedOptions.findIndex((option) => option.id === section.options[0]?.id);
							const headingId = `${listBoxId}-${section.id}-heading`;
							return (
								<div aria-labelledby={headingId} key={section.id} role="group">
									<div
										className="px-3 py-2 text-base-label-sm wrap-break-word text-base-neutral-600 dark:text-base-neutral-300"
										id={headingId}
									>
										{section.title}
									</div>
									{section.options.map((option, optionIndex) => {
										const index = sectionStartIndex + optionIndex;
										return (
											<button
												aria-selected="false"
												className={dropdownItemStyles({
													className: 'w-full text-left',
													isFocused: index === activeOptionIndex,
												})}
												id={`${listBoxId}-option-${index}`}
												key={option.id}
												onClick={() => {
													addCandidate(option.value);
													inputRef.current?.focus();
												}}
												onMouseDown={(event) => event.preventDefault()}
												onMouseEnter={() => updateActiveOptionIndex(index)}
												role="option"
												tabIndex={-1}
												type="button"
											>
												<span className="col-start-1">{option.value}</span>
											</button>
										);
									})}
								</div>
							);
						})}
					</div>
				</PopoverContent>
			</div>
		</div>
	);
}

type SearchFilterChoiceValueControlProps = {
	readonly fieldType: ChoiceFieldType;
	readonly keys: readonly string[];
	onValueChange(value: SearchFilterValue): void;
	readonly operator: string;
	readonly scope?: MetadataKeyScope;
	readonly value: SearchFilterValue;
};

export function SearchFilterChoiceValueControl(props: SearchFilterChoiceValueControlProps) {
	const isTokenControl =
		props.fieldType !== 'SELECTION' ||
		SELECTION_TOKEN_OPERATORS.has(props.operator) ||
		Array.isArray(props.value) ||
		isChoiceFilterValueState(props.value);
	return isTokenControl ? <MultiChoiceControl {...props} /> : <SingleChoiceControl {...props} />;
}
