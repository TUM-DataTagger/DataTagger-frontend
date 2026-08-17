'use client';

import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { PencilIcon } from 'lucide-react';
import Link from 'next/link';
import { parseAsString, useQueryState } from 'nuqs';
import { useState } from 'react';
import { useMediaQuery } from 'usehooks-ts';
import { MetadataField, MetadataFieldDiffTimelineEntry } from '@/components/Metadata';
import { Separator } from '@/components/ui/Separator';
import { Switch } from '@/components/ui/Switch';
import { useWebSocketMessages } from '@/contexts/WebSocket';
import { useMetadataTemplatePermissions } from '@/hooks/useMetadataTemplatePermissions';
import { buttonStyles } from '@/styles/ui/button';
import { $api } from '@/util/clientFetch';
import { buildMetadataDiffTimeline, scrubMetadataField } from '@/util/metadataDiff';

export function MetadataTemplateContainerMetadata(props: { readonly metadataTemplateContainerUuid: string }) {
	const [queryState] = useQueryState('version', parseAsString);
	const isMobile = useMediaQuery('(max-width: 600px)', { initializeWithValue: false });

	const messages = useWebSocketMessages();

	const { data: metadataTemplateData } = useSuspenseQuery(
		$api.queryOptions('get', '/api/v1/metadata-template-container/{id}/', {
			params: { path: { id: props.metadataTemplateContainerUuid } },
		}),
	);

	const latestId = metadataTemplateData.latest_metadata_template?.pk ?? null;
	const selectedId = queryState ?? latestId;
	const hasDiff = Boolean(queryState && latestId && selectedId !== latestId);

	const { data: metadataTemplateFieldsData } = useSuspenseQuery(
		$api.queryOptions('get', '/api/v1/metadata-template-field/', {
			params: { query: { metadata_template: selectedId ?? '' } },
		}),
	);

	const compareVersionId = hasDiff ? latestId : null;

	const compareMetadataTemplateFields = useQuery(
		$api.queryOptions(
			'get',
			'/api/v1/metadata-template-field/',
			{
				params: { query: { metadata_template: compareVersionId ?? '' } },
			},
			{ enabled: Boolean(compareVersionId) },
		),
	);

	const diffQuery = useQuery(
		$api.queryOptions(
			'get',
			'/api/v1/metadata-template/{id}/diff/',
			{
				params: {
					path: { id: selectedId ?? '' },
					query: { compare: latestId ?? '' },
				},
			},
			{ enabled: hasDiff },
		),
	);

	const metadataTemplateFields = metadataTemplateFieldsData.results ?? [];
	const compareMetadataTemplateFieldsResults = compareMetadataTemplateFields.data?.results ?? [];

	const currentMetadataTemplateFields = metadataTemplateFields.map((field) => scrubMetadataField(field));
	const scrubbedCompareMetadataTemplateFields = compareMetadataTemplateFieldsResults.map((field) =>
		scrubMetadataField(field),
	);

	const diffTimeline = buildMetadataDiffTimeline({
		currentFields: currentMetadataTemplateFields,
		compareFields: scrubbedCompareMetadataTemplateFields,
		diffValues: diffQuery.data?.fields,
	});
	const hasDiffTimelineEntries = diffTimeline.some((entry) => entry.type !== 'unchanged');

	const { isProjectMetadataTemplateAdmin, isFolderAdmin, isGlobalMetadataTemplateAdmin } =
		useMetadataTemplatePermissions({
			metadataTemplateContainerUuid: props.metadataTemplateContainerUuid,
		});

	const { data: lockData } = useSuspenseQuery(
		$api.queryOptions('get', '/api/v1/metadata-template-container/{id}/status/', {
			params: { path: { id: props.metadataTemplateContainerUuid } },
		}),
	);

	const lockMessage = messages[props.metadataTemplateContainerUuid]?.find(
		(message) => message.type === 'lock_status_changed',
	)?.data;
	const isMetadataTemplateContainerLocked =
		lockMessage?.status === undefined ? Boolean(lockData.locked) : Boolean(lockMessage.status);

	const [showDiff, setShowDiff] = useState(false);

	// useEffect(() => {
	// 	setShowDiff(hasDiff);
	// }, [hasDiff]);

	// const diffTypeCounts = diffTimeline.reduce(
	// 	(acc, entry) => {
	// 		if (entry.type === 'changed' || entry.type === 'removed' || entry.type === 'added') {
	// 			acc[entry.type] += 1;
	// 		}

	// 		return acc;
	// 	},
	// 	{ changed: 0, removed: 0, added: 0 },
	// );

	const isDiffLoading = hasDiff && (diffQuery.isLoading || compareMetadataTemplateFields.isLoading);
	const diffError = diffQuery.error ?? compareMetadataTemplateFields.error;

	return (
		<>
			<div className="flex flex-col gap-6">
				<div className="flex place-content-between place-items-center gap-2">
					<h2 className="flex place-items-center gap-2 text-base-label-md">
						Defined metadata fields
						<span className="flex h-4 w-3.5 place-content-center place-items-center rounded-full bg-base-lavender-200 text-base-label-xs text-base-neutral-900 dark:bg-base-lavender-600 dark:text-base-neutral-100">
							{metadataTemplateFieldsData.results?.length}
						</span>
					</h2>
					{hasDiff ||
					(!isProjectMetadataTemplateAdmin && !isFolderAdmin && !isGlobalMetadataTemplateAdmin) ||
					isMobile ||
					isMetadataTemplateContainerLocked ? null : (
						<Link
							className={buttonStyles({
								variant: 'tonal',
								isDark: true,
								size: 'icon-sm',
							})}
							href={`/metadata-templates/${props.metadataTemplateContainerUuid}/edit-metadata-fields`}
						>
							<PencilIcon aria-hidden size={18} strokeWidth={1.5} />
						</Link>
					)}
				</div>
				<Separator className="mx-0" />
			</div>
			<div className="flex flex-col gap-6">
				{hasDiff ? (
					<div className="flex place-content-between place-items-center gap-2">
						<span className="text-base-neutral-600 dark:text-base-neutral-300">
							Compare newest version with selected version
						</span>
						<Switch
							className="flex-row-reverse"
							isSelected={showDiff}
							onChange={setShowDiff}
							size="sm"
							variant="green-lime"
						>
							Show changes
						</Switch>
					</div>
				) : null}
				{showDiff && hasDiff ? (
					<div className="flex flex-col gap-3">
						{isDiffLoading ? (
							<span className="text-base-neutral-600 dark:text-base-neutral-300">Loading changes…</span>
						) : null}
						{diffError ? <span className="text-base-red-500">Unable to load diff</span> : null}
						{!isDiffLoading && !diffError && !hasDiffTimelineEntries ? (
							<span className="flex place-content-between place-items-center gap-2 px-4 text-base-neutral-600 dark:text-base-neutral-300">
								No differences
							</span>
						) : null}
						{!isDiffLoading && !diffError && hasDiffTimelineEntries ? (
							<>
								{diffTimeline.map((entry) => (
									<MetadataFieldDiffTimelineEntry
										entry={entry}
										key={entry.type === 'added' ? entry.next.pk : entry.current.pk}
										showAllOptions
									/>
								))}
							</>
						) : null}
					</div>
				) : (
					<div className="flex flex-col gap-3">
						{metadataTemplateFields.map((metadata) => (
							<div
								className="flex flex-col gap-1 rounded-sm border border-base-neutral-100 p-4 dark:border-base-neutral-700"
								key={metadata.pk}
							>
								<MetadataField entry={metadata} showAllOptions />
							</div>
						)) ?? null}
					</div>
				)}
			</div>
		</>
	);
}
