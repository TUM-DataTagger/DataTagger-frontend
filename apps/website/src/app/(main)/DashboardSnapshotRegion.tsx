'use client';

import { useQueryClient } from '@tanstack/react-query';
import { RefreshCwIcon } from 'lucide-react';
import { createContext, Suspense, use, useCallback, useMemo, useState, type ReactNode } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Button } from '@/components/ui/Button';
import { $api } from '@/util/clientFetch';
import { dashboardSnapshotQueryOptions } from '@/util/dashboardSnapshot';

type DashboardSnapshotRegionsContextValue = {
	readonly resetVersion: number;
	retry(): void;
};

const DashboardSnapshotRegionsContext = createContext<DashboardSnapshotRegionsContextValue | null>(null);

export function DashboardSnapshotRegionsProvider({ children }: { readonly children: ReactNode }) {
	const queryClient = useQueryClient();
	const [resetVersion, setResetVersion] = useState(0);
	const retry = useCallback(async () => {
		await queryClient.resetQueries({ exact: true, queryKey: dashboardSnapshotQueryOptions($api).queryKey });
		setResetVersion((version) => version + 1);
	}, [queryClient]);
	const value = useMemo(() => ({ resetVersion, retry }), [resetVersion, retry]);

	return <DashboardSnapshotRegionsContext value={value}>{children}</DashboardSnapshotRegionsContext>;
}

function DashboardSnapshotError({ message, retry }: { readonly message: string; retry(): void }) {
	return (
		<div className="flex min-h-22 flex-col place-content-center place-items-center gap-3 rounded-xl border border-base-neutral-100 p-4 dark:border-base-neutral-700">
			<p>{message}</p>
			<Button variant="outline" size="sm" onPress={retry}>
				<RefreshCwIcon aria-hidden data-slot="icon" /> Retry
			</Button>
		</div>
	);
}

export function DashboardSnapshotRegion({
	children,
	errorMessage,
	loadingFallback,
}: {
	readonly children: ReactNode;
	readonly errorMessage: string;
	readonly loadingFallback: ReactNode;
}) {
	const context = use(DashboardSnapshotRegionsContext);

	if (!context) {
		throw new Error('DashboardSnapshotRegion must be rendered inside DashboardSnapshotRegionsProvider.');
	}

	return (
		<ErrorBoundary
			fallback={<DashboardSnapshotError message={errorMessage} retry={context.retry} />}
			resetKeys={[context.resetVersion]}
		>
			<Suspense fallback={loadingFallback}>{children}</Suspense>
		</ErrorBoundary>
	);
}
