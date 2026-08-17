function parseBooleanEnv(value: string | undefined, defaultValue: boolean) {
	if (value === undefined) {
		return defaultValue;
	}

	const normalized = value.trim().toLowerCase();

	if (normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on') {
		return true;
	}

	if (normalized === '0' || normalized === 'false' || normalized === 'no' || normalized === 'off') {
		return false;
	}

	return defaultValue;
}

const defaultDeveloperOverridesEnabled = process.env.NODE_ENV === 'development' || process.env.STAGING === 'true';

export const ENV = {
	IS_LOCAL_DEV: process.env.NODE_ENV === 'development',
	IS_STAGING: process.env.STAGING === 'true',
	BASE_API_URL: process.env.BASE_API_URL ?? '',
	BASE_WS_URL: process.env.BASE_WS_URL ?? '',
	NEXT_PUBLIC_BASE_API_URL: process.env.NEXT_PUBLIC_BASE_API_URL ?? '',
	FF_USER_SETTINGS_ENABLED: parseBooleanEnv(process.env.FF_USER_SETTINGS_ENABLED, false),
	FF_ALLOW_DEVELOPER_OVERRIDES: parseBooleanEnv(
		process.env.FF_ALLOW_DEVELOPER_OVERRIDES,
		defaultDeveloperOverridesEnabled,
	),
};
