'use client';

import { XIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

export function CloseButton() {
	const router = useRouter();

	async function onPress() {
		router.push('/metadata-templates');
	}

	return (
		<Button
			aria-label="Close"
			className="close text-base-neutral-400 hover:text-base-neutral-200 focus-visible:text-base-neutral-200 disabled:text-base-neutral-300 dark:text-base-neutral-500 dark:hover:text-base-neutral-700 dark:focus-visible:text-base-neutral-700 dark:disabled:text-base-neutral-300 pressed:text-base-neutral-500 dark:pressed:text-base-neutral-900"
			onPress={async () => onPress()}
			size="icon-xs"
			slot="close"
			variant="unset"
		>
			<XIcon aria-hidden className="size-4.5 stroke-[1.5]" />
		</Button>
	);
}
