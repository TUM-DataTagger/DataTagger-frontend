import type { $api as ClientApi } from '@/util/clientFetch';
import type { components } from '@/util/openapiSchema';

export const DASHBOARD_SNAPSHOT_STALE_TIME = 60_000;

export type DashboardSnapshot = components['schemas']['DashboardSnapshot'];

type DashboardSnapshotApi = Pick<typeof ClientApi, 'queryOptions'>;

export function formatDashboardCount(count: number, singular: string) {
	return `${count} ${singular}${count === 1 ? '' : 's'}`;
}

export function dashboardSnapshotQueryOptions(api: DashboardSnapshotApi) {
	return api.queryOptions('get', '/api/v1/dashboard/', undefined, {
		staleTime: DASHBOARD_SNAPSHOT_STALE_TIME,
	});
}
