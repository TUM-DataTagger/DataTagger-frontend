// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type * as RecentActivityModule from '@/util/recentActivity';
import type { RecentActivityState } from '@/util/recentActivity';

function makeStoredState(version: number, input?: Partial<RecentActivityState>): RecentActivityState {
	return {
		version,
		recentByEntityType: {
			project: [],
			folder: [],
			...input?.recentByEntityType,
		},
		pendingSync: input?.pendingSync ?? [],
	};
}

describe('recentActivity state transitions', () => {
	let mod: typeof RecentActivityModule;

	beforeEach(async () => {
		vi.resetModules();
		window.localStorage.clear();
		mod = await import('@/util/recentActivity');
	});

	it('merges anonymous state into user state and removes anonymous storage key', () => {
		mod.recordRecentActivity({
			entityType: 'project',
			entityUuid: 'project-anonymous',
			projectUuid: 'project-anonymous',
			projectName: 'Anonymous Project',
			lastActionKind: 'project_updated',
			lastActionAt: '2026-01-01T09:00:00.000Z',
		});

		window.localStorage.setItem(
			'recent-activity:user-123',
			JSON.stringify(
				makeStoredState(mod.RECENT_ACTIVITY_STORAGE_VERSION, {
					recentByEntityType: {
						project: [
							{
								entityType: 'project',
								entityUuid: 'project-user',
								projectUuid: 'project-user',
								projectName: 'User Project',
								lastActionKind: 'project_updated',
								lastActionAt: '2026-01-01T10:00:00.000Z',
								lastActionLabel: 'Updated project',
							},
						],
						folder: [],
					},
					pendingSync: [
						{
							id: 'remote-sync-1',
							createdAt: '2026-01-01T09:59:59.000Z',
							nextRetryAt: '2026-01-01T09:59:59.000Z',
							attemptCount: 0,
							payload: {
								project: [],
								folder: [],
							},
						},
					],
				}),
			),
		);

		const switched = mod.setRecentActivityUser('user-123');
		const state = mod.getRecentActivityState();

		expect(switched).toBe(true);
		expect(state.recentByEntityType.project.map((entry) => entry.entityUuid)).toEqual([
			'project-user',
			'project-anonymous',
		]);
		expect(state.pendingSync).toHaveLength(2);
		expect(window.localStorage.getItem('recent-activity:anonymous')).toBeNull();
	});

	it('does not enqueue pending sync when enqueueSync is false', () => {
		mod.recordRecentActivity({
			entityType: 'project',
			entityUuid: 'project-1',
			projectUuid: 'project-1',
			lastActionKind: 'project_updated',
			lastActionAt: '2026-01-01T10:00:00.000Z',
			enqueueSync: false,
		});

		expect(mod.getRecentActivityState().pendingSync).toEqual([]);
	});

	it('does not enqueue duplicate snapshots', () => {
		mod.recordRecentActivity({
			entityType: 'project',
			entityUuid: 'project-1',
			projectUuid: 'project-1',
			lastActionKind: 'project_updated',
			lastActionAt: '2026-01-01T10:00:00.000Z',
		});
		expect(mod.getRecentActivityState().pendingSync).toHaveLength(1);

		mod.enqueueRecentActivitySyncSnapshot();
		expect(mod.getRecentActivityState().pendingSync).toHaveLength(1);
	});

	it('removePendingSyncItem is a no-op when id is missing', () => {
		mod.recordRecentActivity({
			entityType: 'project',
			entityUuid: 'project-1',
			projectUuid: 'project-1',
			lastActionKind: 'project_updated',
			lastActionAt: '2026-01-01T10:00:00.000Z',
		});
		const before = mod.getRecentActivityState();

		mod.removePendingSyncItem('missing-id');
		const after = mod.getRecentActivityState();

		expect(after).toEqual(before);
	});

	it('reschedulePendingSyncItem updates only the matching sync item', () => {
		mod.recordRecentActivity({
			entityType: 'project',
			entityUuid: 'project-1',
			projectUuid: 'project-1',
			lastActionKind: 'project_updated',
			lastActionAt: '2026-01-01T10:00:00.000Z',
		});
		mod.recordRecentActivity({
			entityType: 'project',
			entityUuid: 'project-2',
			projectUuid: 'project-2',
			lastActionKind: 'project_updated',
			lastActionAt: '2026-01-01T10:01:00.000Z',
		});

		const initialPendingSync = mod.getRecentActivityState().pendingSync;
		expect(initialPendingSync).toHaveLength(2);
		const firstId = initialPendingSync[0]?.id;
		const untouchedSecond = initialPendingSync[1];

		mod.reschedulePendingSyncItem(firstId!, 3, '2026-01-01T12:00:00.000Z');
		const nextPendingSync = mod.getRecentActivityState().pendingSync;

		expect(nextPendingSync[0]).toMatchObject({
			id: firstId,
			attemptCount: 3,
			nextRetryAt: '2026-01-01T12:00:00.000Z',
		});
		expect(nextPendingSync[1]).toEqual(untouchedSecond);
	});

	it('returns only due pending sync items and respects limit', () => {
		mod.recordRecentActivity({
			entityType: 'project',
			entityUuid: 'project-1',
			projectUuid: 'project-1',
			lastActionKind: 'project_updated',
			lastActionAt: '2026-01-01T10:00:00.000Z',
		});
		mod.recordRecentActivity({
			entityType: 'project',
			entityUuid: 'project-2',
			projectUuid: 'project-2',
			lastActionKind: 'project_updated',
			lastActionAt: '2026-01-01T10:01:00.000Z',
		});

		const pendingSync = mod.getRecentActivityState().pendingSync;
		const firstId = pendingSync[0]?.id;
		const secondId = pendingSync[1]?.id;

		mod.reschedulePendingSyncItem(firstId!, 1, '2026-01-01T09:59:00.000Z');
		mod.reschedulePendingSyncItem(secondId!, 1, '2026-01-01T09:59:30.000Z');

		const dueLimited = mod.getDuePendingSyncItems('2026-01-01T10:00:00.000Z', 1);
		const dueAll = mod.getDuePendingSyncItems('2026-01-01T10:00:00.000Z', 2);

		expect(dueLimited).toHaveLength(1);
		expect(dueAll).toHaveLength(2);
	});

	it('returns false when upload activity is recorded without project context', () => {
		expect(
			mod.recordRecentProjectUploadActivity({
				source: 'unit-test',
			}),
		).toBe(false);
	});
});
