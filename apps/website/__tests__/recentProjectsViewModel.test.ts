import { describe, expect, it } from 'vitest';
import {
	createRecentProjectEnrichmentMap,
	filterRecentProjectViewModels,
	getRecentProjectsQueryParameters,
	mapFallbackProjects,
	mapRecentProjectEntries,
	RECENT_PROJECTS_LIMIT,
	sortRecentProjectViewModels,
	type RecentProjectViewModel,
} from '@/components/recent-projects/recentProjectsViewModel';
import type { RecentProjectEntry } from '@/util/recentActivity';

describe('recentProjectsViewModel', () => {
	it('maps fallback project name and derived action label when optional values are missing', () => {
		const result = mapRecentProjectEntries([
			{
				entityType: 'project',
				entityUuid: 'project-1',
				projectUuid: 'project-1',
				lastActionKind: 'project_updated',
				lastActionAt: '2026-01-10T12:00:00.000Z',
			},
		] satisfies readonly RecentProjectEntry[]);

		expect(result).toEqual([
			{
				projectUuid: 'project-1',
				projectName: 'project-1',
				lastActionKind: 'project_updated',
				lastActionAt: '2026-01-10T12:00:00.000Z',
				lastActionLabel: 'Updated project',
				createdBy: undefined,
				creationDate: undefined,
				datasetsCount: undefined,
				foldersCount: undefined,
				membership: undefined,
			},
		]);
	});

	it('enriches recent project entries and omits stale local ids after enrichment resolves', () => {
		const enrichmentByUuid = createRecentProjectEnrichmentMap([
			{
				pk: 'project-1',
				name: 'Project Alpha',
				creation_date: '2025-12-01T09:00:00.000Z',
				last_modification_date: '2026-01-10T12:00:00.000Z',
				created_by: {
					pk: 42,
					username: 'me',
					email: 'me@example.test',
					full_name: 'Me Example',
				},
				datasets_count: 3,
				folders_count: 2,
				my_membership: 'admin',
			},
		]);

		const result = mapRecentProjectEntries(
			[
				{
					entityType: 'project',
					entityUuid: 'project-1',
					projectUuid: 'project-1',
					lastActionKind: 'project_updated',
					lastActionAt: '2026-01-10T12:00:00.000Z',
				},
				{
					entityType: 'project',
					entityUuid: 'stale-project',
					projectUuid: 'stale-project',
					lastActionKind: 'project_updated',
					lastActionAt: '2026-01-09T12:00:00.000Z',
				},
			] satisfies readonly RecentProjectEntry[],
			{
				currentUserPk: 42,
				enrichmentByUuid,
			},
		);

		expect(result).toEqual([
			{
				projectUuid: 'project-1',
				projectName: 'Project Alpha',
				lastActionKind: 'project_updated',
				lastActionAt: '2026-01-10T12:00:00.000Z',
				lastActionLabel: 'Updated project',
				createdBy: 'me',
				creationDate: '2025-12-01T09:00:00.000Z',
				datasetsCount: 3,
				foldersCount: 2,
				membership: 'admin',
			},
		]);
	});

	it('uses the latest accessible projects as a capped fallback when no recent ids exist', () => {
		expect(getRecentProjectsQueryParameters([])).toEqual({
			limit: RECENT_PROJECTS_LIMIT,
			ordering: '-last_modification_date',
		});
	});

	it('limits enrichment to the locally recent project ids when they exist', () => {
		expect(getRecentProjectsQueryParameters(['project-1', 'project-2'])).toEqual({
			limit: 2,
			pk: ['project-1', 'project-2'],
		});
	});

	it('maps fallback projects using their last modification as the recent timestamp', () => {
		const result = mapFallbackProjects(
			[
				{
					pk: 'project-1',
					name: 'Project Alpha',
					creation_date: '2025-12-01T09:00:00.000Z',
					last_modification_date: '2026-01-10T12:00:00.000Z',
					created_by: {
						pk: 42,
						username: 'me',
						email: 'me@example.test',
						full_name: 'Me Example',
					},
					datasets_count: 3,
					folders_count: 2,
					my_membership: 'admin',
				},
			],
			42,
		);

		expect(result).toEqual([
			{
				projectUuid: 'project-1',
				projectName: 'Project Alpha',
				lastActionKind: 'project_updated',
				lastActionAt: '2026-01-10T12:00:00.000Z',
				lastActionLabel: 'Last modified',
				createdBy: 'me',
				creationDate: '2025-12-01T09:00:00.000Z',
				datasetsCount: 3,
				foldersCount: 2,
				membership: 'admin',
			},
		]);
	});

	it('filters enriched recent projects locally by creator and membership', () => {
		const entries: readonly RecentProjectViewModel[] = [
			{
				projectUuid: 'project-1',
				projectName: 'Mine',
				lastActionKind: 'project_updated',
				lastActionAt: '2026-01-10T12:00:00.000Z',
				lastActionLabel: 'Updated project',
				createdBy: 'me',
				membership: 'admin',
			},
			{
				projectUuid: 'project-2',
				projectName: 'Shared',
				lastActionKind: 'project_updated',
				lastActionAt: '2026-01-09T12:00:00.000Z',
				lastActionLabel: 'Updated project',
				createdBy: 'others',
				membership: 'member',
			},
		];

		expect(filterRecentProjectViewModels(entries, { createdBy: 'others' })).toEqual([entries[1]]);
		expect(filterRecentProjectViewModels(entries, { membership: 'admin' })).toEqual([entries[0]]);
		expect(filterRecentProjectViewModels(entries, { createdBy: 'me', membership: 'member' })).toEqual([]);
	});

	it('sorts by lastActionAt descending without mutating the input array', () => {
		const entries: readonly RecentProjectViewModel[] = [
			{
				projectUuid: 'project-2',
				projectName: 'Older',
				lastActionKind: 'project_updated',
				lastActionAt: '2026-01-01T12:00:00.000Z',
				lastActionLabel: 'Updated project',
			},
			{
				projectUuid: 'project-1',
				projectName: 'Newest',
				lastActionKind: 'project_updated',
				lastActionAt: '2026-02-01T12:00:00.000Z',
				lastActionLabel: 'Updated project',
			},
		];
		const snapshot = [...entries];

		const sorted = sortRecentProjectViewModels(entries, 'last_worked_on');

		expect(sorted.map((entry) => entry.projectUuid)).toEqual(['project-1', 'project-2']);
		expect(entries).toEqual(snapshot);
		expect(sorted).not.toBe(entries);
	});
});
