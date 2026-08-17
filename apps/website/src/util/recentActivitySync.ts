import { openAPIClient } from '@/util/clientFetch';
import { logger, LogCategory } from '@/util/logger';
import {
	RECENT_ACTIVITY_SETTINGS_KEY,
	enqueueRecentActivitySyncSnapshot,
	getActiveRecentActivityUserKey,
	getDuePendingSyncItems,
	getNextPendingSyncRetryAt,
	getRecentActivityState,
	mergeRecentActivityNewestWins,
	parseRecentActivityEntities,
	parseRecentActivitySyncPayload,
	removePendingSyncItem,
	replaceRecentActivityFromSync,
	reschedulePendingSyncItem,
	subscribeRecentActivityState,
	type RecentActivityByEntityType,
} from '@/util/recentActivity';

const SYNC_INTERVAL_MS = 3 * 60_000;
const SYNC_DEBOUNCE_MS = 2_000;
const SYNC_MAX_RETRY_DELAY_MS = 5 * 60_000;

export type RecentActivitySyncAdapter = {
	pull(args: { readonly userStorageKey: string }): Promise<RecentActivityByEntityType | null>;
	push(args: {
		readonly recentByEntityType: RecentActivityByEntityType;
		readonly userStorageKey: string;
	}): Promise<void>;
};

function parseServerRecentActivity(value: unknown): RecentActivityByEntityType | null {
	if (value && typeof value === 'object') {
		const candidate = value as Record<string, unknown>;

		if ('entities' in candidate) {
			return parseRecentActivitySyncPayload(value)?.entities ?? null;
		}

		if ('project' in candidate || 'folder' in candidate) {
			return parseRecentActivityEntities(value);
		}
	}

	const parsedPayload = parseRecentActivitySyncPayload(value);
	if (parsedPayload) {
		return parsedPayload.entities;
	}

	if (typeof value === 'string') {
		try {
			const parsed = JSON.parse(value) as unknown;
			return parseServerRecentActivity(parsed);
		} catch {
			return null;
		}
	}

	return null;
}

export class NoopSettingsSyncAdapter implements RecentActivitySyncAdapter {
	public async pull(): Promise<RecentActivityByEntityType | null> {
		try {
			const { data } = await openAPIClient.GET('/api/v1/settings/', {
				params: {
					query: {
						key: RECENT_ACTIVITY_SETTINGS_KEY,
					},
				},
			});

			const setting = data?.find((entry) => entry.key === RECENT_ACTIVITY_SETTINGS_KEY);
			return parseServerRecentActivity(setting?.value);
		} catch (error) {
			logger.warn(LogCategory.Project, 'Failed to pull recent activity settings', {
				error: error instanceof Error ? error.message : String(error),
			});
			return null;
		}
	}

	public async push(args: {
		readonly recentByEntityType: RecentActivityByEntityType;
		readonly userStorageKey: string;
	}) {
		const entriesCount = Object.values(args.recentByEntityType).reduce((count, entries) => count + entries.length, 0);

		logger.debug(LogCategory.Project, 'Skipping recent activity push until settings write endpoint exists', {
			entries: entriesCount,
			userStorageKey: args.userStorageKey,
		});
	}
}

let syncAdapter: RecentActivitySyncAdapter = new NoopSettingsSyncAdapter();
let hasStartedSync = false;
let isFlushing = false;
let isPulling = false;
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function calculateRetryDelay(attemptCount: number) {
	const exponentialDelay = Math.min(2 ** Math.max(attemptCount, 0) * 1_000, SYNC_MAX_RETRY_DELAY_MS);
	const jitter = Math.round(Math.random() * 500);
	return exponentialDelay + jitter;
}

function scheduleFlush(delayMs = SYNC_DEBOUNCE_MS) {
	if (typeof window === 'undefined') {
		return;
	}

	if (flushTimer) {
		clearTimeout(flushTimer);
	}

	flushTimer = setTimeout(() => {
		flushTimer = null;
		void flushRecentActivitySyncQueue();
	}, delayMs);
}

