'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

export function CancelButton() {
	const router = useRouter();

	async function onPress() {
		router.push('../metadata-templates');
	}

	return (
		<Button onPress={async () => onPress()} variant="secondary-discreet">
			Cancel
		</Button>
	);
}
