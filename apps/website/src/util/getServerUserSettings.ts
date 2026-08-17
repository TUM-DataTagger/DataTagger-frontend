import { cache } from 'react';
import { migrateUserSettings } from '@/schemas/UserSettingsSchema';
import { openAPIClient } from '@/util/fetch';

export const getServerUserSettings = cache(async () => {
	const { data } = await openAPIClient.GET('/api/v1/user/me/');

	return migrateUserSettings(data?.settings);
});
