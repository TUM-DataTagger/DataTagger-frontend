'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { openAPIClient } from '@/util/clientFetch';

export function CancelButton(props: {
	readonly fileUuid: string;
	readonly folderUuid: string;
	readonly projectUuid: string;
}) {
	const router = useRouter();

	async function onPress() {
		await openAPIClient.POST('/api/v1/uploads-dataset/{id}/unlock/', {
			params: { path: { id: props.fileUuid } },
		});

		router.push(`/projects/${props.projectUuid}/folders/${props.folderUuid}/files/${props.fileUuid}`);
	}

	return (
		<Button onPress={async () => onPress()} variant="secondary-discreet">
			Cancel
		</Button>
	);
}
