'use client';

import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { parseAsBoolean, useQueryStates } from 'nuqs';
import { type PropsWithChildren } from 'react';
import { useMediaQuery } from 'usehooks-ts';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { globalToastQueue, ToastType } from '@/components/ui/Toast';
import { useExitTemplateBulkMode } from '@/hooks/useExitTemplateBulkMode';
import { cx } from '@/styles/cva';
import { $api, openAPIClient } from '@/util/clientFetch';
import { formatErrorMessage } from '@/util/formatErrorMessage';
import { invalidateUpgradeMetadataStatusQueries } from '@/util/invalidateUpgradeMetadataStatusQueries';
import type { components } from '@/util/openapiSchema';

type MetadataTemplateContainer = components['schemas']['MetadataTemplateContainer'];

export function EditTemplateContainersToolbar(props: PropsWithChildren /* <{ readonly count?: number }> */) {
	const [queryStates, setQueryStates] = useQueryStates({
		template_bulk_edit: parseAsBoolean.withDefault(false),
	});
	const isMobile = useMediaQuery('(max-width: 600px)', { initializeWithValue: false });

	return (
		<div
			className={cx(
				'flex h-14 place-items-center rounded-sm border border-base-neutral-100 px-4 py-4.5 dark:border-base-neutral-700',
				queryStates.template_bulk_edit && 'border-transparent bg-base-neutral-80 dark:bg-base-neutral-700/72',
				isMobile && 'flex-col-reverse place-content-center gap-4',
				queryStates.template_bulk_edit && isMobile && 'h-[104px]',
			)}
		>
			{queryStates.template_bulk_edit ? (
				<div className="flex w-full place-items-center gap-4">
					{/* <div>
						<span className="bg-base-lavender-200 text-base-label-xs text-base-neutral-900 dark:bg-base-lavender-700 dark:text-base-neutral-40 h-4 rounded-2xl px-1 py-px tabular-nums">
							{queryStates.template_selected.length}
						</span>{' '}
						<span className="text-base-xs">of {props.count} selected</span>
					</div> */}
					{props.children}
				</div>
			) : null}
			<div className={cx('flex w-full place-items-center', !isMobile && 'place-content-end')}>
				<Switch
					isSelected={queryStates.template_bulk_edit}
					onChange={async () =>
						setQueryStates((old) => ({
							...old,
							template_bulk_edit: !old.template_bulk_edit,
						}))
					}
					size="sm"
					variant="green-lime"
				>
					Activate
				</Switch>
			</div>
		</div>
	);
}

export function UpdateMetadataTemplateButton(props: {
	readonly containers: readonly MetadataTemplateContainer[];
	readonly folderUuid?: string | undefined;
	readonly projectUuid: string;
}) {
	const queryClient = useQueryClient();
	const exitBulkMode = useExitTemplateBulkMode();

	const resourcePath = props.folderUuid ? '/api/v1/folder/{id}/' : '/api/v1/project/{id}/';
	const resourceId: string = props.folderUuid ?? props.projectUuid;

	const resourceQueryOptions = $api.queryOptions('get', resourcePath, {
		params: { path: { id: resourceId } },
	});

	const { data: resourceData } = useSuspenseQuery(resourceQueryOptions);

	const currentMetadataTemplate = resourceData.metadata_template;
	const selectedContainerPk = currentMetadataTemplate?.metadata_template_container?.pk;
	const assignedContainer = props.containers.find((item) => item.pk === selectedContainerPk);
	const latestTemplatePk = assignedContainer?.latest_metadata_template?.pk ?? null;
	const currentTemplatePk = currentMetadataTemplate?.pk ?? null;
	const canUpdateMetadataTemplate =
		Boolean(latestTemplatePk && currentTemplatePk) && latestTemplatePk !== currentTemplatePk;

	const { mutate: updateMetadataTemplate, isPending: isUpdatingTemplate } = useMutation({
		mutationFn: async (metadataTemplatePk: string) => {
			const { error, response } = await openAPIClient.PATCH(resourcePath, {
				params: { path: { id: resourceId } },
				body: { metadata_template: metadataTemplatePk },
			});

			if (error) {
				throw new Error(formatErrorMessage(error, response));
			}
		},
		async onSuccess() {
			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: resourceQueryOptions.queryKey,
				}),
				invalidateUpgradeMetadataStatusQueries(queryClient),
			]);

			await exitBulkMode();

			globalToastQueue.add(
				{
					message: 'Metadata template updated to the latest version.',
					type: ToastType.Success,
				},
				{ timeout: 2_500 },
			);
		},
	});

	const handleUpdateToLatest = () => {
		if (!latestTemplatePk || !canUpdateMetadataTemplate) {
			return;
		}

		updateMetadataTemplate(latestTemplatePk);
	};

	return canUpdateMetadataTemplate ? (
		<Button isDisabled={isUpdatingTemplate} onPress={handleUpdateToLatest} size="sm" type="button" variant="filled">
			Update to latest version
		</Button>
	) : null;
}
