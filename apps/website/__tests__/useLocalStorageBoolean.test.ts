import { describe, expect, it } from 'vitest';
import {
	parseStoredBooleanValue,
	persistLocalStorageBoolean,
	readAndMigrateLocalStorageBoolean,
	type StorageLike,
} from '@/hooks/useLocalStorageBoolean';

class MemoryStorage implements StorageLike {
	private readonly values = new Map<string, string>();

	public constructor(initialEntries?: readonly (readonly [string, string])[]) {
		for (const [key, value] of initialEntries ?? []) {
			this.values.set(key, value);
		}
	}

	public getItem(key: string): string | null {
		return this.values.get(key) ?? null;
	}

	public removeItem(key: string): void {
		this.values.delete(key);
	}

	public setItem(key: string, value: string): void {
		this.values.set(key, value);
	}
}

describe('useLocalStorageBoolean helpers', () => {
	it('migrates legacy key to canonical key and deletes legacy key', () => {
		const storage = new MemoryStorage([['isFirstTimeProject', 'false']]);

		const value = readAndMigrateLocalStorageBoolean(storage, {
			canonicalKey: 'onboarding:is-first-time-project',
			legacyKeys: ['isFirstTimeProject'],
		});

		expect(value).toBe(false);
		expect(storage.getItem('onboarding:is-first-time-project')).toBe('false');
		expect(storage.getItem('isFirstTimeProject')).toBeNull();
	});

	it('prefers canonical key when canonical and legacy keys both exist', () => {
		const storage = new MemoryStorage([
			['onboarding:is-first-time-project', 'false'],
			['isFirstTimeProject', 'true'],
		]);

		const value = readAndMigrateLocalStorageBoolean(storage, {
			canonicalKey: 'onboarding:is-first-time-project',
			legacyKeys: ['isFirstTimeProject'],
		});

		expect(value).toBe(false);
		expect(storage.getItem('onboarding:is-first-time-project')).toBe('false');
		expect(storage.getItem('isFirstTimeProject')).toBeNull();
	});

	it('removes invalid legacy payload and falls back to undefined', () => {
		const storage = new MemoryStorage([['isFirstTimeFolder', 'not-a-boolean']]);

		const value = readAndMigrateLocalStorageBoolean(storage, {
			canonicalKey: 'onboarding:is-first-time-folder',
			legacyKeys: ['isFirstTimeFolder'],
		});

		expect(value).toBeUndefined();
		expect(storage.getItem('onboarding:is-first-time-folder')).toBeNull();
		expect(storage.getItem('isFirstTimeFolder')).toBeNull();
	});

	it('persist writes canonical value and removes legacy keys', () => {
		const storage = new MemoryStorage([
			['isFirstTimeMetadataTemplate', 'true'],
			['isFirstTimeProject', 'false'],
		]);

		persistLocalStorageBoolean(storage, {
			canonicalKey: 'onboarding:is-first-time-metadata-template',
			legacyKeys: ['isFirstTimeMetadataTemplate', 'isFirstTimeProject'],
			value: false,
		});

		expect(storage.getItem('onboarding:is-first-time-metadata-template')).toBe('false');
		expect(storage.getItem('isFirstTimeMetadataTemplate')).toBeNull();
		expect(storage.getItem('isFirstTimeProject')).toBeNull();
	});

	it('parses tolerant boolean encodings', () => {
		expect(parseStoredBooleanValue('true')).toEqual({ status: 'valid', value: true });
		expect(parseStoredBooleanValue('FALSE')).toEqual({ status: 'valid', value: false });
		expect(parseStoredBooleanValue('"true"')).toEqual({ status: 'valid', value: true });
		expect(parseStoredBooleanValue('"false"')).toEqual({ status: 'valid', value: false });
		expect(parseStoredBooleanValue(null)).toEqual({ status: 'missing' });
		expect(parseStoredBooleanValue('{bad json')).toEqual({ status: 'invalid' });
	});
});
