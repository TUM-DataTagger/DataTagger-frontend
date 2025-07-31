'use client';

import { useAtomValue } from 'jotai';
import { Loader2Icon } from 'lucide-react';
import type { PropsWithChildren } from 'react';
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { openAPIClient } from '@/util/clientFetch';
import { emailAtom } from '../Email';

export function ResendEmail(props: PropsWithChildren) {
	const userEmail = useAtomValue(emailAtom);
	const [isLoading, setIsLoading] = useState(false);
	const timeoutRef = useRef<NodeJS.Timeout>(undefined);

	async function onPress() {
		clearTimeout(timeoutRef.current);
		setIsLoading(true);

		try {
			await openAPIClient.POST('/api/v1/reset-password/', {
				body: { email: userEmail },
			});
		} catch (error) {
			console.error(error);
		} finally {
			// eslint-disable-next-line require-atomic-updates
			timeoutRef.current = setTimeout(() => setIsLoading(false), 2_000);
		}
	}

	return (
		<Button
			className="text-base-lavender-500 p-0"
			isDisabled={isLoading}
			onPress={async () => onPress()}
			variant="unset"
		>
			{props.children}
			{isLoading ? <Loader2Icon aria-hidden className="ml-1 animate-spin" size={16} strokeWidth={1.5} /> : null}
		</Button>
	);
}
