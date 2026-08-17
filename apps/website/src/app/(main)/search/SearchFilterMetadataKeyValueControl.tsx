'use client';

import { XCircleIcon } from 'lucide-react';
import { useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import {
	ComboBox,
	ComboBoxContent,
	ComboBoxInput,
	ComboBoxItem,
	ComboBoxLabel,
	ComboBoxSection,
} from '@/components/ui/ComboBox';
import { Input } from '@/components/ui/Input';
import { TextField } from '@/components/ui/TextField';
import { type MetadataKeyScope } from '@/util/filterContext';
import { STRING_ONLY_OPERATORS, type SearchFilterValue } from '@/util/globalSearch';
import { type MetadataKeySuggestionGroups, useMetadataKeySuggestions } from './useMetadataKeySuggestions';

const MULTI_VALUE_OPERATORS = new Set(['in', 'not_in']);

export function SearchFilterMetadataKeyValueControl(props: {
	onValueChange(value: SearchFilterValue): void;
	readonly operator: string;
	readonly scope: MetadataKeyScope | undefined;
	readonly value: SearchFilterValue;
}) {
	if (STRING_ONLY_OPERATORS.has(props.operator)) {
		const textValue = typeof props.value === 'string' ? props.value : '';
		return (
			<TextField
				aria-label="Condition value"
				onChange={(nextValue) => props.onValueChange(nextValue)}
				value={textValue}
			>
				<Input className="sm:rounded-l-none" placeholder="Enter term" />
			</TextField>
		);
	}

	if (MULTI_VALUE_OPERATORS.has(props.operator)) {
		return <MetadataKeyChipMultiSelect onValueChange={props.onValueChange} scope={props.scope} value={props.value} />;
	}

	return <MetadataKeyComboBox onValueChange={props.onValueChange} scope={props.scope} value={props.value} />;
}

function MetadataKeyPopoverContent(props: {
	readonly groups: MetadataKeySuggestionGroups;
	readonly scope: MetadataKeyScope | undefined;
}) {
	return (
		<ComboBoxContent
			renderEmptyState={() => (
				<div className="px-3 py-2 text-base-label-sm text-base-neutral-600 dark:text-base-neutral-300">
					{props.scope === undefined
						? 'Add a project, folder, or dataset filter to see template-suggested keys.'
						: 'No template keys configured for the selected scope.'}
				</div>
			)}
		>
			{props.groups.map((group) => (
				<ComboBoxSection key={group.source} title={group.sourceLabel}>
					{group.keys.map(({ id, suggestion }) => (
						<ComboBoxItem id={id} key={id} textValue={suggestion.key}>
							<ComboBoxLabel>
								<span className="flex w-full place-items-center justify-between gap-2">
									<span>{suggestion.key}</span>
									<span className="text-base-xs text-base-neutral-500 dark:text-base-neutral-400">
										{suggestion.field_type}
									</span>
								</span>
							</ComboBoxLabel>
						</ComboBoxItem>
					))}
				</ComboBoxSection>
			))}
		</ComboBoxContent>
	);
}

function MetadataKeyComboBox(props: {
	onValueChange(value: SearchFilterValue): void;
	readonly scope: MetadataKeyScope | undefined;
	readonly value: SearchFilterValue;
}) {
	const stringValue = typeof props.value === 'string' ? props.value : '';
	const { groups, idToKey } = useMetadataKeySuggestions(props.scope);

	return (
		<ComboBox
			allowsCustomValue
			allowsEmptyCollection
			aria-label="Condition value"
			inputValue={stringValue}
			menuTrigger="focus"
			onChange={(id) => {
				if (id === null) {
					return;
				}
				const key = idToKey.get(String(id));
				if (key !== undefined) {
					props.onValueChange(key);
				}
			}}
			onInputChange={(next) => {
				props.onValueChange(next);
			}}
		>
			<ComboBoxInput className="sm:rounded-l-none" placeholder="Type to search..." />
			<MetadataKeyPopoverContent groups={groups} scope={props.scope} />
		</ComboBox>
	);
}

function MetadataKeyChipMultiSelect(props: {
	onValueChange(value: SearchFilterValue): void;
	readonly scope: MetadataKeyScope | undefined;
	readonly value: SearchFilterValue;
}) {
	const arrayValue = Array.isArray(props.value) ? props.value : [];
	const [inputValue, setInputValue] = useState('');
	const { groups, idToKey } = useMetadataKeySuggestions(props.scope);

	const handleSelect = (id: string | number | null) => {
		if (id === null) {
			return;
		}
		const key = idToKey.get(String(id));
		if (key === undefined || arrayValue.includes(key)) {
			return;
		}
		props.onValueChange([...arrayValue, key]);
		setInputValue('');
	};

	const handleInputKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
		if (event.key !== 'Enter') {
			return;
		}
		const activeDescendant = event.currentTarget.getAttribute('aria-activedescendant');
		if (activeDescendant) {
			return;
		}
		const trimmed = inputValue.trim();
		if (!trimmed || arrayValue.includes(trimmed)) {
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
							{key}
							<button
								aria-label={`Remove ${key}`}
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
				menuTrigger="focus"
				onChange={handleSelect}
				onInputChange={setInputValue}
			>
				<ComboBoxInput className="sm:rounded-l-none" onKeyDown={handleInputKeyDown} placeholder="Type to search..." />
				<MetadataKeyPopoverContent groups={groups} scope={props.scope} />
			</ComboBox>
		</div>
	);
}
