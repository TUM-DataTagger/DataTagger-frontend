'use client';

import { useCurrentUser } from '@/hooks/useCurrentUser';
import { type UserSettings, migrateUserSettings } from '@/schemas/UserSettingsSchema';

export function useUserSettings(): {
	readonly settings: UserSettings;
} {
	const { currentUserData } = useCurrentUser();

	return {
		settings: migrateUserSettings(currentUserData?.settings),
	};
}
