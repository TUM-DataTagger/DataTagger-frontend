'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { logger, LogCategory } from '@/util/logger';

type StorageLike = Pick<Storage, 'getItem' | 'removeItem' | 'setItem'>;

type ParsedStoredBoolean =
	| {
			readonly status: 'invalid';
	  }
	| {
			readonly status: 'missing';
	  }
	| {
			readonly status: 'valid';
			readonly value: boolean;
	  };

type UseLocalStorageBooleanOptions = {
	readonly canonicalKey: string;
	readonly legacyKeys?: readonly string[];
};

function normalizeLegacyKeys(canonicalKey: string, legacyKeys: readonly string[]): readonly string[] {
	const unique = new Set<string>();

	for (const key of legacyKeys) {
		if (key === canonicalKey) {
			continue;
		}
		unique.add(key);
	}

	return [...unique];
}

function cleanupLegacyKeys(storage: StorageLike, legacyKeys: readonly string[]) {
	for (const legacyKey of legacyKeys) {
		storage.removeItem(legacyKey);
	}
}

export function parseStoredBooleanValue(rawValue: string | null): ParsedStoredBoolean {
	if (rawValue === null) {
		return { status: 'missing' };
	}

	const normalizedRawValue = rawValue.trim().toLowerCase();
	if (normalizedRawValue === 'true') {
		return { status: 'valid', value: true };
	}

	if (normalizedRawValue === 'false') {
		return { status: 'valid', value: false };
	}

	try {
		const parsed = JSON.parse(rawValue) as unknown;
		if (typeof parsed === 'boolean') {
			return { status: 'valid', value: parsed };
		}

		if (typeof parsed === 'string') {
			const normalizedParsedValue = parsed.trim().toLowerCase();
			if (normalizedParsedValue === 'true') {
				return { status: 'valid', value: true };
			}

			if (normalizedParsedValue === 'false') {
				return { status: 'valid', value: false };
			}
		}
	} catch {
		// Invalid JSON payload, handled below.
	}

	return { status: 'invalid' };
}

export function readAndMigrateLocalStorageBoolean(
	storage: StorageLike,
	options: UseLocalStorageBooleanOptions,
): boolean | undefined {
	const legacyKeys = normalizeLegacyKeys(options.canonicalKey, options.legacyKeys ?? []);
	const parsedCanonicalValue = parseStoredBooleanValue(storage.getItem(options.canonicalKey));

	if (parsedCanonicalValue.status === 'valid') {
		cleanupLegacyKeys(storage, legacyKeys);
		return parsedCanonicalValue.value;
	}

	if (parsedCanonicalValue.status === 'invalid') {
		storage.removeItem(options.canonicalKey);
	}

	for (const legacyKey of legacyKeys) {
		const parsedLegacyValue = parseStoredBooleanValue(storage.getItem(legacyKey));

		if (parsedLegacyValue.status === 'valid') {
			storage.setItem(options.canonicalKey, JSON.stringify(parsedLegacyValue.value));
			cleanupLegacyKeys(storage, legacyKeys);
			return parsedLegacyValue.value;
		}

		if (parsedLegacyValue.status === 'invalid') {
			storage.removeItem(legacyKey);
		}
	}

	return undefined;
}

export function persistLocalStorageBoolean(
	storage: StorageLike,
	options: UseLocalStorageBooleanOptions & { readonly value: boolean },
): void {
	storage.setItem(options.canonicalKey, JSON.stringify(options.value));
	cleanupLegacyKeys(storage, normalizeLegacyKeys(options.canonicalKey, options.legacyKeys ?? []));
}

export function useLocalStorageBoolean(options: UseLocalStorageBooleanOptions) {
	const [storedValue, setStoredValue] = useState<boolean | undefined>(undefined);
	const legacyKeys = useMemo(
		() => normalizeLegacyKeys(options.canonicalKey, options.legacyKeys ?? []),
		[options.canonicalKey, options.legacyKeys],
	);

	useEffect(() => {
		if (typeof window === 'undefined') {
			return;
		}

		try {
			setStoredValue(
				readAndMigrateLocalStorageBoolean(window.localStorage, {
					canonicalKey: options.canonicalKey,
					legacyKeys,
				}),
			);
		} catch (error) {
			logger.warn(LogCategory.Flags, 'Failed to read or migrate localStorage boolean key', {
				canonicalKey: options.canonicalKey,
				error: error instanceof Error ? error.message : String(error),
			});
		}
	}, [legacyKeys, options.canonicalKey]);

	const setValue = useCallback(
		(nextValue: boolean) => {
			setStoredValue(nextValue);

			if (typeof window === 'undefined') {
				return;
			}

			try {
				persistLocalStorageBoolean(window.localStorage, {
					canonicalKey: options.canonicalKey,
					legacyKeys,
					value: nextValue,
				});
			} catch (error) {
				logger.warn(LogCategory.Flags, 'Failed to persist localStorage boolean key', {
					canonicalKey: options.canonicalKey,
					error: error instanceof Error ? error.message : String(error),
				});
			}
		},
		[legacyKeys, options.canonicalKey],
	);

	return {
		value: storedValue,
		setValue,
	};
}

export type { StorageLike, UseLocalStorageBooleanOptions };
