'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

type EditRouteCancelButtonProps = {
	readonly href: string;
	onBeforeNavigate?(): void | Promise<void>;
};

export function EditRouteCancelButton({ href, onBeforeNavigate }: EditRouteCancelButtonProps) {
	const router = useRouter();

	async function onPress() {
		await onBeforeNavigate?.();
		router.push(href);
	}

	return (
		<Button onPress={async () => onPress()} variant="secondary-discreet">
			Cancel
		</Button>
	);
}
