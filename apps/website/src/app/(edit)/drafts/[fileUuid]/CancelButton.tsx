'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

export function CancelButton(props: { readonly fileUuid: string }) {
	const router = useRouter();

	async function onPress() {
		router.push(`/drafts/${props.fileUuid}`);
	}

	return (
		<Button onPress={async () => onPress()} variant="secondary-discreet">
			Cancel
		</Button>
	);
}
