const METADATA_SELECTION_OPTION_FIELD_TYPES = ['SELECTION', 'MULTI_SELECTION', 'TAG'] as const;

type MetadataSelectionOptionFieldType = (typeof METADATA_SELECTION_OPTION_FIELD_TYPES)[number];
type MetadataOptionIssueType = 'invalid' | 'duplicate';

export type MetadataOptionValidationIssue = {
	readonly index: number;
	readonly message: string;
	readonly type: MetadataOptionIssueType;
};

export const METADATA_OPTION_INVALID_VALUE_MESSAGE = 'Please enter a valid option value';
export const METADATA_OPTION_DUPLICATE_VALUE_MESSAGE = 'Option values must be unique';
export const METADATA_CHOICE_EMPTY_VALUE_MESSAGE = 'Choice values must not be empty after trimming';
export const METADATA_CHOICE_VALUE_COLLISION_MESSAGE = 'Selected choice values must remain unique after trimming';
export const METADATA_CHOICE_SELECTED_VALUE_MESSAGE =
	'Selected choice values must be included in the configured options';

export function isMetadataSelectionOptionFieldType(fieldType: unknown): fieldType is MetadataSelectionOptionFieldType {
	return (
		typeof fieldType === 'string' && (METADATA_SELECTION_OPTION_FIELD_TYPES as readonly string[]).includes(fieldType)
	);
}

export function normalizeMetadataOptionValue(option: string): string {
	return option.trim();
}

export function isValidMetadataOptionValue(option: string): boolean {
	return normalizeMetadataOptionValue(option).length > 0;
}

export function isUniqueMetadataOptionValue(option: string, index: number, options: readonly string[]): boolean {
	const normalizedOption = normalizeMetadataOptionValue(option);
	if (!normalizedOption) {
		return true;
	}
	if (index < 0 || index >= options.length || normalizeMetadataOptionValue(options[index] ?? '') !== normalizedOption) {
		return false;
	}

	let matchCount = 0;
	for (const optionValue of options) {
		if (normalizeMetadataOptionValue(optionValue) !== normalizedOption) {
			continue;
		}

		matchCount += 1;
		if (matchCount > 1) {
			return false;
		}
	}

	return matchCount === 1;
}

export function getMetadataOptionValidationIssues(options: readonly string[]): MetadataOptionValidationIssue[] {
	const issuesByIndex = new Map<number, MetadataOptionValidationIssue>();
	const duplicateIndexLookup = new Map<string, number[]>();

	for (const [index, option] of options.entries()) {
		const normalizedOption = normalizeMetadataOptionValue(option);

		if (!normalizedOption) {
			issuesByIndex.set(index, {
				index,
				message: METADATA_OPTION_INVALID_VALUE_MESSAGE,
				type: 'invalid',
			});
			continue;
		}

		const indicesForValue = duplicateIndexLookup.get(normalizedOption) ?? [];
		indicesForValue.push(index);
		duplicateIndexLookup.set(normalizedOption, indicesForValue);
	}

	for (const duplicateIndices of duplicateIndexLookup.values()) {
		if (duplicateIndices.length < 2) {
			continue;
		}

		for (const index of duplicateIndices) {
			issuesByIndex.set(index, {
				index,
				message: METADATA_OPTION_DUPLICATE_VALUE_MESSAGE,
				type: 'duplicate',
			});
		}
	}

	return Array.from(issuesByIndex.values()).sort((firstIssue, secondIssue) => firstIssue.index - secondIssue.index);
}

export function getMetadataOptionValidationMessagesByIndex(options: readonly string[]): Map<number, string> {
	return new Map(getMetadataOptionValidationIssues(options).map((issue) => [issue.index, issue.message]));
}

export function getMetadataChoiceValueValidationMessage(args: {
	readonly config: unknown;
	readonly fieldType: unknown;
	readonly value: unknown;
}): string | undefined {
	if (!isMetadataSelectionOptionFieldType(args.fieldType) || args.value === null || args.value === undefined) {
		return undefined;
	}

	const values = args.fieldType === 'SELECTION' ? [args.value] : Array.isArray(args.value) ? args.value : [args.value];
	if (!values.every((value): value is string => typeof value === 'string')) {
		return undefined;
	}

	const originalsByCanonicalValue = new Map<string, string>();
	for (const value of values) {
		const canonicalValue = normalizeMetadataOptionValue(value);
		if (!canonicalValue) {
			return METADATA_CHOICE_EMPTY_VALUE_MESSAGE;
		}
		const previous = originalsByCanonicalValue.get(canonicalValue);
		if (previous !== undefined && previous !== value) {
			return METADATA_CHOICE_VALUE_COLLISION_MESSAGE;
		}
		originalsByCanonicalValue.set(canonicalValue, value);
	}

	if (!args.config || typeof args.config !== 'object' || Array.isArray(args.config)) {
		return undefined;
	}
	const options = (args.config as { readonly options?: unknown }).options;
	if (!Array.isArray(options) || !options.every((option): option is string => typeof option === 'string')) {
		return undefined;
	}
	const canonicalOptions = new Set(options.map(normalizeMetadataOptionValue));
	return [...originalsByCanonicalValue.keys()].every((value) => canonicalOptions.has(value))
		? undefined
		: METADATA_CHOICE_SELECTED_VALUE_MESSAGE;
}

export function getMetadataChoiceWriteValidationMessage(args: {
	readonly config: unknown;
	readonly fieldType: unknown;
	readonly value: unknown;
}): string | undefined {
	if (!isMetadataSelectionOptionFieldType(args.fieldType)) {
		return undefined;
	}
	const options =
		args.config && typeof args.config === 'object' && !Array.isArray(args.config)
			? (args.config as { readonly options?: unknown }).options
			: undefined;
	if (Array.isArray(options) && options.every((option): option is string => typeof option === 'string')) {
		const optionIssue = getMetadataOptionValidationIssues(options)[0];
		if (optionIssue) {
			return optionIssue.message;
		}
	}
	return getMetadataChoiceValueValidationMessage(args);
}
