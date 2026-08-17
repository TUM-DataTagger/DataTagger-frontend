import { logger, LogCategory } from '@/util/logger';

export const RECENT_ACTIVITY_STORAGE_VERSION = 1;
export const MAX_RECENT_ENTRIES_PER_ENTITY = 20;
export const MAX_PENDING_SYNC_ITEMS = 30;
export const RECENT_ACTIVITY_SETTINGS_KEY = 'recent_activity';

const STORAGE_KEY_PREFIX = 'recent-activity';
const ACTIVITY_ENTITY_TYPES = ['project', 'folder'] as const;

type ActivityEntityType = (typeof ACTIVITY_ENTITY_TYPES)[number];

type RecentActivityActionKind =
	| 'project_updated'
	| 'project_permissions_updated'
	| 'project_metadata_template_assignment_changed'
	| 'folder_created'
	| 'folder_updated'
	| 'folder_permissions_updated'
	| 'folder_metadata_template_assignment_changed'
	| 'file_uploaded'
	| 'file_metadata_changed'
	| 'file_metadata_upgraded'
	| 'files_bulk_action';

export type { ActivityEntityType, RecentActivityActionKind };

export type RecentActivityEntry = {
	readonly entityType: ActivityEntityType;
	readonly entityUuid: string;
	readonly fileUuid?: string;
	readonly folderUuid?: string;
	readonly lastActionAt: string;
	readonly lastActionKind: RecentActivityActionKind;
	readonly lastActionLabel?: string;
	readonly projectName?: string;
	readonly projectUuid?: string;
};

export type RecentProjectEntry = RecentActivityEntry & {
	readonly entityType: 'project';
	readonly projectUuid: string;
};

export type RecentActivityByEntityType = Readonly<Record<ActivityEntityType, readonly RecentActivityEntry[]>>;

export type PendingSyncItem = {
	readonly attemptCount: number;
	readonly createdAt: string;
	readonly id: string;
	readonly nextRetryAt: string;
	readonly payload: RecentActivityByEntityType;
};

export type RecentActivityState = {
	readonly pendingSync: readonly PendingSyncItem[];
	readonly recentByEntityType: RecentActivityByEntityType;
	readonly version: number;
};

export type RecentActivityEvent = {
	readonly enqueueSync?: boolean;
	readonly entityType: ActivityEntityType;
	readonly entityUuid?: string;
	readonly fileUuid?: string;
	readonly folderUuid?: string;
	readonly lastActionAt?: string;
	readonly lastActionKind: RecentActivityActionKind;
	readonly lastActionLabel?: string;
	readonly projectName?: string;
	readonly projectUuid?: string;
};

export type RecentProjectEvent = Omit<RecentActivityEvent, 'entityType' | 'entityUuid'>;

export type RecentActivitySyncPayload = {
	readonly entities: RecentActivityByEntityType;
};

const ACTION_LABELS: Record<RecentActivityActionKind, string> = {
	project_updated: 'Updated project',
	project_permissions_updated: 'Updated project permissions',
	project_metadata_template_assignment_changed: 'Changed project metadata template assignment',
	folder_created: 'Created folder',
	folder_updated: 'Updated folder',
	folder_permissions_updated: 'Updated folder permissions',
	folder_metadata_template_assignment_changed: 'Changed folder metadata template assignment',
	file_uploaded: 'Uploaded file',
	file_metadata_changed: 'Changed file metadata',
	file_metadata_upgraded: 'Upgraded file metadata',
	files_bulk_action: 'Ran bulk file action',
};

function createEmptyRecentByEntityType(): RecentActivityByEntityType {
	return {
		project: [],
		folder: [],
	};
}

export const EMPTY_STATE: RecentActivityState = {
	version: RECENT_ACTIVITY_STORAGE_VERSION,
	recentByEntityType: createEmptyRecentByEntityType(),
	pendingSync: [],
};

const listeners = new Set<() => void>();

let hasInitializedClientState = false;
let activeUserStorageKey: string | null = null;
let state: RecentActivityState = EMPTY_STATE;

