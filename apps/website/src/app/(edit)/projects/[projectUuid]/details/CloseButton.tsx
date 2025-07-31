'use client';

import { XIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { openAPIClient } from '@/util/clientFetch';

export function CloseButton(props: { readonly projectUuid: string }) {
	const router = useRouter();

	async function onPress() {
		await openAPIClient.POST('/api/v1/project/{id}/unlock/', {
			params: { path: { id: props.projectUuid } },
		});

		router.push('../details');
	}

	return (
		<Button
			aria-label="Close"
			className="close dark:text-base-neutral-500 dark:hover:text-base-neutral-700 dark:focus-visible:text-base-neutral-700 dark:pressed:text-base-neutral-900 text-base-neutral-400 hover:text-base-neutral-200 focus-visible:text-base-neutral-200 pressed:text-base-neutral-500 dark:disabled:text-base-neutral-300 disabled:text-base-neutral-300"
			onPress={async () => onPress()}
			size="icon-xs"
			slot="close"
			variant="unset"
		>
			<XIcon aria-hidden className="size-4.5 stroke-[1.5]" />
		</Button>
	);
}
