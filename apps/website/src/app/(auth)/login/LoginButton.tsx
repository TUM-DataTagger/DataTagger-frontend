'use client';

import { AlertCircleIcon, Loader2Icon } from 'lucide-react';
import { parseAsString, useQueryState } from 'nuqs';
import { useState } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { getSafeRedirectTarget } from '@/util/authRedirect';

export function LoginButton() {
	const [nextTarget] = useQueryState('next', parseAsString);
	const [isPending, setIsPending] = useState(false);
	const safeNextTarget = getSafeRedirectTarget(nextTarget);

	function onClick() {
		setIsPending(true);
		const route = safeNextTarget
			? `/auth/shibboleth-start?${new URLSearchParams({ next: safeNextTarget }).toString()}`
			: '/auth/shibboleth-start';
		window.location.assign(route);
	}

	return (
		<div className="flex flex-col gap-4">
			<Button
				className="h-21 rounded-lg bg-base-lavender-100 text-base-xl hover:bg-base-lavender-200 dark:bg-base-lavender-800 dark:hover:bg-base-lavender-700 pressed:bg-base-lavender-300 dark:pressed:bg-base-lavender-600"
				isDisabled={isPending}
				onPress={onClick}
				variant="unset"
			>
				{isPending ? <Loader2Icon aria-hidden className="animate-spin" size={18} strokeWidth={1.5} /> : null}
				Login for TUM members
			</Button>
			{isPending ? (
				<Alert>
					<AlertCircleIcon aria-hidden className="shrink-0" size={24} strokeWidth={1.5} />
					Redirecting to TUM login…
				</Alert>
			) : null}
		</div>
	);
}