function isDefined<ValueType>(value: ValueType | null): value is ValueType {
	return value !== null;
}

function isActivityEntityType(input: unknown): input is ActivityEntityType {
	return typeof input === 'string' && ACTIVITY_ENTITY_TYPES.includes(input as ActivityEntityType);
}

function isBrowser() {
	return typeof window !== 'undefined';
}

function buildStorageKey(userStorageKey: string) {
	return `${STORAGE_KEY_PREFIX}:${userStorageKey}`;
}

function normalizeUserStorageKey(userKey: string | number | null | undefined) {
	if (userKey === null || userKey === undefined) {
		return null;
	}

	const normalized = String(userKey).trim();
	return normalized.length ? normalized : null;
}

function makeSyncItemId() {
	if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
		return crypto.randomUUID();
	}

	return `${Date.now()}-${Math.round(Math.random() * 1_000_000)}`;
}

function stableSortRecentEntries(entries: readonly RecentActivityEntry[]) {
	return [...entries].sort((a, b) => b.lastActionAt.localeCompare(a.lastActionAt));
}

function normalizeEntityEntries(entries: readonly RecentActivityEntry[], entityType: ActivityEntityType) {
	const byEntity = new Map<string, RecentActivityEntry>();

	for (const entry of entries) {
		if (entry.entityType !== entityType) {
			continue;
		}

		const existing = byEntity.get(entry.entityUuid);
		if (!existing || entry.lastActionAt > existing.lastActionAt) {
			byEntity.set(entry.entityUuid, entry);
		}
	}

	return stableSortRecentEntries([...byEntity.values()]).slice(0, MAX_RECENT_ENTRIES_PER_ENTITY);
}

function parseRecentActivityEntry(input: unknown): RecentActivityEntry | null {
	if (!input || typeof input !== 'object') {
		return null;
	}

	const candidate = input as Record<string, unknown>;

	if (
		typeof candidate.entityUuid !== 'string' ||
		typeof candidate.lastActionAt !== 'string' ||
		typeof candidate.lastActionKind !== 'string' ||
		!isActivityEntityType(candidate.entityType)
	) {
		return null;
	}

	if (!Object.keys(ACTION_LABELS).includes(candidate.lastActionKind)) {
		return null;
	}

	return {
		entityType: candidate.entityType,
		entityUuid: candidate.entityUuid,
		projectUuid:
			typeof candidate.projectUuid === 'string'
				? candidate.projectUuid
				: candidate.entityType === 'project'
					? candidate.entityUuid
					: undefined,
		projectName: typeof candidate.projectName === 'string' ? candidate.projectName : undefined,
		lastActionKind: candidate.lastActionKind as RecentActivityActionKind,
		lastActionAt: candidate.lastActionAt,
		lastActionLabel: typeof candidate.lastActionLabel === 'string' ? candidate.lastActionLabel : undefined,
		folderUuid: typeof candidate.folderUuid === 'string' ? candidate.folderUuid : undefined,
		fileUuid: typeof candidate.fileUuid === 'string' ? candidate.fileUuid : undefined,
	};
}

export function parseRecentActivityEntities(input: unknown): RecentActivityByEntityType {
	if (!input || typeof input !== 'object') {
		return createEmptyRecentByEntityType();
	}

	const candidate = input as Record<string, unknown>;
	const result: Record<ActivityEntityType, readonly RecentActivityEntry[]> = {
		project: [],
		folder: [],
	};

	for (const entityType of ACTIVITY_ENTITY_TYPES) {
		const entries = Array.isArray(candidate[entityType])
			? candidate[entityType].map((entry) => parseRecentActivityEntry(entry)).filter(isDefined)
			: [];
		result[entityType] = normalizeEntityEntries(entries, entityType);
	}

	return result;
}

export function parseRecentActivitySyncPayload(input: unknown): RecentActivitySyncPayload | null {
	if (!input || typeof input !== 'object') {
		return null;
	}

	const candidate = input as Record<string, unknown>;
	if (!candidate.entities || typeof candidate.entities !== 'object') {
		return null;
	}

	return {
		entities: parseRecentActivityEntities(candidate.entities),
	};
}

