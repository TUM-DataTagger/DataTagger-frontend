import type { InferOutput } from 'valibot';
import { fallback, number, object, parse, picklist } from 'valibot';
import { logger, LogCategory } from '@/util/logger';
import {
	DRAFT_SORT_KEYS,
	FILE_SORT_KEYS,
	FOLDER_SORT_KEYS,
	PROJECT_SORT_KEYS,
	VIEW_MODE_KEYS,
	VIEW_MODE_OVERRIDE_KEYS,
} from '@/util/userSettingsOptions';

export const CURRENT_SETTINGS_VERSION = 2;

export const UserSettingsSchema = object({
	version: fallback(number(), CURRENT_SETTINGS_VERSION),
	theme: fallback(picklist(['light', 'dark', 'system']), 'system'),
	defaultViewMode: fallback(picklist(VIEW_MODE_KEYS), 'grid'),
	draftsSort: fallback(picklist(DRAFT_SORT_KEYS), '-creation_date'),
	projectsSort: fallback(picklist(PROJECT_SORT_KEYS), 'name'),
	foldersSort: fallback(picklist(FOLDER_SORT_KEYS), 'name'),
	filesSort: fallback(picklist(FILE_SORT_KEYS), 'display_name'),
	draftsViewMode: fallback(picklist(VIEW_MODE_OVERRIDE_KEYS), 'default'),
	projectsViewMode: fallback(picklist(VIEW_MODE_OVERRIDE_KEYS), 'default'),
	foldersViewMode: fallback(picklist(VIEW_MODE_OVERRIDE_KEYS), 'default'),
	filesViewMode: fallback(picklist(VIEW_MODE_OVERRIDE_KEYS), 'default'),
});

export type UserSettings = InferOutput<typeof UserSettingsSchema>;

export const DEFAULT_USER_SETTINGS: UserSettings = parse(UserSettingsSchema, {});

/**
 * Migration registry: maps a source version to a function that transforms
 * the raw settings object to the next version's shape.
 *
 * Example for a future v3:
 * ```
 * const migrations: Record<number, (raw: Record<string, unknown>) => Record<string, unknown>> = {
 *   2: (s) => ({ ...s, version: 3, language: 'en' }),
 * };
 * ```
 */
const migrations: Record<number, (raw: Record<string, unknown>) => Record<string, unknown>> = {
	1: (settings) => ({ ...settings, version: 2 }),
};

/**
 * Safely parses and migrates raw user settings from the backend.
 *
 * - Never throws — returns `DEFAULT_USER_SETTINGS` for null/undefined/non-object input
 * - Applies sequential migrations if the stored version is older than `CURRENT_SETTINGS_VERSION`
 * - Uses Valibot `fallback()` per field so valid fields survive even if others are malformed
 */
export function migrateUserSettings(raw: unknown): UserSettings {
	if (raw === null || raw === undefined || typeof raw !== 'object') {
		return DEFAULT_USER_SETTINGS;
	}

	let settings = raw as Record<string, unknown>;

	// Run migrations sequentially from stored version to current
	const storedVersion = typeof settings.version === 'number' ? settings.version : 0;

	for (let version = storedVersion; version < CURRENT_SETTINGS_VERSION; version++) {
		const migrate = migrations[version];

		if (migrate) {
			logger.debug(LogCategory.Settings, `Migrating user settings from v${String(version)} to v${String(version + 1)}`);
			settings = migrate(settings);
		}
	}

	return parse(UserSettingsSchema, settings);
}
