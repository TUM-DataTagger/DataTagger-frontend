'use client';

import { format } from '@formkit/tempo';
import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { useSetAtom } from 'jotai';
import { LocateFixedIcon, PanelRightCloseIcon, XIcon } from 'lucide-react';
import { useParams } from 'next/navigation';
import { parseAsString, useQueryState } from 'nuqs';
import { useState, useEffect } from 'react';
import type { ModalOverlayProps } from 'react-aria-components';
import { useMediaQuery } from 'usehooks-ts';
import { Button } from '@/components/ui/Button';
import { ModalBody, ModalClose, ModalContent, ModalFooter, ModalHeader, ModalTitle } from '@/components/ui/Modal';
import { useSidebar } from '@/components/ui/Sidebar';
import { Tag, TagGroup } from '@/components/ui/TagGroup';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/Tooltip';
import { SideSheetMode, sideSheetSelectedDatasetAtom, sideSheetModeAtom } from '@/stores/sideSheet';
import { cx } from '@/styles/cva';
import { $api } from '@/util/clientFetch';

export function VersionHistoryBadge(props: {
	readonly className?: string;
	readonly fileUuid: string;
	readonly versionUuid?: string;
}) {
	const isMobile = useMediaQuery('(max-width: 600px)', { initializeWithValue: false });
	const [queryState] = useQueryState('version', parseAsString);

	const { data: datasetData } = useSuspenseQuery(
		$api.queryOptions('get', '/api/v1/uploads-dataset/{id}/', {
			params: { path: { id: props.fileUuid } },
		}),
	);

	const { data: datasetVersionData, isLoading: isLoadingDatasetVersionData } = useQuery(
		$api.queryOptions(
			'get',
			'/api/v1/uploads-version/{id}/',
			{
				params: { path: { id: props.versionUuid ?? queryState ?? datasetData.latest_version?.pk ?? '' } },
			},
			{ enabled: Boolean(props.versionUuid ?? queryState ?? datasetData.latest_version?.pk) },
		),
	);

	const isLatestVersionSelected = props.versionUuid
		? props.versionUuid === datasetData.latest_version?.pk
		: !queryState || queryState === datasetData.latest_version?.pk;

	return (
		<TagGroup aria-label="Current version" className="place-self-auto">
			<Tag color="info" textValue="Current version">
				{isLatestVersionSelected ? (
					<div className="flex place-items-center gap-1">
						<LocateFixedIcon aria-hidden size={18} strokeWidth={1.5} /> Current version
					</div>
				) : isLoadingDatasetVersionData ? (
					'Loading ...'
				) : (
					<span className={cx('max-w-[100ch] truncate', props.className, isMobile && 'max-w-[30ch]')}>
						Version:{' '}
						{datasetVersionData?.name ??
							format(datasetVersionData?.creation_date ?? new Date(), 'MMM D, YYYY hh:mm', 'en')}
					</span>
				)}
			</Tag>
		</TagGroup>
	);
}

export function VersionHistoryCloseIndicator() {
	const [isVersionHistoryExitDialogOpen, setIsVersionHistoryExitDialogOpen] = useState(false);

	return (
		<>
			<Tooltip delay={400}>
				<TooltipTrigger onPress={() => setIsVersionHistoryExitDialogOpen(true)} size="icon" variant="crystal-tonal">
					<XIcon aria-hidden size={18} strokeWidth={1.5} />
				</TooltipTrigger>
				<TooltipContent showArrow={false}>Exit version history</TooltipContent>
			</Tooltip>
			<VersionHistoryExitDialog
				isOpen={isVersionHistoryExitDialogOpen}
				onOpenChange={setIsVersionHistoryExitDialogOpen}
			/>
		</>
	);
}

export function VersionHistoryCheck() {
	const { fileUuid } = useParams<{ readonly fileUuid: string }>();
	const [queryState] = useQueryState('version', parseAsString);
	const setSideSheetMode = useSetAtom(sideSheetModeAtom);
	const setSideSheetSelectedDataset = useSetAtom(sideSheetSelectedDatasetAtom);
	const { setOpen } = useSidebar();

	useEffect(
		() => {
			if (queryState && fileUuid) {
				setOpen(true);
				setSideSheetMode(SideSheetMode.VersionHistory);
				setSideSheetSelectedDataset(fileUuid);
			}

			return () => {
				setOpen(false);
				setSideSheetMode(SideSheetMode.Dataset);
				setSideSheetSelectedDataset(null);
			};
		},
		// eslint-disable-next-line react-compiler/react-compiler
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[],
	);

	return null;
}

export function VersionHistoryExitDialog({ ...props }: ModalOverlayProps) {
	const isMobile = useMediaQuery('(max-width: 600px)', { initializeWithValue: false });
	const [, setQueryState] = useQueryState('version', parseAsString);
	const setSideSheetMode = useSetAtom(sideSheetModeAtom);
	const setSideSheetSelectedDataset = useSetAtom(sideSheetSelectedDatasetAtom);
	const { setOpen } = useSidebar();

	return (
		<ModalContent {...props} role="alertdialog">
			<ModalHeader>
				<ModalTitle className="block">
					You are about to <strong>exit</strong> the <strong>version history mode</strong>.
				</ModalTitle>
			</ModalHeader>
			{isMobile && (
				<ModalBody>
					<p className="text-base-neutral-600 dark:text-base-neutral-300">
						To minimize the side sheet and focus on details of the selected version, use the panels hide action{' '}
						<span aria-hidden>
							"
							<PanelRightCloseIcon aria-hidden className="inline-block" size={18} strokeWidth={1.5} />"
						</span>
						.
					</p>
				</ModalBody>
			)}
			<ModalFooter>
				<ModalClose variant="secondary-discreet">Cancel</ModalClose>
				<Button
					onPress={async () => {
						setOpen(false);
						props.onOpenChange?.(false);
						await setQueryState(null);
						setSideSheetMode(SideSheetMode.Dataset);
						setSideSheetSelectedDataset(null);
					}}
					type="submit"
					variant="filled"
				>
					Exit version history
				</Button>
			</ModalFooter>
		</ModalContent>
	);
}
