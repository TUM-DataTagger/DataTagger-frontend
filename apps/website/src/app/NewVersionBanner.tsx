'use client';

import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { versionInfo } from '@/util/version-info';

export function NewVersionBanner() {
	const { data: buildIdData } = useQuery({
		queryKey: ['buildId'],
		queryFn: async () => {
			const response = await fetch('/buildId?dpl=LATEST');
			return response.json();
		},
		gcTime: 0,
		refetchInterval: 5 * 60 * 1_000,
	});

	if (!buildIdData || buildIdData.buildId === versionInfo.hash) {
		return null;
	}

	return (
		<div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2">
			<div className="flex w-lg place-items-center gap-3 rounded-sm bg-base-neutral-900 p-4 text-base-md text-base-neutral-40 data-[animation=entering]:animate-in data-[animation=entering]:duration-200 data-[animation=entering]:ease-out data-[animation=entering]:fade-in data-[animation=entering]:slide-in-from-bottom-1 data-[animation=exiting]:animate-out data-[animation=exiting]:duration-150 data-[animation=exiting]:ease-in data-[animation=exiting]:fade-out data-[animation=exiting]:slide-out-to-bottom-1 dark:bg-base-neutral-40 dark:text-base-neutral-900">
				<div>New version available - Please refresh the page to get the latest version</div>
				<Button
					className="text-base-lavender-400 hover:underline dark:text-base-lavender-700 pressed:text-base-lavender-300 dark:pressed:text-base-lavender-800"
					onPress={() => {
						window.location.reload();
					}}
					variant="unset"
				>
					Refresh
				</Button>
			</div>
		</div>
	);
}
