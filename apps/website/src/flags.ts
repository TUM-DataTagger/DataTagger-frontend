import { dedupe, flag } from 'flags/next';
import { ENV } from '@/util/env';
import { DEVELOPER_FLAG, USER_SETTINGS_ENABLED_FLAG } from '@/util/featureFlagKeys';
import { openAPIClient } from '@/util/fetch';

const developerFlagDefinition = {
	key: DEVELOPER_FLAG,
	description: 'Enable developer toolbar',
	defaultValue: false,
	origin: '',
	identify: dedupe(async () => {
		try {
			const { data: currentUserData } = await openAPIClient.GET('/api/v1/user/me/');

			return { user: { email: currentUserData?.email } };
		} catch {
			return {};
		}
	}),
	decide({ entities }) {
		return entities?.user?.email ? /^[a-z]+@example\.com$/.test(entities.user.email) : false;
	},
} satisfies Parameters<
	typeof flag<
		boolean,
		{
			user?: { email?: string | undefined } | undefined;
		}
	>
>[0];

export const developerFlag = flag<
	boolean,
	{
		user?: { email?: string | undefined } | undefined;
	}
>(developerFlagDefinition);

function parseOverrideCookieValue(value: string | undefined): boolean | undefined {
	if (value === '1') {
		return true;
	}

	if (value === '0') {
		return false;
	}

	return undefined;
}

async function decideReleasedFlag({
	cookieValue,
	envEnabled,
}: {
	readonly cookieValue: string | undefined;
	readonly envEnabled: boolean;
}) {
	if (!ENV.FF_ALLOW_DEVELOPER_OVERRIDES || cookieValue === undefined) {
		return envEnabled;
	}

	if (!(await developerFlag())) {
		return envEnabled;
	}

	return parseOverrideCookieValue(cookieValue) ?? envEnabled;
}

export const userSettingsEnabledFlag = flag<boolean>({
	key: USER_SETTINGS_ENABLED_FLAG,
	description: 'Enable the account settings page at /account/settings',
	defaultValue: false,
	origin: '',
	async decide({ cookies }) {
		return decideReleasedFlag({
			cookieValue: cookies.get(USER_SETTINGS_ENABLED_FLAG)?.value,
			envEnabled: ENV.FF_USER_SETTINGS_ENABLED,
		});
	},
});

export const developerToolbarFlags = {
	userSettingsEnabledFlag,
} as const;
