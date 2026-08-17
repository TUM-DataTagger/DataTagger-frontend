import type { QueryClient } from '@tanstack/react-query';
import { $api } from '@/util/clientFetch';

const UPGRADE_METADATA_STATUS_QUERY_KEY_PREFIX = $api
	.queryOptions('get', '/api/v1/uploads-dataset/{id}/upgrade-metadata-status/', {
		params: { path: { id: '' } },
	})
	.queryKey.slice(0, 2);

export async function invalidateUpgradeMetadataStatusQueries(queryClient: QueryClient) {
	return queryClient.invalidateQueries({
		queryKey: UPGRADE_METADATA_STATUS_QUERY_KEY_PREFIX,
	});
}
