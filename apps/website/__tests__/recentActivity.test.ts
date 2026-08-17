import { describe, expect, it } from 'vitest';
import {
	MAX_RECENT_ENTRIES_PER_ENTITY,
	mergeRecentActivityNewestWins,
	parseRecentActivityState,
	upsertRecentActivityEntry,
	type RecentActivityEntry,
} from '@/util/recentActivity';

function makeEntry(index: number): RecentActivityEntry {
	return {
		entityType: 'project',
		entityUuid: `project-${index}`,
		projectUuid: `project-${index}`,
		projectName: `Project ${index}`,
		lastActionKind: 'project_updated',
		lastActionAt: `2026-01-01T00:00:${String(index).padStart(2, '0')}.000Z`,
		lastActionLabel: 'Updated project',
	};
}

describe('recentActivity', () => {
	it('upserts by entity and keeps newer entry', () => {
		const existing: RecentActivityEntry[] = [
			{
				entityType: 'project',
				entityUuid: 'project-1',
				projectUuid: 'project-1',
				projectName: 'Project 1',
				lastActionKind: 'project_updated',
				lastActionAt: '2026-01-01T12:00:00.000Z',
				lastActionLabel: 'Updated project',
			},
		];

		const result = upsertRecentActivityEntry(existing, {
			entityType: 'project',
			entityUuid: 'project-1',
			projectUuid: 'project-1',
			lastActionKind: 'folder_updated',
			lastActionAt: '2026-01-01T11:59:59.000Z',
		});

		expect(result).toHaveLength(1);
		expect(result[0]?.lastActionKind).toBe('project_updated');
		expect(result[0]?.lastActionAt).toBe('2026-01-01T12:00:00.000Z');
	});

	it('caps recent entity list to MAX_RECENT_ENTRIES_PER_ENTITY', () => {
		const entries = Array.from({ length: MAX_RECENT_ENTRIES_PER_ENTITY + 4 }, (_, index) => makeEntry(index + 1));
		const result = entries.reduce<readonly RecentActivityEntry[]>(
			(current, entry) =>
				upsertRecentActivityEntry(current, {
					entityType: entry.entityType,
					entityUuid: entry.entityUuid,
					projectUuid: entry.projectUuid,
					projectName: entry.projectName,
					lastActionKind: entry.lastActionKind,
					lastActionAt: entry.lastActionAt,
				}),
			[],
		);

		expect(result).toHaveLength(MAX_RECENT_ENTRIES_PER_ENTITY);
		expect(result[0]?.entityUuid).toBe(`project-${MAX_RECENT_ENTRIES_PER_ENTITY + 4}`);
		expect(result.at(-1)?.entityUuid).toBe('project-5');
	});

	it('falls back to empty state for invalid payload', () => {
		const parsed = parseRecentActivityState({ version: 999, recentByEntityType: 'bad' });

		expect(parsed.recentByEntityType.project).toEqual([]);
		expect(parsed.recentByEntityType.folder).toEqual([]);
		expect(parsed.pendingSync).toEqual([]);
	});

	it('merges local and remote entries using newest timestamp per entity', () => {
		const merged = mergeRecentActivityNewestWins(
			{
				project: [
					{
						entityType: 'project',
						entityUuid: 'project-1',
						projectUuid: 'project-1',
						projectName: 'Project 1',
						lastActionKind: 'project_updated',
						lastActionAt: '2026-01-01T10:00:00.000Z',
						lastActionLabel: 'Updated project',
					},
				],
				folder: [],
			},
			{
				project: [
					{
						entityType: 'project',
						entityUuid: 'project-1',
						projectUuid: 'project-1',
						projectName: 'Project 1',
						lastActionKind: 'folder_created',
						lastActionAt: '2026-01-01T11:00:00.000Z',
						lastActionLabel: 'Created folder',
					},
					{
						entityType: 'project',
						entityUuid: 'project-2',
						projectUuid: 'project-2',
						projectName: 'Project 2',
						lastActionKind: 'project_updated',
						lastActionAt: '2026-01-01T09:00:00.000Z',
						lastActionLabel: 'Updated project',
					},
				],
				folder: [],
			},
		);

		expect(merged.project).toHaveLength(2);
		expect(merged.project[0]?.entityUuid).toBe('project-1');
		expect(merged.project[0]?.lastActionKind).toBe('folder_created');
		expect(merged.project[1]?.entityUuid).toBe('project-2');
	});
});
