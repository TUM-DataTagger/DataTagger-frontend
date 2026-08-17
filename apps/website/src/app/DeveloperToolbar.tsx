import { DeveloperToolbarMenu } from '@/components/DeveloperToolbar';
import { developerFlag } from '@/flags';
import { ENV } from '@/util/env';
import { getQueryClient } from '@/util/getQueryClient';

export async function DeveloperToolbar() {
	if (!ENV.FF_ALLOW_DEVELOPER_OVERRIDES) {
		return null;
	}

	const isDeveloper = await developerFlag();

	if (!isDeveloper) {
		return null;
	}

	const queryClient = getQueryClient();

	await queryClient.prefetchQuery({
		queryKey: ['flags'],
		queryFn: async () => {
			const res = await fetch('/flags');
			return res.json();
		},
	});

	return <DeveloperToolbarMenu />;
}