function parsePendingSyncItem(input: unknown): PendingSyncItem | null {
	if (!input || typeof input !== 'object') {
		return null;
	}

	const candidate = input as Record<string, unknown>;

	if (
		typeof candidate.id !== 'string' ||
		typeof candidate.createdAt !== 'string' ||
		typeof candidate.nextRetryAt !== 'string' ||
		typeof candidate.attemptCount !== 'number'
	) {
		return null;
	}

	if (!candidate.payload || typeof candidate.payload !== 'object') {
		return null;
	}

	const payload =
		parseRecentActivitySyncPayload(candidate.payload)?.entities ?? parseRecentActivityEntities(candidate.payload);

	return {
		id: candidate.id,
		createdAt: candidate.createdAt,
		nextRetryAt: candidate.nextRetryAt,
		attemptCount: candidate.attemptCount,
		payload,
	};
}

export function parseRecentActivityState(input: unknown): RecentActivityState {
	if (!input || typeof input !== 'object') {
		return EMPTY_STATE;
	}

	const candidate = input as Record<string, unknown>;

	if (candidate.version !== RECENT_ACTIVITY_STORAGE_VERSION) {
		return EMPTY_STATE;
	}

	if (!Array.isArray(candidate.pendingSync)) {
		return EMPTY_STATE;
	}

	const recentByEntityType = parseRecentActivityEntities(candidate.recentByEntityType);
	const pendingSync = candidate.pendingSync.map((entry) => parsePendingSyncItem(entry)).filter(isDefined);

	return {
		version: RECENT_ACTIVITY_STORAGE_VERSION,
		recentByEntityType,
		pendingSync: pendingSync.slice(0, MAX_PENDING_SYNC_ITEMS),
	};
}

function loadStateForUser(userStorageKey: string): RecentActivityState {
	if (!isBrowser()) {
		return EMPTY_STATE;
	}

	try {
		const raw = window.localStorage.getItem(buildStorageKey(userStorageKey));
		if (!raw) {
			return EMPTY_STATE;
		}

		const parsed = JSON.parse(raw) as unknown;
		return parseRecentActivityState(parsed);
	} catch (error) {
		logger.warn(LogCategory.Project, 'Failed to load recent activity from local storage', {
			error: error instanceof Error ? error.message : String(error),
			userStorageKey,
		});
		return EMPTY_STATE;
	}
}

function saveStateForUser(userStorageKey: string, nextState: RecentActivityState) {
	if (!isBrowser()) {
		return;
	}

	try {
		window.localStorage.setItem(buildStorageKey(userStorageKey), JSON.stringify(nextState));
	} catch (error) {
		logger.warn(LogCategory.Project, 'Failed to persist recent activity to local storage', {
			error: error instanceof Error ? error.message : String(error),
			userStorageKey,
		});
	}
}

function removeStateForUser(userStorageKey: string) {
	if (!isBrowser()) {
		return;
	}

	try {
		window.localStorage.removeItem(buildStorageKey(userStorageKey));
	} catch (error) {
		logger.warn(LogCategory.Project, 'Failed to remove recent activity local storage key', {
			error: error instanceof Error ? error.message : String(error),
			userStorageKey,
		});
	}
}

function emitStateChange() {
	for (const listener of listeners) {
		listener();
	}
}

function ensureClientState() {
	if (!isBrowser() || hasInitializedClientState) {
		return;
	}

	hasInitializedClientState = true;
	activeUserStorageKey = 'anonymous';
	state = loadStateForUser(activeUserStorageKey);
}

function updateState(nextState: RecentActivityState) {
	state = nextState;

	if (activeUserStorageKey) {
		saveStateForUser(activeUserStorageKey, nextState);
	}

	emitStateChange();
}

