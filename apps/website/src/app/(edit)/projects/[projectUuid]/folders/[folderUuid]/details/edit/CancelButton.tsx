'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { openAPIClient } from '@/util/clientFetch';

export function CancelButton(props: { readonly folderUuid: string }) {
	const router = useRouter();

	async function onPress() {
		await openAPIClient.POST('/api/v1/folder/{id}/unlock/', {
			params: { path: { id: props.folderUuid } },
		});

		router.push('../details');
	}

	return (
		<Button onPress={async () => onPress()} variant="secondary-discreet">
			Cancel
		</Button>
	);
}
