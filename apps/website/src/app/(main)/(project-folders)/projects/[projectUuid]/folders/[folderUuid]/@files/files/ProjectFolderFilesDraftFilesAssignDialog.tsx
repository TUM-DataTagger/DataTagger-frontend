'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileInputIcon, PackageOpenIcon } from 'lucide-react';
import { useState } from 'react';
import type { Key, ModalOverlayProps } from 'react-aria-components';
import { Button } from '@/components/ui/Button';
import { GridList, GridListItem } from '@/components/ui/GridList';
import { ModalBody, ModalClose, ModalContent, ModalFooter, ModalHeader, ModalTitle } from '@/components/ui/Modal';
import { $api, openAPIClient } from '@/util/clientFetch';
import { convertDataRateLog } from '@/util/convertDataRate';
import { logger, LogCategory } from '@/util/logger';
import { useCurrentSubfolder } from './useCurrentSubfolder';

export function ProjectFolderFilesDraftFilesAssignDialog(props: ModalOverlayProps & { readonly folderUuid: string }) {
	const [draftUploadsSelection, setDraftUploadsSelection] = useState(new Set<Key | string>());
	const queryClient = useQueryClient();

	const { data: datasetsData } = useQuery(
		$api.queryOptions(
			'get',
			'/api/v1/uploads-dataset/',
			{
				params: { query: { limit: 9_999 } },
			},
			{
				placeholderData: keepPreviousData,
			},
		),
	);

	const [currentSubfolder] = useCurrentSubfolder();

	const { mutate, isPending } = useMutation({
		mutationFn: async () => {
			await openAPIClient.POST('/api/v1/uploads-dataset/bulk-publish/', {
				body: {
					folder: props.folderUuid,
					subfolder: currentSubfolder,
					uploads_datasets: [...draftUploadsSelection] as string[],
				},
			});

			return {};
		},
		async onSuccess() {
			logger.info(LogCategory.DraftFiles, 'Drafts assigned to folder', {
				count: draftUploadsSelection.size,
				targetFolderUuid: props.folderUuid,
			});

			props.onOpenChange?.(false);
			setDraftUploadsSelection(new Set());

			await queryClient.invalidateQueries({
				queryKey: $api.queryOptions('get', '/api/v1/folder/{id}/', {
					params: { path: { id: props.folderUuid } },
				}).queryKey,
			});
			await queryClient.invalidateQueries({
				queryKey: $api.queryOptions('get', '/api/v1/uploads-dataset/', {
					params: { query: { folder: props.folderUuid } },
				}).queryKey,
			});
			await queryClient.invalidateQueries({
				queryKey: $api.queryOptions('get', '/api/v1/uploads-dataset/').queryKey,
			});
		},
		onError(error) {
			logger.error(LogCategory.DraftFiles, 'Assign failed', {
				error: error instanceof Error ? error.message : String(error),
			});
		},
	});

	return (
		<ModalContent {...props} aria-label="Add files from my draft files">
			<ModalHeader className="flex flex-row place-items-center gap-2 text-base-xl" hasBorder>
				<ModalTitle className="text-base-xl">
					Add files from
					<span className="inline-flex place-items-center gap-2 text-base-label-xl">
						<PackageOpenIcon aria-hidden size={24} strokeWidth={1.5} /> My draft files
					</span>
				</ModalTitle>
			</ModalHeader>
			<ModalBody className="p-0">
				<GridList
					aria-label="Add files from my draft files"
					className="overscroll-auto"
					disabledBehavior="selection"
					onSelectionChange={(keys) => {
						if (keys instanceof Set) {
							setDraftUploadsSelection(keys);
						}
					}}
					selectedKeys={draftUploadsSelection}
					selectionMode="multiple"
				>
					{datasetsData?.results
						?.filter((draft) => draft.latest_version?.version_file)
						.map((draft) => (
							<GridListItem
								className="max-h-28 min-h-20 px-4 py-3 first:pt-5"
								id={draft.pk}
								key={draft.pk}
								textValue={draft.display_name ?? 'Empty dataset'}
							>
								<div className="flex flex-1 gap-2">
									<div className="flex-1">
										<div className="flex max-w-60 flex-col gap-1 md:max-w-80">
											<span className="truncate text-base-label-md" title={draft.display_name ?? 'Empty dataset'}>
												{draft.display_name ?? 'Empty dataset'}
											</span>
											<span
												className="truncate text-base-xs text-base-neutral-600 dark:text-base-neutral-300"
												title={
													(draft?.latest_version?.version_file?.metadata?.find(
														(metadata) => metadata.custom_key === 'ORIGINAL_FILE_PATH',
													)?.value as string | undefined) ?? '-'
												}
											>
												{(draft?.latest_version?.version_file?.metadata?.find(
													(metadata) => metadata.custom_key === 'ORIGINAL_FILE_PATH',
												)?.value as string | undefined) ?? '-'}
											</span>
											<span
												className="truncate text-base-xs"
												title={
													convertDataRateLog(
														draft?.latest_version?.version_file?.metadata?.find(
															(metadata) => metadata.custom_key === 'FILE_SIZE',
														)?.value as number | undefined,
													) ?? '...'
												}
											>
												{convertDataRateLog(
													draft?.latest_version?.version_file?.metadata?.find(
														(metadata) => metadata.custom_key === 'FILE_SIZE',
													)?.value as number | undefined,
												) ?? '...'}
											</span>
										</div>
									</div>
								</div>
							</GridListItem>
						))}
				</GridList>
			</ModalBody>
			<ModalFooter className="sm:place-content-between" hasBorder>
				<div>
					<span className="h-4 rounded-2xl bg-base-lavender-200 px-1 py-px text-base-label-xs text-base-neutral-900 tabular-nums dark:bg-base-lavender-700 dark:text-base-neutral-40">
						{draftUploadsSelection.size}
					</span>{' '}
					<span className="text-base-xs text-base-neutral-600 dark:text-base-neutral-300">selected</span>
				</div>

				<div className="flex flex-col-reverse place-content-between gap-2 sm:flex-row sm:place-items-center">
					<ModalClose variant="secondary-discreet">Cancel</ModalClose>
					<Button
						isDisabled={!draftUploadsSelection.size || isPending}
						onPress={() => mutate()}
						type="submit"
						variant="filled"
					>
						<FileInputIcon aria-hidden data-slot="icon" size={18} strokeWidth={1.5} />
						Add
					</Button>
				</div>
			</ModalFooter>
		</ModalContent>
	);
}
