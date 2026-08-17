'use server';

import { maxLength, object, pipe, regex, string } from 'valibot';
import { developerFlag } from '@/flags';
import { proc } from '@/server/proc';
import { ENV } from '@/util/env';
import { USER_SETTINGS_ENABLED_FLAG } from '@/util/featureFlagKeys';
import { logger, LogCategory } from '@/util/logger';

const OVERRIDABLE_FLAG_KEYS = [USER_SETTINGS_ENABLED_FLAG] as const;

type OverridableFlagKey = (typeof OVERRIDABLE_FLAG_KEYS)[number];

function isOverridableFlagKey(key: string): key is OverridableFlagKey {
	return OVERRIDABLE_FLAG_KEYS.includes(key as OverridableFlagKey);
}

const FlagSchema = object({
	key: pipe(
		string('Flag key must be a string'),
		regex(/^[A-Z_a-z]\w*$/, 'Flag key must be alphanumeric with underscores only'),
		maxLength(50, 'Flag key must be 50 characters or less'),
	),
	value: pipe(string('Flag value must be a string'), maxLength(100, 'Flag value must be 100 characters or less')),
});

export const setFlag = proc
	.input(FlagSchema)
	.handler(async ({ input, context }) => {
		if (!ENV.FF_ALLOW_DEVELOPER_OVERRIDES) {
			logger.warn(LogCategory.Flags, 'Feature flag override blocked because developer overrides are disabled', {
				key: input.key,
			});
			throw new Error('Developer feature flag overrides are disabled.');
		}

		const isDeveloper = await developerFlag();
		if (!isDeveloper) {
			logger.warn(LogCategory.Flags, 'Feature flag override rejected for non-developer user', { key: input.key });
			throw new Error('Not authorized to set feature flag overrides.');
		}

		if (!isOverridableFlagKey(input.key)) {
			logger.warn(LogCategory.Flags, 'Feature flag override rejected for unsupported flag key', { key: input.key });
			throw new Error(`Unsupported feature flag key: ${input.key}`);
		}

		if (input.value !== '0' && input.value !== '1') {
			logger.warn(LogCategory.Flags, 'Feature flag override rejected for unsupported flag value', {
				key: input.key,
				value: input.value,
			});
			throw new Error('Feature flag value must be either "0" or "1".');
		}

		context.cookies.set(input.key, input.value);
		logger.debug(LogCategory.Flags, 'Feature flag set', { key: input.key, value: input.value });
		return { key: input.key, value: input.value };
	})
	.actionable();
