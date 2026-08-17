'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

type MetadataTemplateCreateCancelButtonProps = {
	readonly href: string;
};

export function MetadataTemplateCreateCancelButton({ href }: MetadataTemplateCreateCancelButtonProps) {
	const router = useRouter();

	async function onPress() {
		router.push(href);
	}

	return (
		<Button onPress={async () => onPress()} variant="secondary-discreet">
			Cancel
		</Button>
	);
}
