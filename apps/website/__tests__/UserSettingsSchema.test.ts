import { describe, expect, it } from 'vitest';
import { CURRENT_SETTINGS_VERSION, DEFAULT_USER_SETTINGS, migrateUserSettings } from '@/schemas/UserSettingsSchema';
import { resolveViewMode } from '@/util/userSettingsOptions';

describe('user settings', () => {
	it('provides defaults for every resource preference', () => {
		expect(DEFAULT_USER_SETTINGS).toEqual({
			defaultViewMode: 'grid',
			draftsSort: '-creation_date',
			draftsViewMode: 'default',
			filesSort: 'display_name',
			filesViewMode: 'default',
			foldersSort: 'name',
			foldersViewMode: 'default',
			projectsSort: 'name',
			projectsViewMode: 'default',
			theme: 'system',
			version: CURRENT_SETTINGS_VERSION,
		});
	});

	it('migrates version one settings without losing existing preferences', () => {
		expect(
			migrateUserSettings({
				defaultViewMode: 'table',
				theme: 'dark',
				version: 1,
			}),
		).toMatchObject({
			defaultViewMode: 'table',
			draftsSort: '-creation_date',
			draftsViewMode: 'default',
			theme: 'dark',
			version: 2,
		});
	});

	it('falls back per malformed resource field', () => {
		expect(
			migrateUserSettings({
				draftsSort: 'invalid',
				filesSort: '-creation_date',
				projectsViewMode: 'table',
				version: 2,
			}),
		).toMatchObject({
			draftsSort: '-creation_date',
			filesSort: '-creation_date',
			projectsViewMode: 'table',
		});
	});

	it('uses the general layout only when a resource does not override it', () => {
		expect(resolveViewMode('table', 'default')).toBe('table');
		expect(resolveViewMode('table', 'grid')).toBe('grid');
	});
});
