'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { openAPIClient } from '@/util/clientFetch';

export function CancelButton(props: { readonly projectUuid: string }) {
	const router = useRouter();

	async function onPress() {
		await openAPIClient.POST('/api/v1/project/{id}/unlock/', {
			params: { path: { id: props.projectUuid } },
		});

		router.push('../details');
	}

	return (
		<Button onPress={async () => onPress()} variant="secondary-discreet">
			Cancel
		</Button>
	);
}
