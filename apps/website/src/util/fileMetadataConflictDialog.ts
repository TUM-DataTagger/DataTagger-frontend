import type { components } from '@/util/openapiSchema';

const METADATA_FIELD_TYPES = [
	'TEXT',
	'INTEGER',
	'DECIMAL',
	'DATE',
	'TIME',
	'WYSIWYG',
	'SELECTION',
	'MULTI_SELECTION',
	'TAG',
] as const;

const METADATA_FIELD_TYPE_LOOKUP = new Set<string>(METADATA_FIELD_TYPES);

export type ConflictMetadataFieldType = NonNullable<components['schemas']['MetadataTemplateField']['field_type']>;
export type UpgradeMetadataPayloadConflict =
	components['schemas']['UploadsDatasetUpgradeMetadataPayload']['conflicts'][number];

export type ConflictMetadataFieldConfig = {
	readonly description?: string;
	readonly options?: string[];
};

export type ConflictMetadataValueField = Omit<
	components['schemas']['MetadataTemplateField'],
	'field' | 'field_type' | 'metadata_template'
> & {
	readonly field_type?: ConflictMetadataFieldType;
};

export function getConflictMetadataFieldTypeOrDefault(
	fieldType: unknown,
	defaultFieldType: ConflictMetadataFieldType = 'TEXT',
): ConflictMetadataFieldType {
	if (typeof fieldType === 'string' && METADATA_FIELD_TYPE_LOOKUP.has(fieldType)) {
		return fieldType as ConflictMetadataFieldType;
	}

	return defaultFieldType;
}

export function normalizeConflictMetadataFieldConfig(config: unknown): ConflictMetadataFieldConfig | undefined {
	if (!config || typeof config !== 'object' || Array.isArray(config)) {
		return undefined;
	}

	const configObject = config as Record<string, unknown>;
	const description = typeof configObject.description === 'string' ? configObject.description : undefined;
	const options =
		Array.isArray(configObject.options) && configObject.options.every((option) => typeof option === 'string')
			? (configObject.options as string[])
			: undefined;

	return { description, options };
}

export function formatConflictMetadataOptions(config: unknown) {
	const options = normalizeConflictMetadataFieldConfig(config)?.options;
	if (!options?.length) {
		return null;
	}

	return options.join(', ');
}

export function normalizeConflictMetadataValue(value: unknown): string | string[] | Record<string, unknown> | null {
	if (value === null || value === undefined) {
		return null;
	}

	if (typeof value === 'string') {
		return value;
	}

	if (Array.isArray(value)) {
		return value.filter((item): item is string => typeof item === 'string');
	}

	if (typeof value === 'object') {
		return value as Record<string, unknown>;
	}

	return null;
}

export function toConflictMetadataValueField(
	// oxlint-disable-next-line typescript/no-duplicate-type-constituents
	metadata: UpgradeMetadataPayloadConflict['old'] | UpgradeMetadataPayloadConflict['new'] | null | undefined,
): ConflictMetadataValueField {
	const fieldType = getConflictMetadataFieldTypeOrDefault(metadata?.field_type);

	return {
		config: normalizeConflictMetadataFieldConfig(metadata?.config) ?? {},
		custom_key: metadata?.custom_key ?? '',
		field_type: fieldType,
		mandatory: Boolean(metadata?.metadata_template_field?.mandatory),
		order: metadata?.order ?? undefined,
		pk:
			metadata?.previous_version_field ??
			metadata?.metadata_template_field?.pk ??
			metadata?.field?.key ??
			metadata?.custom_key ??
			`conflict-${fieldType}`,
		value: normalizeConflictMetadataValue(metadata?.value),
	};
}
