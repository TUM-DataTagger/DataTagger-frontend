import type { components } from '@/util/openapiSchema';
import {
	getRecentActivityActionLabel,
	type RecentProjectEntry,
	type RecentActivityActionKind,
} from '@/util/recentActivity';

export type RecentProjectsSortKey = 'last_worked_on';

export type RecentProjectCreatedByFilter = 'me' | 'others';

export type RecentProjectMembershipFilter = 'admin' | 'member';

type ProjectSchema = components['schemas']['Project'];

export type RecentProjectEnrichment = Pick<
	ProjectSchema,
	| 'pk'
	| 'name'
	| 'created_by'
	| 'creation_date'
	| 'last_modification_date'
	| 'datasets_count'
	| 'folders_count'
	| 'my_membership'
>;

export const RECENT_PROJECTS_LIMIT = 9;

export type RecentProjectViewModel = {
	readonly projectUuid: string;
	readonly projectName: string;
	readonly lastActionAt: string;
	readonly lastActionKind: RecentActivityActionKind;
	readonly lastActionLabel: string;
	readonly createdBy?: RecentProjectCreatedByFilter;
	readonly creationDate?: string;
	readonly datasetsCount?: number;
	readonly foldersCount?: number;
	readonly membership?: RecentProjectMembershipFilter;
};

export type RecentProjectFilters = {
	readonly createdBy?: RecentProjectCreatedByFilter;
	readonly membership?: RecentProjectMembershipFilter;
};

type MapRecentProjectEntriesOptions = {
	readonly currentUserPk?: number | string | null;
	readonly enrichmentByUuid?: ReadonlyMap<string, RecentProjectEnrichment>;
};

function normalizeIdentifier(value: number | string | null | undefined) {
	if (value === null || value === undefined) {
		return undefined;
	}

	const normalized = String(value).trim();
	return normalized.length ? normalized : undefined;
}

function getCreatedBy(project: RecentProjectEnrichment | undefined, currentUserPk: number | string | null | undefined) {
	const currentUserIdentifier = normalizeIdentifier(currentUserPk);
	const creatorIdentifier = normalizeIdentifier(project?.created_by?.pk);

	if (!currentUserIdentifier || !creatorIdentifier) {
		return undefined;
	}

	return currentUserIdentifier === creatorIdentifier ? 'me' : 'others';
}

export function createRecentProjectEnrichmentMap(projects: readonly RecentProjectEnrichment[]) {
	return new Map(projects.map((project) => [project.pk, project]));
}

export function getRecentProjectsQueryParameters(recentProjectUuids: readonly string[]) {
	if (recentProjectUuids.length) {
		return {
			limit: recentProjectUuids.length,
			pk: [...recentProjectUuids],
		};
	}

	return {
		limit: RECENT_PROJECTS_LIMIT,
		ordering: '-last_modification_date',
	};
}

export function mapFallbackProjects(
	projects: readonly RecentProjectEnrichment[],
	currentUserPk?: number | string | null,
): readonly RecentProjectViewModel[] {
	return projects.map((project) => ({
		projectUuid: project.pk,
		projectName: project.name,
		lastActionAt: project.last_modification_date,
		lastActionKind: 'project_updated',
		lastActionLabel: 'Last modified',
		createdBy: getCreatedBy(project, currentUserPk),
		creationDate: project.creation_date,
		datasetsCount: project.datasets_count,
		foldersCount: project.folders_count,
		membership: project.my_membership ?? undefined,
	}));
}

export function mapRecentProjectEntries(
	entries: readonly RecentProjectEntry[],
	options: MapRecentProjectEntriesOptions = {},
): readonly RecentProjectViewModel[] {
	const shouldRequireEnrichment = options.enrichmentByUuid !== undefined;

	return entries.flatMap((entry) => {
		const project = options.enrichmentByUuid?.get(entry.projectUuid);

		if (shouldRequireEnrichment && !project) {
			return [];
		}

		return [
			{
				projectUuid: entry.projectUuid,
				projectName: project?.name ?? entry.projectName ?? entry.projectUuid,
				lastActionAt: entry.lastActionAt,
				lastActionKind: entry.lastActionKind,
				lastActionLabel: entry.lastActionLabel ?? getRecentActivityActionLabel(entry.lastActionKind),
				createdBy: getCreatedBy(project, options.currentUserPk),
				creationDate: project?.creation_date,
				datasetsCount: project?.datasets_count,
				foldersCount: project?.folders_count,
				membership: project?.my_membership ?? undefined,
			},
		];
	});
}

export function filterRecentProjectViewModels(
	entries: readonly RecentProjectViewModel[],
	filters: RecentProjectFilters,
): readonly RecentProjectViewModel[] {
	return entries.filter((entry) => {
		if (filters.createdBy && entry.createdBy !== filters.createdBy) {
			return false;
		}

		if (filters.membership && entry.membership !== filters.membership) {
			return false;
		}

		return true;
	});
}

export function sortRecentProjectViewModels(
	entries: readonly RecentProjectViewModel[],
	sortKey: RecentProjectsSortKey,
): readonly RecentProjectViewModel[] {
	switch (sortKey) {
		// oxlint-disable-next-line unicorn/no-useless-switch-case
		case 'last_worked_on':
		default:
			return [...entries].sort((firstEntry, secondEntry) =>
				secondEntry.lastActionAt.localeCompare(firstEntry.lastActionAt),
			);
	}
}
