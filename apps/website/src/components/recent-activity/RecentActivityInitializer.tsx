'use client';

import { useEffect, useMemo } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { setRecentActivityUser } from '@/util/recentActivity';
import { initializeRecentActivitySync, pullRecentActivityFromServer } from '@/util/recentActivitySync';

export function RecentActivityInitializer() {
	const { currentUserData } = useCurrentUser();
	const userStorageKey = useMemo(() => {
		if (!currentUserData?.pk) {
			return null;
		}

		return String(currentUserData.pk);
	}, [currentUserData?.pk]);

	useEffect(() => {
		initializeRecentActivitySync();
	}, []);

	useEffect(() => {
		if (!userStorageKey) {
			return;
		}

		setRecentActivityUser(userStorageKey);
		void pullRecentActivityFromServer();
	}, [userStorageKey]);

	return null;
}
