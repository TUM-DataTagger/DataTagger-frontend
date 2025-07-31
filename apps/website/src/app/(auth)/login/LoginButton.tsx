'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { openAPIClient } from '@/util/clientFetch';

export function LoginButton() {
	const router = useRouter();

	async function onClick() {
		const { data: shibbolethData } = await openAPIClient.GET('/api/v1/shibboleth/start/');

		if (shibbolethData) {
			router.push(shibbolethData.shibboleth_login_url);
		}
	}

	return (
		<Button
			className="bg-base-lavender-100 text-base-xl hover:bg-base-lavender-200 pressed:bg-base-lavender-300 dark:bg-base-lavender-800 dark:hover:bg-base-lavender-700 dark:pressed:bg-base-lavender-600 h-[84px] rounded-lg"
			onPress={async () => onClick()}
			variant="unset"
		>
			Login for TUM members
		</Button>
	);
}
