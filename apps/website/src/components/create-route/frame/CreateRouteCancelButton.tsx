'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

type CreateRouteCancelButtonProps = {
	readonly href: string;
	onBeforeNavigate?(): void | Promise<void>;
};

export function CreateRouteCancelButton({ href, onBeforeNavigate }: CreateRouteCancelButtonProps) {
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
