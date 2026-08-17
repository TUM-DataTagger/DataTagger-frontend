'use client';

import type { ReactNode } from 'react';
import {
	Metadata,
	MetadataTemplateFieldDefinitionInput,
	MetadataTemplateFieldValueInput,
	getMetadataFieldTypeOrDefault,
	type MetadataErrorMessage,
	type MetadataFieldConfig,
	type MetadataFieldType,
} from '@/components/Metadata';
import { removeMetadataFieldSelectionOptions, setMetadataFieldSelectionOptions } from '@/util/metadataFieldConfig';

type MetadataValueEditorConfigStrategy = 'preserve' | 'reset';

type MetadataValueEditorOutput = {
	readonly config: Record<string, unknown>;
	readonly fieldType: MetadataFieldType;
	readonly value: unknown;
};

export function mergeMetadataValueEditorChange<Type extends Record<string, unknown>>(
	current: Type,
	next: MetadataValueEditorOutput,
): Type & {
	readonly config: Record<string, unknown>;
	readonly field_type: MetadataFieldType;
	readonly value: unknown;
} {
	return {
		...current,
		field_type: next.fieldType,
		value: next.value,
		config: next.config,
	};
}

type MetadataValueEditorProps = {
	readonly className?: string | undefined;
	readonly configStrategy: MetadataValueEditorConfigStrategy;
	readonly disabledOptions?: MetadataFieldType[] | undefined;
	readonly errorMessage: MetadataErrorMessage;
	readonly fieldConfig?: MetadataFieldConfig | undefined;
	readonly fieldType?: MetadataFieldType;
	readonly isDisabled: boolean;
	readonly label: ReactNode | string;
	onBlur(...args: unknown[]): void;
	onChange(next: MetadataValueEditorOutput): void;
	readonly value: unknown;
};

function getSelectionConfigForReset(value: unknown): Record<string, unknown> {
	if (!value || typeof value !== 'object' || !('options' in value)) {
		return {};
	}

	const options = (value as { options?: unknown }).options;
	return Array.isArray(options) ? { options } : {};
}

function normalizeSelectionValue(value: unknown): string | null {
	if (value && typeof value === 'object' && 'selectedValue' in value) {
		const selectedValue = (value as { selectedValue?: unknown }).selectedValue;
		return typeof selectedValue === 'string' || selectedValue === null ? selectedValue : null;
	}

	return typeof value === 'string' || value === null ? value : null;
}

function normalizeMultiValue(value: unknown): unknown[] | null {
	if (value && typeof value === 'object' && 'selectedValues' in value) {
		const selectedValues = (value as { selectedValues?: unknown }).selectedValues;
		return Array.isArray(selectedValues) || selectedValues === null ? selectedValues : null;
	}

	return Array.isArray(value) || value === null ? value : null;
}

function normalizeConfig(
	configStrategy: MetadataValueEditorConfigStrategy,
	fieldType: MetadataFieldType,
	currentConfig: unknown,
	value: unknown,
): Record<string, unknown> {
	if (fieldType === 'SELECTION' || fieldType === 'MULTI_SELECTION' || fieldType === 'TAG') {
		if (configStrategy === 'preserve') {
			if (value && typeof value === 'object' && 'options' in value) {
				return setMetadataFieldSelectionOptions(currentConfig, (value as { options?: string[] }).options);
			}

			return setMetadataFieldSelectionOptions(currentConfig);
		}

		return getSelectionConfigForReset(value);
	}

	if (configStrategy === 'preserve') {
		return removeMetadataFieldSelectionOptions(currentConfig);
	}

	return {};
}

function normalizeValue(fieldType: MetadataFieldType, value: unknown): unknown {
	if (fieldType === 'SELECTION') {
		return normalizeSelectionValue(value);
	}

	if (fieldType === 'MULTI_SELECTION' || fieldType === 'TAG') {
		return normalizeMultiValue(value);
	}

	if (fieldType === 'WYSIWYG') {
		return value;
	}

	return typeof value === 'string' ? value : undefined;
}

function MetadataValueEditorBase(
	props: MetadataValueEditorProps & {
		readonly mode: 'runtime' | 'template-field-value' | 'template-field-definition';
	},
) {
	const MetadataComponent =
		props.mode === 'template-field-value'
			? MetadataTemplateFieldValueInput
			: props.mode === 'template-field-definition'
				? MetadataTemplateFieldDefinitionInput
				: Metadata;

	return (
		<MetadataComponent
			className={props.className}
			disabledOptions={props.disabledOptions}
			errorMessage={props.errorMessage}
			fieldConfig={props.fieldConfig}
			fieldType={getMetadataFieldTypeOrDefault(props.fieldType)}
			isDisabled={props.isDisabled}
			label={props.label}
			onBlur={props.onBlur}
			onChange={(next) => {
				props.onChange({
					fieldType: next.fieldType,
					value: normalizeValue(next.fieldType, next.value),
					config: normalizeConfig(props.configStrategy, next.fieldType, props.fieldConfig, next.value),
				});
			}}
			value={props.value}
		/>
	);
}

export function MetadataValueEditor(props: MetadataValueEditorProps) {
	return <MetadataValueEditorBase {...props} mode="runtime" />;
}

export function MetadataTemplateFieldValueEditor(props: MetadataValueEditorProps) {
	return <MetadataValueEditorBase {...props} mode="template-field-value" />;
}

export function MetadataTemplateFieldDefinitionValueEditor(props: MetadataValueEditorProps) {
	return <MetadataValueEditorBase {...props} mode="template-field-definition" />;
}
