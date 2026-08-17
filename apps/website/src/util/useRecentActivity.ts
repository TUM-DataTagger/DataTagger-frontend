'use client';

import { useSyncExternalStore } from 'react';
import {
	EMPTY_STATE,
	getRecentActivityState,
	subscribeRecentActivityState,
	type ActivityEntityType,
	type RecentProjectEntry,
} from '@/util/recentActivity';

export function useRecentActivity(entityType: ActivityEntityType) {
	return useSyncExternalStore(
		subscribeRecentActivityState,
		() => getRecentActivityState().recentByEntityType[entityType],
		() => EMPTY_STATE.recentByEntityType[entityType],
	);
}

export function useRecentProjects() {
	return useRecentActivity('project').filter((entry): entry is RecentProjectEntry => Boolean(entry.projectUuid));
}