function mergeEntityEntriesNewestWins(
	localEntries: readonly RecentActivityEntry[],
	remoteEntries: readonly RecentActivityEntry[],
	entityType: ActivityEntityType,
) {
	const byEntity = new Map<string, RecentActivityEntry>();

	for (const entry of [...localEntries, ...remoteEntries]) {
		if (entry.entityType !== entityType) {
			continue;
		}

		const existing = byEntity.get(entry.entityUuid);
		if (!existing || entry.lastActionAt > existing.lastActionAt) {
			byEntity.set(entry.entityUuid, entry);
		}
	}

	return stableSortRecentEntries([...byEntity.values()]).slice(0, MAX_RECENT_ENTRIES_PER_ENTITY);
}

export function mergeRecentActivityNewestWins(
	localEntries: RecentActivityByEntityType,
	remoteEntries: RecentActivityByEntityType,
): RecentActivityByEntityType {
	return {
		project: mergeEntityEntriesNewestWins(localEntries.project, remoteEntries.project, 'project'),
		folder: mergeEntityEntriesNewestWins(localEntries.folder, remoteEntries.folder, 'folder'),
	};
}

export function upsertRecentActivityEntry(
	entries: readonly RecentActivityEntry[],
	event: RecentActivityEvent,
): readonly RecentActivityEntry[] {
	if (!event.entityUuid) {
		return entries;
	}

	const existing = entries.find((entry) => entry.entityUuid === event.entityUuid);
	const nextEntry: RecentActivityEntry = {
		entityType: event.entityType,
		entityUuid: event.entityUuid,
		projectUuid:
			event.entityType === 'project'
				? (event.projectUuid ?? event.entityUuid)
				: (event.projectUuid ?? existing?.projectUuid),
		projectName: event.projectName ?? existing?.projectName,
		lastActionKind: event.lastActionKind,
		lastActionAt: event.lastActionAt ?? new Date().toISOString(),
		lastActionLabel: event.lastActionLabel ?? ACTION_LABELS[event.lastActionKind],
		folderUuid: event.folderUuid ?? existing?.folderUuid,
		fileUuid: event.fileUuid,
	};

	if (existing && existing.lastActionAt > nextEntry.lastActionAt) {
		return stableSortRecentEntries(entries).slice(0, MAX_RECENT_ENTRIES_PER_ENTITY);
	}

	const withoutCurrent = entries.filter((entry) => entry.entityUuid !== event.entityUuid);
	const merged = [nextEntry, ...withoutCurrent];
	return stableSortRecentEntries(merged).slice(0, MAX_RECENT_ENTRIES_PER_ENTITY);
}

function enqueueSyncPayload(
	pendingSync: readonly PendingSyncItem[],
	recentByEntityType: RecentActivityByEntityType,
): readonly PendingSyncItem[] {
	const lastQueued = pendingSync.at(-1);
	if (lastQueued && JSON.stringify(lastQueued.payload) === JSON.stringify(recentByEntityType)) {
		return pendingSync;
	}

	const now = new Date().toISOString();
	const nextItem: PendingSyncItem = {
		id: makeSyncItemId(),
		createdAt: now,
		nextRetryAt: now,
		attemptCount: 0,
		payload: recentByEntityType,
	};

	return [...pendingSync, nextItem].slice(-MAX_PENDING_SYNC_ITEMS);
}

export function subscribeRecentActivityState(listener: () => void) {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
}

export function getRecentActivityState() {
	ensureClientState();
	return state;
}

export function getRecentActivityActionLabel(actionKind: RecentActivityActionKind) {
	return ACTION_LABELS[actionKind];
}

export function getActiveRecentActivityUserKey() {
	ensureClientState();
	return activeUserStorageKey;
}

