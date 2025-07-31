'use client';

import { parseAsString, useQueryState } from 'nuqs';
import { ErrorBoundary } from 'react-error-boundary';
import { useMediaQuery } from 'usehooks-ts';
import { GenericComponentErrorBoundary } from '@/components/ErrorBoundary';
import { ShareButton } from '@/components/ShareButton';
import { ViewSwitch } from '@/components/ViewSwitch';
import type { components } from '@/util/openapiSchema';
import { ProjectMembersGrid } from './ProjectMembersGrid';
import { ProjectMembersMenu } from './ProjectMembersMenu';
import { ProjectMembersTable } from './ProjectMembersTable';

export function ProjectMembersView({
	data = [],
	...props
}: {
	readonly data?: components['schemas']['ProjectMembership'][] | undefined;
	readonly projectUuid: string;
}) {
	const [queryState] = useQueryState('view', parseAsString.withDefault('grid'));
	const isMobile = useMediaQuery('(max-width: 600px)', { initializeWithValue: false });

	const hasResults = data?.length;

	return (
		<ErrorBoundary FallbackComponent={GenericComponentErrorBoundary}>
			<div className="flex place-content-end place-items-center gap-2">
				<ShareButton />
				<ProjectMembersMenu projectUuid={props.projectUuid} />
				<ViewSwitch className="hidden md:flex" isDisabled={!data.length} />
			</div>

			{hasResults ? (
				queryState === 'grid' || isMobile ? (
					<ProjectMembersGrid data={data} />
				) : (
					<ProjectMembersTable data={data} />
				)
			) : null}
		</ErrorBoundary>
	);
}
