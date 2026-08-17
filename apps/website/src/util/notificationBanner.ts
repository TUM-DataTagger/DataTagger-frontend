export const NOTIFICATION_BANNER_MESSAGE_SETTING_KEY = 'NOTIFICATION_BANNER_MESSAGE';

export const notificationBannerQueryKey = ['settings', NOTIFICATION_BANNER_MESSAGE_SETTING_KEY] as const;

export type NotificationBannerSeverity = 'error' | 'info' | 'warning';

type SettingsClient = {
	GET(
		path: '/api/v1/settings/{key}/',
		options: {
			readonly params: {
				readonly path: {
					readonly key: string;
				};
			};
		},
	): Promise<{
		readonly data?: { readonly value?: string | null } | null;
		readonly response?: { readonly ok: boolean };
	}>;
};

export function getNotificationBannerMessage(value: string | null | undefined) {
	const message = value?.trim();

	if (!message) {
		return null;
	}

	return message;
}

export async function fetchNotificationBannerMessage(client: SettingsClient) {
	try {
		const { data, response } = await client.GET('/api/v1/settings/{key}/', {
			params: {
				path: {
					key: NOTIFICATION_BANNER_MESSAGE_SETTING_KEY,
				},
			},
		});

		if (response && !response.ok) {
			return null;
		}

		return getNotificationBannerMessage(data?.value);
	} catch {
		return null;
	}
}

export function notificationBannerQueryOptions(client: SettingsClient) {
	return {
		queryKey: notificationBannerQueryKey,
		queryFn: async () => fetchNotificationBannerMessage(client),
	};
}