async function pushSinglePendingItem(syncItem: {
	readonly attemptCount: number;
	readonly id: string;
	readonly payload: RecentActivityByEntityType;
	readonly userStorageKey: string;
}) {
	try {
		await syncAdapter.push({ recentByEntityType: syncItem.payload, userStorageKey: syncItem.userStorageKey });
		removePendingSyncItem(syncItem.id);
	} catch (error) {
		const nextAttemptCount = syncItem.attemptCount + 1;
		const delayMs = calculateRetryDelay(nextAttemptCount);
		const nextRetryAt = new Date(Date.now() + delayMs).toISOString();

		reschedulePendingSyncItem(syncItem.id, nextAttemptCount, nextRetryAt);
		logger.warn(LogCategory.Project, 'Failed to push recent activity snapshot', {
			attempt: nextAttemptCount,
			error: error instanceof Error ? error.message : String(error),
			nextRetryAt,
		});
	}
}

export async function flushRecentActivitySyncQueue() {
	if (isFlushing) {
		return;
	}

	const userStorageKey = getActiveRecentActivityUserKey();
	if (!userStorageKey || userStorageKey === 'anonymous') {
		return;
	}

	const pendingSyncItems = getDuePendingSyncItems(new Date().toISOString(), 3);
	if (!pendingSyncItems.length) {
		return;
	}

	isFlushing = true;
	try {
		for (const pendingSyncItem of pendingSyncItems) {
			await pushSinglePendingItem({
				id: pendingSyncItem.id,
				attemptCount: pendingSyncItem.attemptCount,
				payload: pendingSyncItem.payload,
				userStorageKey,
			});
		}
	} finally {
		isFlushing = false;
	}

	const nextRetryAt = getNextPendingSyncRetryAt();
	if (!nextRetryAt) {
		return;
	}

	const delayMs = Math.max(new Date(nextRetryAt).getTime() - Date.now(), 0);
	scheduleFlush(Math.min(delayMs, SYNC_INTERVAL_MS));
}

export async function pullRecentActivityFromServer() {
	if (isPulling) {
		return;
	}

	const userStorageKey = getActiveRecentActivityUserKey();
	if (!userStorageKey || userStorageKey === 'anonymous') {
		return;
	}

	isPulling = true;
	try {
		const remoteRecentByEntityType = await syncAdapter.pull({ userStorageKey });
		if (!remoteRecentByEntityType) {
			return;
		}

		const localRecentByEntityType = getRecentActivityState().recentByEntityType;
		const mergedRecentByEntityType = mergeRecentActivityNewestWins(localRecentByEntityType, remoteRecentByEntityType);

		if (JSON.stringify(mergedRecentByEntityType) === JSON.stringify(localRecentByEntityType)) {
			return;
		}

		replaceRecentActivityFromSync(mergedRecentByEntityType);
		enqueueRecentActivitySyncSnapshot();
		scheduleFlush();
	} finally {
		isPulling = false;
	}
}

export function initializeRecentActivitySync(adapter: RecentActivitySyncAdapter = new NoopSettingsSyncAdapter()) {
	if (hasStartedSync) {
		return;
	}

	hasStartedSync = true;
	syncAdapter = adapter;

	if (typeof window === 'undefined') {
		return;
	}

	window.addEventListener('online', () => {
		scheduleFlush(0);
		void pullRecentActivityFromServer();
	});

	document.addEventListener('visibilitychange', () => {
		if (document.visibilityState === 'visible') {
			scheduleFlush(0);
			void pullRecentActivityFromServer();
		}
	});

	setInterval(() => {
		scheduleFlush(0);
		void pullRecentActivityFromServer();
	}, SYNC_INTERVAL_MS);

	subscribeRecentActivityState(() => {
		if (!getRecentActivityState().pendingSync.length) {
			return;
		}

		scheduleFlush(SYNC_DEBOUNCE_MS);
	});

	scheduleFlush(0);
}
