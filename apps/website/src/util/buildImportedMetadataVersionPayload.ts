import type { components } from '@/util/openapiSchema';
import type { MetadataImportPayload } from '@/util/parseMetadataImportPayload';

type ExistingMetadataEntry = Pick<
	components['schemas']['MinimalMetadata'],
	'config' | 'custom_key' | 'field_type' | 'metadata_template_field' | 'value'
>;

type VersionMetadataPayload = NonNullable<
	components['schemas']['UploadsDatasetVersionActionPayloadRequest']['metadata']
>;
type VersionMetadataPayloadEntry = VersionMetadataPayload[number];

function normalizeConfig(config: unknown): Record<string, unknown> | null {
	if (!config || typeof config !== 'object' || Array.isArray(config)) {
		return null;
	}

	return config as Record<string, unknown>;
}

function toProtectedTemplatePayloadEntry(field: ExistingMetadataEntry): VersionMetadataPayloadEntry {
	return {
		custom_key: field.custom_key ?? null,
		field_type: field.field_type ?? undefined,
		value: field.value ?? null,
		config: normalizeConfig(field.config),
		metadata_template_field: field.metadata_template_field ?? null,
	};
}

function toImportedPayloadEntry(field: MetadataImportPayload): VersionMetadataPayloadEntry {
	return {
		custom_key: field.custom_key,
		field_type: field.field_type,
		value: field.value ?? null,
		config: field.config,
	};
}

export function buildImportedMetadataVersionPayload(args: {
	readonly existingMetadata: readonly ExistingMetadataEntry[] | undefined;
	readonly importedMetadata: readonly MetadataImportPayload[];
}): VersionMetadataPayload {
	const templateMetadata = (args.existingMetadata ?? [])
		.filter((field) => Boolean(field.metadata_template_field))
		.map(toProtectedTemplatePayloadEntry);

	const importedMetadata = args.importedMetadata.map(toImportedPayloadEntry);

	return [...templateMetadata, ...importedMetadata].map((field, order) => ({
		...field,
		order,
	}));
}