export function setRecentActivityUser(userKey: string | number | null | undefined) {
	ensureClientState();

	const normalizedUserStorageKey = normalizeUserStorageKey(userKey);
	if (!normalizedUserStorageKey) {
		return false;
	}

	if (activeUserStorageKey === normalizedUserStorageKey) {
		return false;
	}

	const previousStorageKey = activeUserStorageKey;
	const previousState = state;
	const loadedState = loadStateForUser(normalizedUserStorageKey);
	let nextState = loadedState;

	if (previousStorageKey === 'anonymous') {
		nextState = {
			...loadedState,
			recentByEntityType: mergeRecentActivityNewestWins(
				previousState.recentByEntityType,
				loadedState.recentByEntityType,
			),
			pendingSync: [...previousState.pendingSync, ...loadedState.pendingSync].slice(0, MAX_PENDING_SYNC_ITEMS),
		};
		removeStateForUser(previousStorageKey);
	}

	activeUserStorageKey = normalizedUserStorageKey;
	updateState(nextState);

	return true;
}

export function recordRecentActivity(event: RecentActivityEvent) {
	ensureClientState();

	if (!event.entityUuid) {
		return false;
	}

	const currentEntries = state.recentByEntityType[event.entityType];
	const nextEntityEntries = upsertRecentActivityEntry(currentEntries, event);
	const nextRecentByEntityType = {
		...state.recentByEntityType,
		[event.entityType]: nextEntityEntries,
	};
	let nextPendingSync = state.pendingSync;

	if (event.enqueueSync ?? true) {
		nextPendingSync = enqueueSyncPayload(nextPendingSync, nextRecentByEntityType);
	}

	updateState({
		...state,
		recentByEntityType: nextRecentByEntityType,
		pendingSync: nextPendingSync,
	});

	return true;
}

export function recordRecentProjectActivity(event: RecentProjectEvent) {
	if (!event.projectUuid) {
		return false;
	}

	return recordRecentActivity({
		...event,
		entityType: 'project',
		entityUuid: event.projectUuid,
	});
}

export function enqueueRecentActivitySyncSnapshot() {
	ensureClientState();

	updateState({
		...state,
		pendingSync: enqueueSyncPayload(state.pendingSync, state.recentByEntityType),
	});
}

export function replaceRecentActivityFromSync(recentByEntityType: RecentActivityByEntityType) {
	ensureClientState();

	updateState({
		...state,
		recentByEntityType: {
			project: normalizeEntityEntries(recentByEntityType.project, 'project'),
			folder: normalizeEntityEntries(recentByEntityType.folder, 'folder'),
		},
	});
}

export function removePendingSyncItem(syncItemId: string) {
	ensureClientState();

	const nextPendingSync = state.pendingSync.filter((item) => item.id !== syncItemId);
	if (nextPendingSync.length === state.pendingSync.length) {
		return;
	}

	updateState({
		...state,
		pendingSync: nextPendingSync,
	});
}

export function reschedulePendingSyncItem(syncItemId: string, attemptCount: number, nextRetryAt: string) {
	ensureClientState();

	const nextPendingSync = state.pendingSync.map((item) => {
		if (item.id !== syncItemId) {
			return item;
		}

		return {
			...item,
			attemptCount,
			nextRetryAt,
		};
	});

	updateState({
		...state,
		pendingSync: nextPendingSync,
	});
}

export function getDuePendingSyncItems(nowIso = new Date().toISOString(), limit = 3): readonly PendingSyncItem[] {
	ensureClientState();

	return state.pendingSync.filter((item) => item.nextRetryAt <= nowIso).slice(0, limit);
}

export function getNextPendingSyncRetryAt() {
	ensureClientState();

	return state.pendingSync.reduce<string | null>((nextRetryAt, current) => {
		if (!nextRetryAt || current.nextRetryAt < nextRetryAt) {
			return current.nextRetryAt;
		}

		return nextRetryAt;
	}, null);
}

export function recordRecentProjectUploadActivity(input: {
	readonly occurredAt?: string;
	readonly projectName?: string;
	readonly projectUuid?: string;
	readonly source: string;
}) {
	if (!input.projectUuid) {
		logger.debug(LogCategory.Upload, 'Skipping project activity record for upload without project context', {
			source: input.source,
		});
		return false;
	}

	return recordRecentProjectActivity({
		projectUuid: input.projectUuid,
		projectName: input.projectName,
		lastActionKind: 'file_uploaded',
		lastActionAt: input.occurredAt,
	});
}
