import { DeveloperToolbarMenu } from '@/components/DeveloperToolbar';
import { developerFlag } from '@/flags';
import { getQueryClient } from '@/util/getQueryClient';

export async function DeveloperToolbar() {
	const isDeveloper = await developerFlag();

	if (!isDeveloper) {
		return null;
	}

	const queryClient = getQueryClient();

	await queryClient.prefetchQuery({
		queryKey: ['flag'],
		queryFn: async () => {
			const res = await fetch('/flags');
			return res.json();
		},
	});

	return <DeveloperToolbarMenu />;
}
