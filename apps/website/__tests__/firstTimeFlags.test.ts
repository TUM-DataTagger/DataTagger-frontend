import { describe, expect, it } from 'vitest';
import { FIRST_TIME_FLAG_KEYS } from '@/util/firstTimeFlags';

describe('firstTimeFlags', () => {
	it('defines canonical namespaced kebab-case keys', () => {
		expect(FIRST_TIME_FLAG_KEYS.project.canonicalKey).toBe('onboarding:is-first-time-project');
		expect(FIRST_TIME_FLAG_KEYS.folder.canonicalKey).toBe('onboarding:is-first-time-folder');
		expect(FIRST_TIME_FLAG_KEYS['metadata-template'].canonicalKey).toBe('onboarding:is-first-time-metadata-template');
	});

	it('keeps legacy camelCase fallback keys for migration', () => {
		expect(FIRST_TIME_FLAG_KEYS.project.legacyKeys).toEqual(['isFirstTimeProject']);
		expect(FIRST_TIME_FLAG_KEYS.folder.legacyKeys).toEqual(['isFirstTimeFolder']);
		expect(FIRST_TIME_FLAG_KEYS['metadata-template'].legacyKeys).toEqual(['isFirstTimeMetadataTemplate']);
	});
});
