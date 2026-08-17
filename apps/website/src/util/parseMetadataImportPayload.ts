import type { InferInput } from 'valibot';
import type { FileSchema } from '@/schemas/FileSchema';
import {
	getMetadataChoiceValueValidationMessage,
	getMetadataOptionValidationIssues,
	isMetadataSelectionOptionFieldType,
} from '@/util/metadataOptionValidation';

type ProjectFolderFileEditInput = InferInput<typeof FileSchema>;
type MetadataInputField = ProjectFolderFileEditInput['metadata'][number];

export type MetadataImportPayload = {
	readonly config: Record<string, unknown>;
	readonly custom_key: string;
	readonly field_type: MetadataInputField['field_type'];
	readonly value: MetadataInputField['value'];
};

function validateMetadataImportSelectionOptions(args: {
	readonly config: unknown;
	readonly fieldType: MetadataInputField['field_type'];
	readonly index: number;
}) {
	if (!isMetadataSelectionOptionFieldType(args.fieldType)) {
		return;
	}

	if (!args.config || typeof args.config !== 'object' || Array.isArray(args.config)) {
		return;
	}

	const options = (args.config as { options?: unknown }).options;
	if (options === undefined) {
		return;
	}

	if (!Array.isArray(options) || !options.every((option) => typeof option === 'string')) {
		throw new Error(`Metadata entry #${args.index + 1} has invalid "config.options". Expected an array of strings.`);
	}

	const optionIssues = getMetadataOptionValidationIssues(options);
	const firstOptionIssue = optionIssues[0];
	if (!firstOptionIssue) {
		return;
	}

	throw new Error(
		`Metadata entry #${args.index + 1} has an invalid option #${firstOptionIssue.index + 1}: ${firstOptionIssue.message}.`,
	);
}

function validateMetadataImportChoiceValue(args: {
	readonly config: unknown;
	readonly fieldType: MetadataInputField['field_type'];
	readonly index: number;
	readonly value: unknown;
}) {
	const message = getMetadataChoiceValueValidationMessage(args);
	if (message) {
		throw new Error(`Metadata entry #${args.index + 1} has an invalid "value": ${message}.`);
	}
}

function sanitizeMetadataImportEntry(entry: unknown, index: number): MetadataImportPayload {
	if (typeof entry !== 'object' || entry === null) {
		throw new Error(`Metadata entry #${index + 1} must be an object.`);
	}

	const record = entry as Partial<ProjectFolderFileEditInput['metadata'][number]>;
	const fallbackField = record.field;

	const customKey =
		typeof record.custom_key === 'string' && record.custom_key.length > 0
			? record.custom_key
			: typeof fallbackField?.key === 'string'
				? fallbackField.key
				: '';

	if (!customKey) {
		throw new Error(`Metadata entry #${index + 1} is missing "custom_key".`);
	}

	const fieldType =
		record.field_type ?? (typeof fallbackField?.field_type === 'string' ? fallbackField.field_type : 'TEXT');

	const config = typeof record.config === 'object' && record.config !== null ? record.config : undefined;
	validateMetadataImportSelectionOptions({
		config,
		fieldType,
		index,
	});
	validateMetadataImportChoiceValue({
		config,
		fieldType,
		index,
		value: record.value,
	});

	return {
		custom_key: customKey,
		field_type: fieldType,
		value: record.value ?? '',
		config: config ?? {},
	};
}

export function parseMetadataImportPayload(rawJson: string): MetadataImportPayload[] {
	let parsed: unknown;

	try {
		parsed = JSON.parse(rawJson);
	} catch (error) {
		throw new Error(
			`Unable to parse JSON: ${error instanceof Error ? error.message : 'Unknown parsing error occurred'}`,
		);
	}

	const metadataSource = Array.isArray(parsed)
		? parsed
		: typeof parsed === 'object' && parsed !== null && Array.isArray((parsed as { metadata?: unknown }).metadata)
			? (parsed as { metadata: unknown[] }).metadata
			: null;

	if (!metadataSource) {
		throw new Error('Provide a JSON array or an object containing a top-level "metadata" array.');
	}

	return metadataSource.map((entry, index) => sanitizeMetadataImportEntry(entry, index));
}
