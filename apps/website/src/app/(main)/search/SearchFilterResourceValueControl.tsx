'use client';

import { useQuery } from '@tanstack/react-query';
import { XCircleIcon } from 'lucide-react';
import { useEffect, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { useDebounceValue } from 'usehooks-ts';
import {
	ComboBox,
	ComboBoxContent,
	ComboBoxInput,
	ComboBoxItem,
	ComboBoxLabel,
	ComboBoxSection,
} from '@/components/ui/ComboBox';
import { $api } from '@/util/clientFetch';
import { type SearchFilterValue, type TypeaheadFieldConfig } from '@/util/globalSearch';

const RESOURCE_SUGGESTION_LIMIT = 25;
const RESOURCE_SUGGESTION_DEBOUNCE_MS = 300;
const MULTI_VALUE_OPERATORS = new Set(['in', 'not_in']);

type ResourceSuggestionRawResult = {
	readonly pk: string;
	readonly name: string;
	readonly display_name?: string;
	readonly metadata_template_container?: { readonly name: string };
};

type ResourceSuggestion = {
	readonly id: string;
	readonly label: string;
	readonly name: string;
	readonly pk: string;
};

type ResourceSuggestionPage = {
	readonly count?: number;
	readonly next?: string | null;
	readonly results?: readonly ResourceSuggestionRawResult[];
};

type ResourceSuggestionsResult = {
	readonly hasMore: boolean;
	readonly isLoadingMore: boolean;
	readonly items: readonly ResourceSuggestion[];
	onLoadMore(): void;
};

function normalizeResourceSuggestion(
	raw: ResourceSuggestionRawResult,
	config: TypeaheadFieldConfig,
): ResourceSuggestion {
	const label = raw.display_name ?? raw.name ?? raw.metadata_template_container?.name ?? raw.pk;
	const id =
		config.valueKey === 'display_name' ? (raw.display_name ?? raw.pk) : config.valueKey === 'name' ? raw.name : raw.pk;
	return {
		id,
		label,
		name: raw.name ?? label,
		pk: raw.pk,
	};
}

function appendUniqueSuggestions(
	currentItems: readonly ResourceSuggestion[],
	nextItems: readonly ResourceSuggestion[],
): ResourceSuggestion[] {
	const seen = new Set(currentItems.map((item) => item.id));
	const appended = nextItems.filter((item) => {
		if (seen.has(item.id)) {
			return false;
		}
		seen.add(item.id);
		return true;
	});
	return [...currentItems, ...appended];
}

function useResourceSuggestions(
	config: TypeaheadFieldConfig,
	searchInput: string,
	enabled: boolean,
): ResourceSuggestionsResult {
	const [debouncedInput] = useDebounceValue(searchInput, searchInput.trim() ? RESOURCE_SUGGESTION_DEBOUNCE_MS : 0);
	const [offset, setOffset] = useState(0);
	const [items, setItems] = useState<readonly ResourceSuggestion[]>([]);
	const query = {
		limit: RESOURCE_SUGGESTION_LIMIT,
		offset,
		ordering: 'name',
		search: debouncedInput,
	};
	const endpoint = config.endpoint;

	useEffect(() => {
		setOffset(0);
		setItems([]);
	}, [endpoint, debouncedInput]);

	const projectQuery = useQuery({
		...$api.queryOptions('get', '/api/v1/project/', { params: { query } }),
		enabled: enabled && endpoint === '/api/v1/project/',
	});
	const folderQuery = useQuery({
		...$api.queryOptions('get', '/api/v1/folder/', { params: { query } }),
		enabled: enabled && endpoint === '/api/v1/folder/',
	});
	const datasetQuery = useQuery({
		...$api.queryOptions('get', '/api/v1/uploads-dataset/', { params: { query } }),
		enabled: enabled && endpoint === '/api/v1/uploads-dataset/',
	});
	const versionQuery = useQuery({
		...$api.queryOptions('get', '/api/v1/uploads-version/', { params: { query } }),
		enabled: enabled && endpoint === '/api/v1/uploads-version/',
	});
	const templateContainerQuery = useQuery({
		...$api.queryOptions('get', '/api/v1/metadata-template-container/', { params: { query } }),
		enabled: enabled && endpoint === '/api/v1/metadata-template-container/',
	});
	const templateQuery = useQuery({
		...$api.queryOptions('get', '/api/v1/metadata-template/', { params: { query } }),
		enabled: enabled && endpoint === '/api/v1/metadata-template/',
	});

	const activeQuery =
		endpoint === '/api/v1/project/'
			? projectQuery
			: endpoint === '/api/v1/folder/'
				? folderQuery
				: endpoint === '/api/v1/uploads-dataset/'
					? datasetQuery
					: endpoint === '/api/v1/uploads-version/'
						? versionQuery
						: endpoint === '/api/v1/metadata-template-container/'
							? templateContainerQuery
							: endpoint === '/api/v1/metadata-template/'
								? templateQuery
								: undefined;

	const page = activeQuery?.data as ResourceSuggestionPage | undefined;

	useEffect(() => {
		if (!enabled || !page) {
			return;
		}

		const nextItems = (page.results ?? []).map((result) => normalizeResourceSuggestion(result, config));
		setItems((currentItems) => (offset === 0 ? nextItems : appendUniqueSuggestions(currentItems, nextItems)));
	}, [config, enabled, offset, page]);

	const hasMore = Boolean(page?.next);

	return {
		hasMore,
		isLoadingMore: Boolean(activeQuery?.isFetching && offset > 0),
		items,
		onLoadMore: () => {
			if (!hasMore || activeQuery?.isFetching) {
				return;
			}
			setOffset((currentOffset) => currentOffset + RESOURCE_SUGGESTION_LIMIT);
		},
	};
}

export function SearchFilterResourceValueControl(props: {
	readonly config: TypeaheadFieldConfig;
	readonly entityLabels?: Record<string, string>;
	onEntityLabelsChange?(labels: Record<string, string>): void;
	onValueChange(value: SearchFilterValue): void;
	readonly operator: string;
	readonly value: SearchFilterValue;
}) {
	if (MULTI_VALUE_OPERATORS.has(props.operator)) {
		return <SearchFilterResourceMultiValueControl {...props} />;
	}

	return <SearchFilterResourceSingleValueControl {...props} />;
}

function SearchFilterResourceSingleValueControl(props: {
	readonly config: TypeaheadFieldConfig;
	readonly entityLabels?: Record<string, string>;
	onEntityLabelsChange?(labels: Record<string, string>): void;
	onValueChange(value: SearchFilterValue): void;
	readonly operator: string;
	readonly value: SearchFilterValue;
}) {
	const stringValue = typeof props.value === 'string' ? props.value : '';
	const displayLabel =
		stringValue && (props.entityLabels?.[stringValue] ?? (props.config.valueKey === 'pk' ? undefined : stringValue));
	const currentSelection = stringValue && displayLabel ? { id: stringValue, label: displayLabel } : null;
	const [isOpen, setIsOpen] = useState(false);
	const [inputValue, setInputValue] = useState(displayLabel ?? '');
	const acceptsCustomValue = props.config.valueKey !== 'pk';
	const suggestions = useResourceSuggestions(props.config, inputValue, isOpen);
	const items = suggestions.items.filter((item) => item.id !== stringValue);

	const handleInputChange = (nextValue: string) => {
		setInputValue(nextValue);
		if (acceptsCustomValue) {
			props.onValueChange(nextValue);
		}
	};

	const restoreCurrentSelectionLabel = () => {
		if (!currentSelection) {
			return;
		}
		window.setTimeout(() => {
			setInputValue(currentSelection.label);
		}, 0);
	};

	const handleInputKeyDownCapture = (event: ReactKeyboardEvent<HTMLInputElement>) => {
		if (event.key === 'Escape' && currentSelection) {
			restoreCurrentSelectionLabel();
		}
	};

	return (
		<ComboBox
			allowsCustomValue
			allowsEmptyCollection
			aria-label="Condition value"
			inputValue={inputValue}
			items={items}
			menuTrigger="focus"
			onOpenChange={(open) => {
				setIsOpen(open);
				if (open) {
					if (currentSelection) {
						setInputValue('');
					}
					return;
				}
				if (currentSelection) {
					setInputValue(currentSelection.label);
				}
			}}
			onChange={(key) => {
				if (key === null) {
					return;
				}
				const selected = items.find((item) => item.id === String(key));
				if (!selected) {
					return;
				}

				props.onValueChange(selected.id);
				setInputValue(selected.label);

				if (props.config.valueKey === 'pk' && props.onEntityLabelsChange) {
					props.onEntityLabelsChange({
						...props.entityLabels,
						[selected.pk]: selected.label,
					});
				}
			}}
			onInputChange={handleInputChange}
		>
			<ComboBoxInput
				className="sm:rounded-l-none"
				onKeyDownCapture={handleInputKeyDownCapture}
				placeholder="Type to search..."
			/>
			<ComboBoxContent
				loadMore={suggestions}
				renderEmptyState={() => (
					<div className="px-3 py-2 text-base-label-sm text-base-neutral-600 dark:text-base-neutral-300">
						No results found
					</div>
				)}
			>
				{currentSelection ? (
					<ComboBoxSection title="Current selection">
						<ComboBoxItem id="current-selection" isDisabled textValue={currentSelection.label}>
							<ComboBoxLabel>{currentSelection.label}</ComboBoxLabel>
						</ComboBoxItem>
					</ComboBoxSection>
				) : null}
				<ComboBoxSection title={items.length === 0 ? '' : 'Results'}>
					{items.map((item) => (
						<ComboBoxItem id={item.id} key={`${item.pk}-${item.id}`} textValue={item.label}>
							<ComboBoxLabel>{item.label}</ComboBoxLabel>
						</ComboBoxItem>
					))}
				</ComboBoxSection>
			</ComboBoxContent>
		</ComboBox>
	);
}

function SearchFilterResourceMultiValueControl(props: {
	readonly config: TypeaheadFieldConfig;
	readonly entityLabels?: Record<string, string>;
	onEntityLabelsChange?(labels: Record<string, string>): void;
	onValueChange(value: SearchFilterValue): void;
	readonly operator: string;
	readonly value: SearchFilterValue;
}) {
	const arrayValue = Array.isArray(props.value) ? props.value : [];
	const [isOpen, setIsOpen] = useState(false);
	const [inputValue, setInputValue] = useState('');
	const acceptsCustomValue = props.config.valueKey !== 'pk';
	const selectedValues = new Set(arrayValue);
	const suggestions = useResourceSuggestions(props.config, inputValue, isOpen);
	const items = suggestions.items.filter((item) => !selectedValues.has(item.id));

	const getChipLabel = (key: string) => props.entityLabels?.[key] ?? key;

	const handleSelect = (key: string | number | null) => {
		if (key === null) {
			return;
		}
		const selected = items.find((item) => item.id === String(key));
		if (!selected || selectedValues.has(selected.id)) {
			return;
		}

		props.onValueChange([...arrayValue, selected.id]);
		window.setTimeout(() => {
			setInputValue('');
		}, 0);

		if (props.config.valueKey === 'pk' && props.onEntityLabelsChange) {
			props.onEntityLabelsChange({
				...props.entityLabels,
				[selected.pk]: selected.label,
			});
		}
	};

	const handleInputKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
		if (!acceptsCustomValue || event.key !== 'Enter') {
			return;
		}
		const activeDescendant = event.currentTarget.getAttribute('aria-activedescendant');
		if (activeDescendant) {
			return;
		}
		const trimmed = inputValue.trim();
		if (!trimmed || selectedValues.has(trimmed)) {
			return;
		}

		event.preventDefault();
		props.onValueChange([...arrayValue, trimmed]);
		setInputValue('');
	};

	const handleRemove = (keyToRemove: string) => {
		props.onValueChange(arrayValue.filter((key) => key !== keyToRemove));
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
				items={items}
				menuTrigger="focus"
				onChange={handleSelect}
				onInputChange={setInputValue}
				onOpenChange={setIsOpen}
			>
				<ComboBoxInput
					className="sm:rounded-l-none"
					onKeyDownCapture={handleInputKeyDown}
					placeholder="Type to search..."
				/>
				<ComboBoxContent
					loadMore={suggestions}
					renderEmptyState={() => (
						<div className="px-3 py-2 text-base-label-sm text-base-neutral-600 dark:text-base-neutral-300">
							No results found
						</div>
					)}
				>
					<ComboBoxSection title={items.length === 0 ? '' : 'Results'}>
						{items.map((item) => (
							<ComboBoxItem id={item.id} key={`${item.pk}-${item.id}`} textValue={item.label}>
								<ComboBoxLabel>{item.label}</ComboBoxLabel>
							</ComboBoxItem>
						))}
					</ComboBoxSection>
				</ComboBoxContent>
			</ComboBox>
		</div>
	);
}
