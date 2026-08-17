function trimMetadataPayloadValue(value: unknown): unknown {
	if (typeof value === 'string') {
		return value.trim();
	}

	if (Array.isArray(value)) {
		return value.map((entry) => trimMetadataPayloadValue(entry));
	}

	if (value && typeof value === 'object') {
		return Object.fromEntries(
			Object.entries(value).map(([key, entryValue]) => [key, trimMetadataPayloadValue(entryValue)]),
		);
	}

	return value;
}

export function trimMetadataPayload<Type>(value: Type): Type {
	return trimMetadataPayloadValue(value) as Type;
}
