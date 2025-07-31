'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

export function CancelButton(props: { readonly metadataTemplateUuid: string }) {
	const router = useRouter();

	async function onPress() {
		router.push(`/metadata-templates/${props.metadataTemplateUuid}`);
	}

	return (
		<Button onPress={async () => onPress()} variant="secondary-discreet">
			Cancel
		</Button>
	);
}
