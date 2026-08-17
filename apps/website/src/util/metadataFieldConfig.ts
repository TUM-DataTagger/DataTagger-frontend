type MetadataFieldConfigRecord = Record<string, unknown>;

const DESCRIPTION_KEY = 'description';
const OPTIONS_KEY = 'options';

export function toMetadataFieldConfigRecord(config: unknown): MetadataFieldConfigRecord {
	if (config && typeof config === 'object' && !Array.isArray(config)) {
		return { ...(config as MetadataFieldConfigRecord) };
	}

	return {};
}

export function getMetadataFieldConfigString(config: unknown, key: string): string | undefined {
	const value = toMetadataFieldConfigRecord(config)[key];
	return typeof value === 'string' ? value : undefined;
}

export function setMetadataFieldConfigValue(config: unknown, key: string, value: unknown): MetadataFieldConfigRecord {
	return {
		...toMetadataFieldConfigRecord(config),
		[key]: value,
	};
}

export function removeMetadataFieldConfigValue(config: unknown, key: string): MetadataFieldConfigRecord {
	return Object.fromEntries(
		Object.entries(toMetadataFieldConfigRecord(config)).filter(([entryKey]) => entryKey !== key),
	);
}

export function getMetadataFieldDescription(config: unknown): string {
	return getMetadataFieldConfigString(config, DESCRIPTION_KEY) ?? '';
}

export function getMetadataFieldTrimmedDescription(config: unknown): string | undefined {
	const description = getMetadataFieldDescription(config).trim();
	return description.length ? description : undefined;
}

export function setMetadataFieldDescription(config: unknown, description: string): MetadataFieldConfigRecord {
	return setMetadataFieldConfigValue(config, DESCRIPTION_KEY, description);
}

export function removeMetadataFieldDescription(config: unknown): MetadataFieldConfigRecord {
	return removeMetadataFieldConfigValue(config, DESCRIPTION_KEY);
}

export function setMetadataFieldSelectionOptions(config: unknown, options?: string[]): MetadataFieldConfigRecord {
	if (options === undefined) {
		return removeMetadataFieldConfigValue(config, OPTIONS_KEY);
	}

	return setMetadataFieldConfigValue(config, OPTIONS_KEY, options);
}

export function removeMetadataFieldSelectionOptions(config: unknown): MetadataFieldConfigRecord {
	return removeMetadataFieldConfigValue(config, OPTIONS_KEY);
}
