'use client';

import { useSuspenseQueries } from '@tanstack/react-query';
import { HelpCircleIcon } from 'lucide-react';
import { parseAsString, useQueryStates } from 'nuqs';
import { ErrorBoundary } from 'react-error-boundary';
import { useMediaQuery } from 'usehooks-ts';
import { GenericComponentErrorBoundary } from '@/components/ErrorBoundary';
import { ShareButton } from '@/components/ShareButton';
import { ViewSwitch } from '@/components/ViewSwitch';
import { TooltipTrigger, Tooltip, TooltipContent } from '@/components/ui/Tooltip';
import { $api } from '@/util/clientFetch';
import { ProjectMetadataTemplatesGrid } from './ProjectMetadataTemplatesGrid';
import { ProjectMetadataTemplatesTable } from './ProjectMetadataTemplatesTable';
import { ProjectMetadataTemplatesViewEmpty } from './ProjectMetadataTemplatesViewEmpty';

export function ProjectMetadataTemplatesView(props: { readonly projectUuid: string }) {
	const [queryStates] = useQueryStates({
		sort: parseAsString.withDefault('name'),
		view: parseAsString.withDefault('grid'),
	});
	const isMobile = useMediaQuery('(max-width: 600px)', { initializeWithValue: false });

	const [projectData, metadataTemplatesData] = useSuspenseQueries({
		queries: [
			$api.queryOptions('get', '/api/v1/project/{id}/', {
				params: { path: { id: props.projectUuid } },
			}),
			$api.queryOptions('get', '/api/v1/metadata-template/', {
				params: { query: { assigned_to_object_id: props.projectUuid, limit: 9_999, ordering: queryStates.sort } },
			}),
		],
	});

	const results = [
		...(projectData.data.metadata_template?.assigned_to_object_id === null ? [projectData.data.metadata_template] : []),
		...(metadataTemplatesData.data.results ?? []),
	];

	const hasResults = results?.length;

	return (
		<ErrorBoundary FallbackComponent={GenericComponentErrorBoundary}>
			<div className="flex place-content-between place-items-center">
				<div className="flex place-items-center gap-1">
					<span className="text-base-neutral-600 dark:text-base-neutral-300">
						Metadata templates are user-defined collections of metadata fields.
					</span>
					<Tooltip delay={400}>
						<TooltipTrigger variant="tooltip">
							<HelpCircleIcon aria-hidden size={18} strokeWidth={1.5} />
						</TooltipTrigger>
						<TooltipContent showArrow={false} variant="rich">
							Templates can be created and activated in projects and folders.
							<br />
							<br />
							To activate a template, go to "Details"
						</TooltipContent>
					</Tooltip>
				</div>
				<ShareButton />
			</div>

			<div className="flex place-content-end place-items-center gap-2">
				{/* <ProjectFoldersSortByMenu isDisabled={!data?.results?.length} uuid={uuid} /> */}
				<ViewSwitch className="hidden md:flex" isDisabled={!hasResults} />
			</div>

			{hasResults ? (
				queryStates.view === 'grid' || isMobile ? (
					<ProjectMetadataTemplatesGrid data={results} />
				) : (
					<ProjectMetadataTemplatesTable data={results} />
				)
			) : (
				<ProjectMetadataTemplatesViewEmpty projectUuid={props.projectUuid} />
			)}
		</ErrorBoundary>
	);
}
