'use client';

import { format } from '@formkit/tempo';
import { useMutation, useQueries, useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import {
	BlocksIcon,
	ChevronDownIcon,
	FileIcon,
	FileInputIcon,
	FileLock2Icon,
	Maximize2Icon,
	TagsIcon,
	TrashIcon,
	Wand2Icon,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { parseAsArrayOf, parseAsString, useQueryStates, useQueryState } from 'nuqs';
import { useEffect, useState } from 'react';
import type { ModalOverlayProps } from 'react-aria-components';
import { useMediaQuery } from 'usehooks-ts';
import { MetadataValue } from '@/components/Metadata';
import { UpdateUploadDropZone } from '@/components/UpdateUploadDropZone';
import { UpdateUploadTrigger } from '@/components/UpdateUploadTrigger';
import { EditInfoIcon } from '@/components/icons/EditInfoIcon';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/Accordion';
import { Button } from '@/components/ui/Button';
import { ModalClose, ModalFooter, ModalHeader, ModalBody, ModalContent, Modal } from '@/components/ui/Modal';
import { Tag, TagGroup } from '@/components/ui/TagGroup';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/Tooltip';
import { useEnv } from '@/contexts/EnvContext';
import { useWebSocket } from '@/contexts/WebSocket';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { cx } from '@/styles/cva';
import { $api, openAPIClient } from '@/util/clientFetch';
import { convertDataRateLog } from '@/util/convertDataRate';
import { differenceInDays } from '@/util/differenceInDays';
import { formatErrorMessage } from '@/util/formatErrorMessage';

export function FileExpirationBadge(props: { readonly expirationDate: string }) {
	return (
		<Tooltip delay={400}>
			<TooltipTrigger
				className={cx(
					'text-base-sm h-6 w-auto cursor-auto place-self-start rounded-sm px-2 py-1 print:inline-flex',
					differenceInDays(props.expirationDate) <= 3
						? 'bg-base-sunset-100 text-base-sunset-800 dark:bg-base-sunset-800 dark:text-base-sunset-100'
						: differenceInDays(props.expirationDate) <= 7
							? 'bg-base-tangerine-100 text-base-tangerine-800 dark:bg-base-tangerine-800 dark:text-base-tangerine-100'
							: 'bg-base-neutral-100 dark:bg-base-neutral-700',
				)}
				variant="unset"
			>
				{differenceInDays(props.expirationDate)} {differenceInDays(props.expirationDate) === 1 ? 'day' : 'days'} left
			</TooltipTrigger>
			<TooltipContent variant="plain">
				{differenceInDays(props.expirationDate) === 1
					? 'Auto-deletion will be executed tomorrow'
					: `${differenceInDays(props.expirationDate)} days until auto-deletion`}
			</TooltipContent>
		</Tooltip>
	);
}

export function FileHeading(props: { readonly fileUuid: string }) {
	const { data: datasetData } = useSuspenseQuery(
		$api.queryOptions('get', '/api/v1/uploads-dataset/{id}/', {
			params: { path: { id: props.fileUuid } },
		}),
	);

	return <h1 className="text-base-heading-xs break-all">{datasetData.display_name ?? 'Empty dataset'}</h1>;
}

export function FileCreationDates(props: { readonly className?: string | undefined; readonly fileUuid: string }) {
	const [queryState] = useQueryState('version', parseAsString);

	const { data: datasetData } = useSuspenseQuery(
		$api.queryOptions('get', '/api/v1/uploads-dataset/{id}/', {
			params: { path: { id: props.fileUuid } },
		}),
	);

	const { data: datasetVersionData } = useQuery(
		$api.queryOptions(
			'get',
			'/api/v1/uploads-version/{id}/',
			{
				params: { path: { id: queryState ?? datasetData.latest_version?.pk ?? '' } },
			},
			{ enabled: Boolean(queryState ?? datasetData.latest_version?.pk) },
		),
	);

	return (
		<>
			<span className="text-base-label-lg">Dates</span>
			<div className={cx('flex flex-col gap-4', props.className)}>
				<Tooltip delay={400}>
					<TooltipTrigger
						className="text-base-sm text-base-neutral-600 dark:text-base-neutral-300 cursor-auto place-self-start print:inline-flex"
						variant="unset"
					>
						<Wand2Icon aria-hidden className="shrink-0" size={18} strokeWidth={1.5} />
						{datasetData.created_by.email} - {format(datasetData.creation_date, 'MMM D, YYYY hh:mm', 'en')}
					</TooltipTrigger>
					<TooltipContent variant="plain">Created by / at</TooltipContent>
				</Tooltip>

				<Tooltip delay={400}>
					<TooltipTrigger
						className="text-base-sm text-base-neutral-600 dark:text-base-neutral-300 cursor-auto place-self-start print:inline-flex"
						variant="unset"
					>
						<FileInputIcon aria-hidden className="shrink-0" size={18} strokeWidth={1.5} />
						{datasetVersionData?.version_file
							? `${datasetData.created_by.email} - 
									${format(datasetVersionData.version_file.creation_date ?? new Date(), 'MMM D, YYYY hh:mm', 'en')}`
							: '-'}
					</TooltipTrigger>
					<TooltipContent variant="plain">File last updated by / at</TooltipContent>
				</Tooltip>

				<Tooltip delay={400}>
					<TooltipTrigger
						className="text-base-sm text-base-neutral-600 dark:text-base-neutral-300 cursor-auto place-self-start print:inline-flex"
						variant="unset"
					>
						<TagsIcon aria-hidden className="shrink-0" size={18} strokeWidth={1.5} />
						{datasetVersionData
							? `${datasetVersionData.last_modified_by.email} - 
									${format(datasetVersionData.last_modification_date ?? new Date(), 'MMM D, YYYY hh:mm', 'en')}`
							: '-'}
					</TooltipTrigger>
					<TooltipContent variant="plain">Metadata last updated by / at</TooltipContent>
				</Tooltip>
			</div>
		</>
	);
}

export function FileInformation(props: {
	readonly className?: string | undefined;
	readonly folderUuid?: string | undefined;
	readonly projectUuid?: string | undefined;
}) {
	const [projectData, folderData] = useQueries({
		queries: [
			$api.queryOptions(
				'get',
				'/api/v1/project/{id}/',
				{
					params: { path: { id: props.projectUuid ?? '' } },
				},
				{ enabled: Boolean(props.projectUuid) },
			),
			$api.queryOptions(
				'get',
				'/api/v1/folder/{id}/',
				{
					params: { path: { id: props.folderUuid ?? '' } },
				},
				{ enabled: Boolean(props.folderUuid) },
			),
		],
	});

	return projectData.data || folderData.data ? (
		<div className={cx('grid grid-cols-[120px_minmax(0,1fr)] items-center gap-y-2', props.className)}>
			{projectData.data ? (
				<>
					<div>Project</div>
					<TagGroup aria-label="Project">
						<Tag className="cursor-pointer" href={`/projects/${projectData.data.pk}`} target="_blank">
							{projectData.data?.name}
						</Tag>
					</TagGroup>
				</>
			) : null}
			{projectData.data && folderData.data ? (
				<>
					<div>Folder</div>
					<TagGroup aria-label="Folder">
						<Tag
							className="cursor-pointer"
							href={`/projects/${projectData.data.pk}/folders/${folderData.data.pk}`}
							target="_blank"
						>
							{folderData.data.name}
						</Tag>
					</TagGroup>
				</>
			) : null}
			{projectData.data && folderData.data ? (
				<>
					<div>Storage</div>
					<div>DSS</div>
				</>
			) : null}
		</div>
	) : null;
}

export function FileMetadata(props: {
	readonly fileUuid: string;
	readonly folderUuid?: string;
	readonly isDraft?: boolean;
	readonly projectUuid?: string;
}) {
	const [queryState] = useQueryState('version', parseAsString);
	const isMobile = useMediaQuery('(max-width: 600px)', { initializeWithValue: false });
	const router = useRouter();
	const queryClient = useQueryClient();
	const [fileMetadataExpanded, setFileMetadataExpanded] = useState<string[]>(['file-metadata']);
	const [isEditLockOpen, setIsEditLockOpen] = useState(false);

	const { currentUserData } = useCurrentUser();

	const { messages } = useWebSocket();

	const { data: datasetData } = useSuspenseQuery(
		$api.queryOptions('get', '/api/v1/uploads-dataset/{id}/', {
			params: { path: { id: props.fileUuid } },
		}),
	);

	const { data: datasetVersionData } = useQuery(
		$api.queryOptions(
			'get',
			'/api/v1/uploads-version/{id}/',
			{
				params: { path: { id: queryState ?? datasetData?.latest_version?.pk ?? '' } },
			},
			{ enabled: Boolean(queryState ?? datasetData?.latest_version?.pk) },
		),
	);

	const [lockData, folderPermissionData] = useQueries({
		queries: [
			$api.queryOptions(
				'get',
				'/api/v1/uploads-dataset/{id}/status/',
				{
					params: { path: { id: props.fileUuid } },
				},
				{ enabled: Boolean(props.folderUuid) },
			),
			$api.queryOptions(
				'get',
				'/api/v1/folder-permission/',
				{
					params: { query: { folder: props.folderUuid ?? '', project_membership__member: currentUserData?.pk ?? -1 } },
				},
				{ enabled: Boolean(currentUserData?.pk && props.folderUuid) },
			),
		],
	});

	const lockMessage = messages[props.fileUuid]?.find((message) => message.type === 'lock_status_changed')?.data;
	const isFileLocked = lockMessage?.status === undefined ? Boolean(lockData.data?.locked) : Boolean(lockMessage.status);

	const canEdit =
		props.isDraft || folderPermissionData.data?.[0]?.is_folder_admin || folderPermissionData.data?.[0]?.can_edit;

	useEffect(() => {
		if (datasetVersionData?.metadata?.length) {
			setFileMetadataExpanded((oldState) => [...oldState, 'additional-metadata']);
		} else {
			setFileMetadataExpanded((oldState) => oldState.filter((item) => item !== 'additional-metadata'));
		}
	}, [datasetVersionData?.metadata?.length]);

	async function isLocked() {
		const { data } = await openAPIClient.GET('/api/v1/uploads-dataset/{id}/status/', {
			params: { path: { id: props.fileUuid } },
		});
		await queryClient.invalidateQueries({
			queryKey: $api.queryOptions('get', '/api/v1/uploads-dataset/{id}/status/', {
				params: { path: { id: props.fileUuid } },
			}).queryKey,
		});

		return data;
	}

	async function setLocked() {
		const { data } = await openAPIClient.POST('/api/v1/uploads-dataset/{id}/lock/', {
			params: { path: { id: props.fileUuid } },
		});

		return data;
	}

	return (
		<>
			<Accordion
				className="flex flex-col gap-6"
				disabled={!datasetVersionData?.metadata?.length && !datasetVersionData?.version_file?.metadata?.length}
				onValueChange={setFileMetadataExpanded}
				type="multiple"
				value={fileMetadataExpanded}
			>
				<AccordionItem value="file-metadata">
					<AccordionTrigger
						append={
							<ChevronDownIcon
								aria-hidden
								className="duration-200 group-data-[state=open]:rotate-180 print:hidden"
								size={24}
								strokeWidth={1.5}
							/>
						}
						className="border-base-neutral-100 text-base-label-md dark:border-base-neutral-700 rounded-lg border px-6 py-4 text-[unset] hover:text-[unset] focus-visible:text-[unset] data-[state=open]:rounded-b-none dark:text-[unset] dark:focus-visible:text-[unset]"
					>
						File metadata
					</AccordionTrigger>
					<AccordionContent className="bg-base-neutral-40 dark:bg-base-neutral-700/40 flex flex-col gap-4 rounded-b-lg border border-t-0 px-6 py-4">
						{datasetVersionData?.version_file?.metadata?.map((metadata) => (
							<div className="flex flex-col gap-1" key={metadata.pk}>
								<span className="text-base-label-md text-base-neutral-500 dark:text-base-neutral-400 break-all">
									{metadata.custom_key}
								</span>
								{typeof metadata.value === 'string' ? (
									<span className="text-base-md break-all">{metadata.value}</span>
								) : metadata.custom_key === 'FILE_SIZE' && typeof metadata.value === 'number' ? (
									<span className="text-base-md break-all">{convertDataRateLog(metadata.value)}</span>
								) : (
									'Unknown metadata type'
								)}
							</div>
						)) ?? null}
					</AccordionContent>
				</AccordionItem>
				<AccordionItem
					className="relative"
					disabled={!datasetVersionData?.metadata?.length}
					value="additional-metadata"
				>
					{!queryState && canEdit && !isMobile ? (
						<Button
							className="absolute top-[13px] right-16 print:hidden"
							isDark
							isDisabled={isFileLocked}
							onPress={async () => {
								if (props.folderUuid && props.projectUuid) {
									const status = await isLocked();
									if (status?.locked) {
										setIsEditLockOpen(true);
									} else {
										await setLocked();
										router.push(
											`/projects/${props.projectUuid}/folders/${props.folderUuid}/files/${props.fileUuid}/edit-metadata`,
										);
									}
								} else {
									router.push(`/drafts/${props.fileUuid}/edit-metadata`);
								}
							}}
							size="sm"
							variant="filled"
						>
							Edit metadata
						</Button>
					) : null}
					<AccordionTrigger
						append={
							<ChevronDownIcon
								aria-hidden
								className="duration-200 group-data-[state=open]:rotate-180 print:hidden"
								size={24}
								strokeWidth={1.5}
							/>
						}
						className="border-base-neutral-100 text-base-label-md dark:border-base-neutral-700 rounded-lg border px-6 py-4 text-[unset] hover:text-[unset] focus-visible:text-[unset] data-[state=open]:rounded-b-none dark:text-[unset] dark:focus-visible:text-[unset]"
					>
						Additional metadata
					</AccordionTrigger>
					<AccordionContent className="flex flex-col gap-4 rounded-b-lg border border-t-0 px-6 py-4">
						{datasetVersionData?.metadata?.map((metadata) => (
							<div className="flex flex-col gap-1" key={metadata.pk}>
								<span className="text-base-label-md text-base-neutral-600 dark:text-base-neutral-300 flex place-items-center gap-2 break-all">
									{metadata.custom_key}
									{metadata.metadata_template_field ? (
										<BlocksIcon
											aria-hidden
											className="text-base-crystal-500 dark:text-base-crystal-300"
											size={18}
											strokeWidth={1.5}
										/>
									) : null}
								</span>
								<MetadataValue field={metadata} />
							</div>
						)) ?? null}
					</AccordionContent>
				</AccordionItem>
			</Accordion>
			{props.isDraft ? null : (
				<FileEditLockDialog fileUuid={props.fileUuid} isOpen={isEditLockOpen} onOpenChange={setIsEditLockOpen} />
			)}
		</>
	);
}

export function FileThumbnail(props: { readonly className?: string | undefined; readonly fileUuid: string }) {
	const env = useEnv();
	const [queryState] = useQueryState('version', parseAsString);

	const { data: datasetData } = useSuspenseQuery(
		$api.queryOptions('get', '/api/v1/uploads-dataset/{id}/', {
			params: { path: { id: props.fileUuid } },
		}),
	);

	const { data: datasetVersionData } = useQuery(
		$api.queryOptions(
			'get',
			'/api/v1/uploads-version/{id}/',
			{
				params: { path: { id: queryState ?? datasetData?.latest_version?.pk ?? '' } },
			},
			{ enabled: Boolean(queryState ?? datasetData?.latest_version?.pk) },
		),
	);

	const isImage =
		(
			datasetVersionData?.version_file?.metadata?.find((metadata) => metadata.custom_key === 'MIME_TYPE')
				?.value as string
		)?.startsWith('image/') ?? false;

	return isImage ? (
		<div
			className={cx(
				'relative flex h-[104px] w-[104px] place-content-center place-items-center rounded-lg',
				props.className,
			)}
		>
			<Modal>
				<Button
					aria-label="Preview image"
					className="absolute top-2 right-2 h-8 w-8 p-[7px] opacity-80"
					size="icon"
					variant="secondary-tonal"
				>
					<Maximize2Icon aria-hidden size={18} strokeWidth={1.5} />
				</Button>
				<ModalContent>
					<ModalHeader hidden />
					<ModalBody>
						<picture className="flex place-content-center">
							<img
								alt={datasetVersionData?.version_file?.name ?? 'Empty version'}
								className="max-h-[calc(100dvh_-_200px)]"
								src={`${env.BASE_API_URL}/api/v1/uploads-version/${datasetVersionData?.pk}/download/`}
							/>
						</picture>
					</ModalBody>
					<ModalFooter>
						<ModalClose variant="filled">Close</ModalClose>
					</ModalFooter>
				</ModalContent>
			</Modal>

			<picture>
				<img
					alt={datasetVersionData?.version_file?.name ?? 'Empty version'}
					className="max-h-[104px] rounded-lg"
					src={`${env.BASE_API_URL}/api/v1/uploads-version/${datasetVersionData?.pk}/download/`}
				/>
			</picture>
		</div>
	) : (
		<div className="bg-base-neutral-100 dark:bg-base-neutral-700 flex h-[104px] w-[104px] shrink-0 place-content-center place-items-center rounded-lg">
			<FileIcon aria-hidden className="text-base-neutral-300 dark:text-base-neutral-500" size={48} strokeWidth={1.5} />
		</div>
	);
}

export function FileUpdate(props: {
	readonly fileUuid: string;
	readonly folderUuid?: string | undefined;
	readonly isDraft?: boolean | undefined;
	readonly projectUuid?: string | undefined;
}) {
	const [queryState] = useQueryState('version', parseAsString);

	const { currentUserData } = useCurrentUser();

	const { messages } = useWebSocket();

	const { data: datasetData } = useSuspenseQuery(
		$api.queryOptions('get', '/api/v1/uploads-dataset/{id}/', {
			params: { path: { id: props.fileUuid } },
		}),
	);

	const [lockData, folderPermissionData, folderData] = useQueries({
		queries: [
			$api.queryOptions(
				'get',
				'/api/v1/uploads-dataset/{id}/status/',
				{
					params: { path: { id: props.fileUuid } },
				},
				{ enabled: Boolean(props.folderUuid) },
			),
			$api.queryOptions(
				'get',
				'/api/v1/folder-permission/',
				{
					params: { query: { folder: props.folderUuid ?? '', project_membership__member: currentUserData?.pk ?? -1 } },
				},
				{ enabled: Boolean(currentUserData?.pk && props.folderUuid) },
			),
			$api.queryOptions(
				'get',
				'/api/v1/folder/{id}/',
				{ params: { path: { id: props.folderUuid ?? '' } } },
				{ enabled: Boolean(props.folderUuid) },
			),
		],
	});

	const lockMessage = messages[props.fileUuid]?.find((message) => message.type === 'lock_status_changed')?.data;
	const isFileLocked = lockMessage?.status === undefined ? Boolean(lockData.data?.locked) : Boolean(lockMessage.status);

	const canUploadFiles =
		props.isDraft || folderPermissionData.data?.[0]?.is_folder_admin || folderPermissionData.data?.[0]?.can_edit;

	const isLatestVersionSelected = Boolean(!queryState || queryState === datasetData.latest_version?.pk);

	return canUploadFiles ? (
		<>
			<UpdateUploadDropZone
				className="hidden 2xl:block print:hidden"
				fileName={datasetData.display_name}
				fileUuid={props.fileUuid}
				folderName={folderData.data?.name}
				folderUuid={props.folderUuid}
				isDisabled={isFileLocked || !isLatestVersionSelected}
				projectUuid={props.projectUuid}
			>
				<div
					className={cx(
						'global-dropzone-border bg-base-lavender-100/64 dark:bg-base-lavender-800/64 flex h-full w-full flex-col place-content-center place-items-center gap-2 rounded-xl p-px px-6 group-disabled:bg-transparent',
						isFileLocked || !isLatestVersionSelected ? 'global-dropzone-border-disabled' : '',
					)}
				>
					<span className="text-base-lavender-600 dark:text-base-lavender-200 group-disabled:text-base-neutral-900/38 dark:group-disabled:text-base-neutral-40/38">
						Drag and drop to update this file or
					</span>
					<UpdateUploadTrigger
						fileUuid={props.fileUuid}
						folderName={folderData.data?.name}
						folderUuid={props.folderUuid}
						projectUuid={props.projectUuid}
					>
						<Button
							className="place-self-center"
							isDark
							isDisabled={isFileLocked || !isLatestVersionSelected}
							size="sm"
							variant="filled"
						>
							Select file
						</Button>
					</UpdateUploadTrigger>
				</div>
			</UpdateUploadDropZone>
			<UpdateUploadTrigger
				fileUuid={props.fileUuid}
				folderName={folderData.data?.name}
				folderUuid={props.folderUuid}
				projectUuid={props.projectUuid}
			>
				<Button
					className="place-self-end 2xl:hidden print:hidden"
					isDisabled={isFileLocked || !isLatestVersionSelected}
				>
					<FileInputIcon aria-hidden size={18} strokeWidth={1.5} /> Update file
				</Button>
			</UpdateUploadTrigger>
		</>
	) : null;
}

export function FileEditLockDialog({ fileUuid, ...props }: ModalOverlayProps & { readonly fileUuid: string }) {
	const { data: lockData } = useQuery(
		$api.queryOptions(
			'get',
			'/api/v1/uploads-dataset/{id}/status/',
			{
				params: { path: { id: fileUuid } },
			},
			{ enabled: Boolean(props.isOpen) },
		),
	);

	return (
		<ModalContent
			{...props}
			aria-label={`Item is currently being edited${lockData?.locked_by ? ` by ${lockData.locked_by.email}` : ''}.`}
			role="alertdialog"
		>
			<ModalHeader aria-hidden />
			<ModalBody>
				<div className="flex flex-col place-items-center gap-4">
					<EditInfoIcon />
					<div className="flex flex-col place-items-center gap-7">
						<span className="text-base-lg">
							Item is currently being edited
							{lockData?.locked_by ? (
								<>
									<br />
									<span className="text-base-label-lg">by {lockData.locked_by.email}</span>
								</>
							) : null}
							.
						</span>
						<span>Please try again later to avoid losing changes.</span>
					</div>
				</div>
			</ModalBody>
			<ModalFooter>
				<ModalClose variant="filled">Got it</ModalClose>
			</ModalFooter>
		</ModalContent>
	);
}

export function FileLockAlert({ fileUuid, ...props }: { readonly className?: string; readonly fileUuid: string }) {
	const queryClient = useQueryClient();

	const { currentUserData } = useCurrentUser();

	const { messages } = useWebSocket();

	const { data: lockData } = useSuspenseQuery(
		$api.queryOptions('get', '/api/v1/uploads-dataset/{id}/status/', {
			params: { path: { id: fileUuid } },
		}),
	);

	const lockMessage = messages[fileUuid]?.find((message) => message.type === 'lock_status_changed')?.data;
	const isLocked = lockMessage?.status === undefined ? Boolean(lockData.locked) : Boolean(lockMessage.status);
	const canUnlock = (lockData.locked_by?.email ?? lockMessage?.user) === currentUserData?.email;

	async function setUnlocked() {
		const { data } = await openAPIClient.POST('/api/v1/uploads-dataset/{id}/unlock/', {
			params: { path: { id: fileUuid } },
		});
		await queryClient.invalidateQueries({
			queryKey: $api.queryOptions('get', '/api/v1/uploads-dataset/{id}/status/', {
				params: { path: { id: fileUuid } },
			}).queryKey,
		});

		return data;
	}

	return isLocked ? (
		<div
			className={cx(
				'bg-base-tangerine-300 text-base-neutral-900 flex min-h-8 place-content-center place-items-center gap-4 rounded-lg px-4 py-2',
				props.className,
			)}
		>
			<div className="flex gap-2">
				<FileLock2Icon aria-hidden className="shrink-0" size={18} strokeWidth={1.5} />
				<span>
					Item is locked due to processing
					{(lockData.locked_by ?? lockMessage?.user) ? (
						<span>
							{' '}
							by <span className="text-base-label-md">{lockData.locked_by?.email ?? lockMessage.user}</span>
						</span>
					) : null}
					.
				</span>
			</div>
			{canUnlock ? (
				<Button isDark onPress={async () => setUnlocked()} size="sm" variant="filled">
					Unlock
				</Button>
			) : null}
		</div>
	) : null;
}

export function FileDeleteDialog({
	fileUuid,
	filename,
	redirectUrl,
	...props
}: ModalOverlayProps & { readonly fileUuid: string; readonly filename: string; readonly redirectUrl?: string }) {
	const router = useRouter();
	const queryClient = useQueryClient();

	const { mutate } = useMutation({
		mutationFn: async () => {
			const { data: datasetData, error } = await openAPIClient.DELETE('/api/v1/uploads-dataset/{id}/', {
				params: { path: { id: fileUuid } },
			});

			if (error) {
				throw new Error(formatErrorMessage(error));
			}

			return { data: datasetData };
		},
		async onSuccess() {
			props.onOpenChange?.(false);

			await queryClient.invalidateQueries({
				queryKey: $api.queryOptions('get', '/api/v1/uploads-dataset/').queryKey,
			});

			if (redirectUrl) {
				router.push(redirectUrl);
			}
		},
		onError(error) {
			window.scrollTo({ top: 0, behavior: 'instant' });
			console.error(error);
		},
	});

	return (
		<ModalContent {...props} role="alertdialog">
			<ModalHeader>Do you really want to delete item "{filename}"?</ModalHeader>
			<ModalBody>Upon confirmation, the item will be permanently deleted.</ModalBody>
			<ModalFooter>
				<ModalClose variant="secondary-discreet">Cancel</ModalClose>
				<Button onPress={() => mutate()} type="submit" variant="filled">
					<TrashIcon aria-hidden size={18} strokeWidth={1.5} /> Delete
				</Button>
			</ModalFooter>
		</ModalContent>
	);
}

export function BulkFileDeleteDialog({
	selected,
	redirectUrl,
	...props
}: ModalOverlayProps & { readonly redirectUrl?: string; readonly selected: string[] }) {
	const [_queryStates, setQueryStates] = useQueryStates({
		selected: parseAsArrayOf(parseAsString).withDefault([]),
	});
	const router = useRouter();
	const queryClient = useQueryClient();

	const { mutate } = useMutation({
		mutationFn: async () => {
			const { data: datasetData, error } = await openAPIClient.POST('/api/v1/uploads-dataset/bulk-delete/', {
				body: {
					uploads_datasets: selected,
				},
			});

			if (error) {
				throw new Error(formatErrorMessage(error));
			}

			return { data: datasetData };
		},
		async onSuccess() {
			props.onOpenChange?.(false);

			await queryClient.invalidateQueries({
				queryKey: $api.queryOptions('get', '/api/v1/uploads-dataset/').queryKey,
			});

			await setQueryStates({
				selected: [],
			});

			if (redirectUrl) {
				router.push(redirectUrl);
			}
		},
		onError(error) {
			window.scrollTo({ top: 0, behavior: 'instant' });
			console.error(error);
		},
	});

	return (
		<ModalContent {...props} role="alertdialog">
			<ModalHeader>Do you really want to bulk delete the selected items?</ModalHeader>
			<ModalBody>Upon confirmation, the items will be permanently deleted.</ModalBody>
			<ModalFooter>
				<ModalClose variant="secondary-discreet">Cancel</ModalClose>
				<Button onPress={() => mutate()} type="submit" variant="filled">
					<TrashIcon aria-hidden size={18} strokeWidth={1.5} /> Delete
				</Button>
			</ModalFooter>
		</ModalContent>
	);
}
