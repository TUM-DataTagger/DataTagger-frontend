'use client';

import { parseAsString, useQueryState } from 'nuqs';
import { ErrorBoundary } from 'react-error-boundary';
import { useMediaQuery } from 'usehooks-ts';
import { GenericComponentErrorBoundary } from '@/components/ErrorBoundary';
import { ShareButton } from '@/components/ShareButton';
import { ViewSwitch } from '@/components/ViewSwitch';
import type { components } from '@/util/openapiSchema';
import { ProjectFolderPermissionsGrid } from './ProjectFolderPermissionsGrid';
import { ProjectFolderPermissionsMenu } from './ProjectFolderPermissionsMenu';
import { ProjectFolderPermissionsTable } from './ProjectFolderPermissionsTable';

export function ProjectFolderPermissionsView({
	data = [],
	...props
}: {
	readonly data?: components['schemas']['FolderPermission'][] | undefined;
	readonly folderUuid: string;
	readonly projectUuid: string;
}) {
	const [queryState] = useQueryState('view', parseAsString.withDefault('grid'));
	const isMobile = useMediaQuery('(max-width: 600px)', { initializeWithValue: false });

	const hasResults = data?.length;

	return (
		<ErrorBoundary FallbackComponent={GenericComponentErrorBoundary}>
			<div className="flex place-content-end place-items-center gap-2">
				<ShareButton />
				<ProjectFolderPermissionsMenu folderUuid={props.folderUuid} projectUuid={props.projectUuid} />
				<ViewSwitch className="hidden md:flex" isDisabled={!hasResults} />
			</div>

			{hasResults ? (
				queryState === 'grid' || isMobile ? (
					<ProjectFolderPermissionsGrid data={data} />
				) : (
					<ProjectFolderPermissionsTable data={data} />
				)
			) : null}
		</ErrorBoundary>
	);
}
