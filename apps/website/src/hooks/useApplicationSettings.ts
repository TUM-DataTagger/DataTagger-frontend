import { useQuery } from '@tanstack/react-query';
import { $api, openAPIClient } from '@/util/clientFetch';

export function useApplicationSettings() {
	const { data: applicationSettingsData } = useQuery({
		queryKey: $api.queryOptions('get', '/api/v1/settings/').queryKey,
		queryFn: async () => {
			const { data } = await openAPIClient.GET('/api/v1/settings/');

			return Object.fromEntries(data?.map((setting) => [setting.key, setting.value]) ?? []);
		},
	});

	return { applicationSettingsData };
}
