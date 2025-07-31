'use client';

import { format } from '@formkit/tempo';
import { valibotResolver } from '@hookform/resolvers/valibot';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAtomValue, useSetAtom } from 'jotai';
import {
	AlertCircleIcon,
	ArrowRightIcon,
	HistoryIcon,
	InfoIcon,
	LocateFixedIcon,
	MoreHorizontalIcon,
	PanelRightCloseIcon,
	PencilLineIcon,
	Undo2Icon,
	Wand2Icon,
	WholeWordIcon,
} from 'lucide-react';
import { parseAsString, useQueryState } from 'nuqs';
import { useState } from 'react';
import type { ModalOverlayProps } from 'react-aria-components';
import { Controller, useForm } from 'react-hook-form';
import { useMediaQuery } from 'usehooks-ts';
import type { InferInput } from 'valibot';
import { FileExpirationBadge, FileThumbnail } from '@/components/File';
import { MetadataValue } from '@/components/Metadata';
import { VersionHistoryBadge, VersionHistoryExitDialog } from '@/components/VersionHistory';
import { NotFoundIconNoSSR } from '@/components/icons/NotFoundIcon';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/Accordion';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Drawer, DrawerBody, DrawerClose, DrawerContent, DrawerTrigger } from '@/components/ui/Drawer';
import { dropdownItemStyles } from '@/components/ui/Dropdown';
import { GridList, GridListItem } from '@/components/ui/GridList';
import { Menu, MenuContent, MenuItem, MenuTrigger } from '@/components/ui/Menu';
import { ModalBody, ModalClose, ModalContent, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import { Sidebar, SidebarCloseIndicator, SidebarContent, SidebarHeader, useSidebar } from '@/components/ui/Sidebar';
import { Tag, TagGroup } from '@/components/ui/TagGroup';
import { TextField } from '@/components/ui/TextField';
import { globalToastQueue, ToastType } from '@/components/ui/Toast';
import { useWebSocket } from '@/contexts/WebSocket';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { VersionSchema } from '@/schemas/VersionSchema';
import { SideSheetMode, sideSheetModeAtom, sideSheetSelectedDatasetAtom } from '@/stores/sideSheet';
import { cx } from '@/styles/cva';
import { buttonStyles } from '@/styles/ui/button';
import { $api, openAPIClient } from '@/util/clientFetch';
import { convertDataRateLog } from '@/util/convertDataRate';
import { differenceInDays } from '@/util/differenceInDays';
import { formatErrorMessage } from '@/util/formatErrorMessage';
import { EditInfoIcon } from './icons/EditInfoIcon';

function useDatasetQuery(props: { readonly enabled: boolean; readonly fileUuid: string | null }) {
	const { data: datasetData, error: datasetError } = useQuery(
		$api.queryOptions(
			'get',
			'/api/v1/uploads-dataset/{id}/',
			{
				params: { path: { id: props.fileUuid ?? '' } },
			},
			{ enabled: Boolean(props.fileUuid && props.enabled) },
		),
	);

	const { data: datasetVersionData, error: versionError } = useQuery(
		$api.queryOptions(
			'get',
			'/api/v1/uploads-version/{id}/',
			{
				params: { path: { id: datasetData?.latest_version?.pk ?? '' } },
			},
			{ enabled: Boolean(datasetData?.latest_version?.pk) },
		),
	);

	const datasetOrVersionNotFound = Boolean(!datasetData || datasetError || versionError);

	return { datasetData, datasetVersionData, datasetOrVersionNotFound };
}

function useDatasetVersionQuery(props: { readonly enabled: boolean; readonly versionUuid: string | null }) {
	const { data: datasetVersionData, error: versionError } = useQuery(
		$api.queryOptions(
			'get',
			'/api/v1/uploads-version/{id}/',
			{
				params: { path: { id: props.versionUuid ?? '' } },
			},
			{ enabled: Boolean(props.versionUuid && props.enabled) },
		),
	);

	const datasetVersionNotFound = Boolean(!datasetVersionData || versionError);

	return { datasetVersionData, datasetVersionNotFound };
}

function useDatasetVersionsQuery(props: { readonly enabled: boolean; readonly fileUuid: string | null }) {
	// const { data: datasetVersionsData, error: datasetVersionsError } = useQuery({
	// 	queryKey: ['uploads-dataset', datasetUuid, 'versions'],
	// 	queryFn: async () => {
	// 		const { data } = await openAPIClient.GET('/api/v1/uploads-version/', {
	// 			params: {
	// 				query: {
	// 					dataset: datasetUuid ?? ',
	// 				},
	// 			},
	// 		});

	// 		return data;
	// 	},
	// 	enabled: Boolean(datasetUuid && enabled),
	// });

	const { data: datasetVersionsData, error: datasetVersionsError } = useQuery(
		$api.queryOptions(
			'get',
			'/api/v1/uploads-dataset/{id}/',
			{
				params: { path: { id: props.fileUuid ?? '' } },
			},
			{ enabled: Boolean(props.fileUuid && props.enabled) },
		),
	);

	const datasetVersionsNotFound = Boolean(!datasetVersionsData || datasetVersionsError);

	return {
		datasetData: datasetVersionsData,
		datasetVersionsData: datasetVersionsData?.uploads_versions,
		datasetVersionsNotFound,
	};
}

function SideSheetDatasetHeader() {
	const setSideSheetSelectedDataset = useSetAtom(sideSheetSelectedDatasetAtom);

	return (
		<div className="flex place-content-between place-items-center">
			<span className="flex place-items-center gap-2">
				<InfoIcon
					aria-hidden
					className="text-base-neutral-400 dark:text-base-neutral-500"
					size={24}
					strokeWidth={1.5}
				/>
				<span className="text-base-lg">File details</span>
			</span>
			<SidebarCloseIndicator onPress={() => setSideSheetSelectedDataset(null)} />
		</div>
	);
}

function SideSheetVersionHistoryHeader() {
	const isMobile = useMediaQuery('(max-width: 600px)', { initializeWithValue: false });
	const [isVersionHistoryExitDialogOpen, setIsVersionHistoryExitDialogOpen] = useState(false);
	const { setOpen } = useSidebar();

	return (
		<>
			<div className="flex place-content-between place-items-center">
				<span className={cx('flex place-items-center gap-2', isMobile && 'gap-4')}>
					{isMobile ? (
						<Button onPress={() => setOpen((open) => !open)} size="icon-sm" variant="filled">
							<PanelRightCloseIcon aria-hidden size={18} strokeWidth={1.5} />
						</Button>
					) : (
						<HistoryIcon
							aria-hidden
							className="text-base-neutral-400 dark:text-base-neutral-500"
							size={24}
							strokeWidth={1.5}
						/>
					)}
					<span className="text-base-lg">Version history</span>
				</span>
				<SidebarCloseIndicator
					isDismissable={false}
					onPress={() => setIsVersionHistoryExitDialogOpen(true)}
					slot={null}
				/>
			</div>
			<VersionHistoryExitDialog
				isOpen={isVersionHistoryExitDialogOpen}
				onOpenChange={setIsVersionHistoryExitDialogOpen}
			/>
		</>
	);
}

function SideSheetDatasetContent() {
	const sideSheetMode = useAtomValue(sideSheetModeAtom);
	const sideSheetSelectedDataset = useAtomValue(sideSheetSelectedDatasetAtom);

	const { datasetData, datasetVersionData, datasetOrVersionNotFound } = useDatasetQuery({
		enabled: sideSheetMode === SideSheetMode.Dataset,
		fileUuid: sideSheetSelectedDataset,
	});

	return datasetOrVersionNotFound ? (
		<div className="bg-base-neutral-60 dark:bg-base-neutral-700/32 flex flex-1 flex-col place-items-center gap-4 p-6 pt-44">
			<NotFoundIconNoSSR height={68} width={108} />
			<div className="flex flex-col gap-8">
				<div className="flex flex-col gap-2">
					<h1 className="text-base-xl text-center">Error 404: File not found</h1>
					<p className="text-center">This file is not available.</p>
				</div>
			</div>
		</div>
	) : (
		<div className="flex flex-col gap-6 p-6">
			<FileThumbnail fileUuid={datasetData!.pk} />

			{datasetData?.expiry_date && differenceInDays(datasetData.expiry_date) <= 14 ? (
				<FileExpirationBadge expirationDate={datasetData.expiry_date} />
			) : null}

			<div className="flex flex-col gap-4">
				<div className="flex flex-col gap-1">
					<span className="text-base-label-md text-base-neutral-600 dark:text-base-neutral-300">File name</span>
					<span className="break-all">{datasetVersionData?.version_file?.name ?? 'Loading ...'}</span>
				</div>
				<div className="flex flex-col gap-1">
					<span className="text-base-label-md text-base-neutral-600 dark:text-base-neutral-300">Version</span>
					<span>{datasetVersionData?.pk ?? '-'}</span>
				</div>
				<div className="flex flex-col gap-1">
					<span className="text-base-label-md text-base-neutral-600 dark:text-base-neutral-300">Path</span>
					<span>
						{convertDataRateLog(
							datasetVersionData?.metadata?.find((metadata) => metadata.custom_key === 'FILE_SIZE')?.value as
								| number
								| undefined,
						) ?? '-'}
					</span>
				</div>
				{datasetData?.folder ? (
					<div className="flex flex-col gap-1">
						<span className="text-base-label-md text-base-neutral-600 dark:text-base-neutral-300">Folder</span>
						<TagGroup aria-label="Project">
							<Tag
								className="cursor-pointer"
								href={`/projects/${datasetData?.folder.project.pk}/folders/${datasetData.folder.pk}`}
								target="_blank"
							>
								{datasetData.folder.name}
							</Tag>
						</TagGroup>
					</div>
				) : null}
			</div>
			<div className="flex flex-col gap-8">
				<Accordion collapsible defaultValue="file-metadata" type="single">
					<AccordionItem value="file-metadata">
						<AccordionTrigger className="text-base-label-md">File metadata</AccordionTrigger>
						<AccordionContent className="flex flex-col gap-2 px-1">
							{datasetVersionData?.version_file?.metadata?.map((metadata: any) => (
								<div className="flex flex-col gap-1" key={metadata.pk}>
									<span className="text-base-label-md text-base-neutral-600 dark:text-base-neutral-300 break-all">
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
				</Accordion>

				<Accordion collapsible defaultValue="additional-metadata" type="single">
					<AccordionItem value="additional-metadata">
						<AccordionTrigger className="text-base-label-md">Additional metadata</AccordionTrigger>
						<AccordionContent className="flex flex-col gap-2 px-1">
							{datasetVersionData?.metadata?.map((metadata) => (
								<div className="flex flex-col gap-1" key={metadata.pk}>
									<span className="text-base-label-md text-base-neutral-600 dark:text-base-neutral-300 break-all">
										{metadata.custom_key}
									</span>
									<MetadataValue field={metadata} />
								</div>
							)) ?? null}
						</AccordionContent>
					</AccordionItem>
				</Accordion>
			</div>
		</div>
	);
}

type VersionNameEditInput = InferInput<typeof VersionSchema>;

export function SideSheetMoreMenuEditVersionNameDialog({
	versionUuid,
	name,
	...props
}: ModalOverlayProps & { readonly name: string; readonly versionUuid: string }) {
	const sideSheetSelectedDataset = useAtomValue(sideSheetSelectedDatasetAtom);
	const queryClient = useQueryClient();

	const { datasetVersionData } = useDatasetVersionQuery({
		enabled: Boolean(props.isOpen),
		versionUuid,
	});

	const {
		control,
		handleSubmit,
		setError,
		clearErrors,
		formState: { errors },
	} = useForm<VersionNameEditInput>({
		resolver: valibotResolver(VersionSchema),
		defaultValues: {
			name,
		},
	});

	const { mutate } = useMutation({
		mutationFn: async (input: VersionNameEditInput) => {
			const { error: versionError, response: versionResponse } = await openAPIClient.PATCH(
				'/api/v1/uploads-version/{id}/',
				{
					params: { path: { id: versionUuid } },
					body: {
						name: input.name,
					},
				},
			);

			if (versionError) {
				throw new Error(formatErrorMessage(versionError, versionResponse));
			}
		},
		async onSuccess() {
			props.onOpenChange?.(false);

			await queryClient.invalidateQueries({
				queryKey: $api.queryOptions('get', '/api/v1/uploads-version/{id}/', {
					params: { path: { id: versionUuid } },
				}).queryKey,
			});

			if (sideSheetSelectedDataset) {
				await queryClient.invalidateQueries({
					queryKey: $api.queryOptions('get', '/api/v1/uploads-dataset/{id}/', {
						params: { path: { id: sideSheetSelectedDataset } },
					}).queryKey,
				});
			}

			await setUnlocked();
		},
		onError(error) {
			window.scrollTo({ top: 0, behavior: 'instant' });
			setError('root', {
				type: 'custom',
				message: error.message,
			});
		},
	});

	async function setUnlocked() {
		const { data } = await openAPIClient.POST('/api/v1/uploads-dataset/{id}/unlock/', {
			params: { path: { id: sideSheetSelectedDataset! } },
		});
		await queryClient.invalidateQueries({
			queryKey: $api.queryOptions('get', '/api/v1/uploads-dataset/{id}/status/', {
				params: { path: { id: sideSheetSelectedDataset! } },
			}).queryKey,
		});

		return data;
	}

	return (
		<ModalContent {...props} aria-label={`Edit name for "${name}"`} isKeyboardDismissDisabled role="alertdialog">
			<form onSubmit={handleSubmit((input) => mutate(input))}>
				<ModalHeader aria-hidden />
				<ModalBody>
					{errors.root && (
						<Alert>
							<AlertCircleIcon aria-hidden size={24} strokeWidth={1.5} />
							{errors.root?.message}
						</Alert>
					)}

					<div className="flex flex-row flex-wrap place-content-between place-items-center gap-2">
						<VersionHistoryBadge
							className="max-w-[60ch]"
							fileUuid={sideSheetSelectedDataset!}
							versionUuid={versionUuid}
						/>
						<span className="text-base-xs text-base-neutral-600 dark:text-base-neutral-300">
							{datasetVersionData?.created_by.email} –{' '}
							{format(datasetVersionData?.creation_date ?? new Date(), 'MMM D, YYYY hh:mm', 'en')}
						</span>
					</div>

					<Controller
						control={control}
						name="name"
						render={({ field, fieldState }) => (
							<TextField
								autoComplete="off"
								autoFocus
								errorMessage={fieldState.error?.message}
								isClearable
								isDisabled={field.disabled ?? false}
								isInvalid={fieldState.invalid}
								label="Version name (optional)"
								onBlur={field.onBlur}
								onChange={field.onChange}
								placeholder="Name this version"
								type="text"
								value={field.value ?? ''}
							/>
						)}
					/>
				</ModalBody>
				<ModalFooter>
					<ModalClose
						onPress={async () => {
							clearErrors();
							await setUnlocked();
						}}
						variant="secondary-discreet"
					>
						Cancel
					</ModalClose>
					<Button type="submit" variant="filled">
						Save changes
					</Button>
				</ModalFooter>
			</form>
		</ModalContent>
	);
}

export function SideSheetVersionHistoryVersionEditLockDialog({
	fileUuid,
	...props
}: ModalOverlayProps & { readonly fileUuid: string }) {
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

	console.log(lockData);

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

function SideSheetVersionHistoryMoreMenu(props: {
	readonly className?: string;
	readonly fileUuid: string;
	readonly folderUuid: string;
	readonly isDraft: boolean;
	readonly isRestorable: boolean;
	readonly versionUuid: string;
}) {
	const [, setQueryState] = useQueryState('version', parseAsString);
	const isMobile = useMediaQuery('(max-width: 600px)', { initializeWithValue: false });
	const [isOpen, setIsOpen] = useState(false);
	const [isEditNameOpen, setIsEditNameOpen] = useState(false);
	const [isEditLockOpen, setIsEditLockOpen] = useState(false);
	const queryClient = useQueryClient();

	const { currentUserData } = useCurrentUser();

	const { messages } = useWebSocket();

	const { data: lockData } = useQuery(
		$api.queryOptions(
			'get',
			'/api/v1/uploads-dataset/{id}/status/',
			{
				params: { path: { id: props.fileUuid } },
			},
			{ enabled: isOpen },
		),
	);

	const lockMessage = messages[props.fileUuid]?.find((message) => message.type === 'lock_status_changed')?.data;
	const isFileLocked = lockMessage?.status === undefined ? Boolean(lockData?.locked) : Boolean(lockMessage.status);

	const { datasetVersionData } = useDatasetVersionQuery({
		enabled: isEditNameOpen,
		versionUuid: props.versionUuid,
	});

	const { data: folderPermissionData } = useQuery(
		$api.queryOptions(
			'get',
			'/api/v1/folder-permission/',
			{
				params: {
					query: { folder: props.folderUuid, project_membership__member: currentUserData?.pk ?? -1 },
				},
			},
			{ enabled: Boolean(isOpen && currentUserData?.pk) },
		),
	);

	const canEdit = props.isDraft || folderPermissionData?.[0]?.is_folder_admin || folderPermissionData?.[0]?.can_edit;

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

	async function restoreVersion() {
		const { data: datasetVersionData } = await openAPIClient.POST('/api/v1/uploads-dataset/{id}/restore/', {
			params: { path: { id: props.fileUuid } },
			body: {
				uploads_version: props.versionUuid,
			},
		});

		await queryClient.invalidateQueries({
			queryKey: $api.queryOptions('get', '/api/v1/uploads-dataset/{id}/', {
				params: { path: { id: props.fileUuid } },
			}).queryKey,
		});

		await setQueryState(datasetVersionData?.pk ?? null);

		globalToastQueue.add({ message: 'Version successfully restored.', type: ToastType.Success }, { timeout: 5_000 });
	}

	return (
		<>
			{isMobile ? (
				<div>
					<Drawer isOpen={isOpen} onOpenChange={setIsOpen} withNotch={false}>
						<DrawerTrigger aria-label="More menu" isDisabled={!canEdit} size="icon-xs" variant="discreet">
							<MoreHorizontalIcon aria-hidden size={18} strokeWidth={1.5} />
						</DrawerTrigger>
						<DrawerContent aria-label="More menu">
							<DrawerBody>
								<DrawerClose
									aria-label="Rename version"
									className={dropdownItemStyles({ className: 'text-base-sm flex place-content-start gap-2' })}
									id="rename-version"
									onPress={async () => {
										const status = await isLocked();
										if (status?.locked) {
											setIsEditLockOpen(true);
										} else {
											await setLocked();
											setIsEditNameOpen(true);
										}
									}}
									variant="unset"
								>
									{datasetVersionData?.name ? (
										<>
											<PencilLineIcon aria-hidden size={18} strokeWidth={1.5} /> Rename version
										</>
									) : (
										<>
											<WholeWordIcon aria-hidden size={18} strokeWidth={1.5} /> Name version
										</>
									)}
								</DrawerClose>
								{props.isRestorable ? (
									<DrawerClose
										aria-label="Restore"
										className={dropdownItemStyles({ className: 'text-base-sm flex place-content-start gap-2' })}
										id="restore"
										isDisabled={isFileLocked}
										onPress={async () => restoreVersion()}
										variant="unset"
									>
										<Undo2Icon aria-hidden size={18} strokeWidth={1.5} /> Restore
									</DrawerClose>
								) : null}
							</DrawerBody>
						</DrawerContent>
					</Drawer>
				</div>
			) : (
				<Menu isOpen={isOpen} onOpenChange={setIsOpen}>
					<MenuTrigger
						aria-label="More menu"
						className={cx(
							'pressed:outline-2 pressed:outline-offset-2 pressed:outline-base-lavender-400 dark:pressed:outline-base-lavender-600',
							props.className,
						)}
						isDisabled={!canEdit}
						size="icon-xs"
						variant="discreet"
					>
						<MoreHorizontalIcon aria-hidden size={18} strokeWidth={1.5} />
					</MenuTrigger>
					<MenuContent placement="bottom">
						<MenuItem
							aria-label="Rename version"
							id="rename-version"
							onAction={async () => {
								const status = await isLocked();
								if (status?.locked) {
									setIsEditLockOpen(true);
								} else {
									await setLocked();
									setIsEditNameOpen(true);
								}
							}}
						>
							{datasetVersionData?.name ? (
								<>
									<PencilLineIcon aria-hidden size={18} strokeWidth={1.5} /> Rename version
								</>
							) : (
								<>
									<WholeWordIcon aria-hidden size={18} strokeWidth={1.5} /> Name version
								</>
							)}
						</MenuItem>
						{props.isRestorable ? (
							<MenuItem
								aria-label="Restore"
								id="restore"
								isDisabled={isFileLocked}
								onAction={async () => restoreVersion()}
							>
								<Undo2Icon aria-hidden size={18} strokeWidth={1.5} /> Restore
							</MenuItem>
						) : null}
					</MenuContent>
				</Menu>
			)}
			<SideSheetMoreMenuEditVersionNameDialog
				isOpen={isEditNameOpen}
				name={datasetVersionData?.name ?? ''}
				onOpenChange={setIsEditNameOpen}
				versionUuid={props.versionUuid}
			/>
			<SideSheetVersionHistoryVersionEditLockDialog
				fileUuid={props.fileUuid}
				isOpen={isEditLockOpen}
				onOpenChange={setIsEditLockOpen}
			/>
		</>
	);
}

function SideSheetVersionHistoryContent() {
	const [queryState, setQueryState] = useQueryState('version', parseAsString);
	const sideSheetMode = useAtomValue(sideSheetModeAtom);
	const sideSheetSelectedDataset = useAtomValue(sideSheetSelectedDatasetAtom);

	const { datasetData, datasetVersionsData } = useDatasetVersionsQuery({
		enabled: sideSheetMode === SideSheetMode.VersionHistory,
		fileUuid: sideSheetSelectedDataset,
	});

	return (
		<div className="flex flex-col p-5">
			<GridList
				aria-label="Version history"
				defaultSelectedKeys={[queryState ?? datasetData?.latest_version?.pk ?? '']}
			>
				{datasetVersionsData?.map((version, index, array) => {
					const isFirstItem = index === 0;
					const isLastItem = index === array.length - 1;
					const isCurrentVersion = version.pk === (queryState ?? datasetData?.latest_version?.pk);

					return (
						<GridListItem
							className="not-last:pb-4 focus-visible:outline-0"
							id={version.pk}
							key={version.pk}
							onAction={async () => setQueryState(version.pk)}
							textValue={`${isFirstItem ? 'Current: ' : isLastItem ? 'Created: ' : ''}${format(version.creation_date, 'MMM D, YYYY hh:mm', 'en')} ${version.pk}`}
						>
							<div className="relative ml-9 flex flex-1">
								<div className="bg-base-neutral-100 dark:bg-base-neutral-700 absolute top-6 -left-[24.5px] h-[calc(100%-8px)] w-px group-last:hidden" />
								{isFirstItem ? (
									<div
										aria-hidden
										className={buttonStyles({
											size: 'icon-xs',
											variant: 'unset',
											className: cx(
												'text-base-neutral-600 dark:text-base-neutral-300 absolute top-0 -left-9',
												isCurrentVersion &&
													'bg-base-crystal-500 dark:bg-base-crystal-300 text-base-neutral-900 dark:text-base-neutral-900',
											),
										})}
									>
										<LocateFixedIcon aria-hidden size={18} strokeWidth={1.5} />
									</div>
								) : isLastItem ? (
									<div
										aria-hidden
										className={buttonStyles({
											size: 'icon-xs',
											variant: 'unset',
											className: cx(
												'text-base-neutral-600 dark:text-base-neutral-300 absolute top-0 -left-9',
												isCurrentVersion &&
													'bg-base-crystal-500 dark:bg-base-crystal-300 text-base-neutral-900 dark:text-base-neutral-900',
											),
										})}
									>
										<Wand2Icon aria-hidden size={18} strokeWidth={1.5} />
									</div>
								) : isCurrentVersion ? (
									<div
										aria-hidden
										className={buttonStyles({
											size: 'icon-xs',
											variant: 'unset',
											className: cx(
												'text-base-neutral-600 dark:text-base-neutral-300 absolute top-0 -left-9',
												isCurrentVersion &&
													'bg-base-crystal-500 dark:bg-base-crystal-300 text-base-neutral-900 dark:text-base-neutral-900',
											),
										})}
									>
										<ArrowRightIcon aria-hidden size={18} strokeWidth={1.5} />
									</div>
								) : (
									<>
										<div
											aria-hidden
											className="bg-base-neutral-100 dark:bg-base-neutral-700 absolute -top-1 -left-[24.5px] h-10 w-px group-last:hidden"
										/>
										<div
											aria-hidden
											className={buttonStyles({
												size: 'icon-xs',
												variant: 'unset',
												className: 'absolute top-0 -left-9',
											})}
										>
											<div aria-hidden className="bg-base-neutral-500 dark:text-base-neutral-300 size-1 rounded-full" />
										</div>
									</>
								)}
								<div
									className={buttonStyles({
										variant: 'unset',
										className: cx(
											'flex flex-1 flex-col place-items-start gap-1 rounded-sm px-2 pt-1 pb-2 group-focus-visible:outline-2 focus-visible:outline-0',
											isCurrentVersion
												? 'bg-base-crystal-100/64 dark:bg-base-crystal-800/64'
												: 'hover:bg-base-neutral-100/64 dark:hover:bg-base-neutral-700/64',
										),
									})}
								>
									{version.name ? (
										<span className="text-base-label-md line-clamp-3">
											{isFirstItem ? 'Current: ' : isLastItem ? 'Created: ' : ''}
											{version.name}
										</span>
									) : (
										<span className="text-base-label-md">
											{isFirstItem ? 'Current: ' : isLastItem ? 'Created: ' : ''}
											{format(version.creation_date, 'MMM D, YYYY hh:mm', 'en')}
										</span>
									)}
									<div className="flex flex-col gap-1">
										{version.name ? (
											<span className="text-base-xs text-left">
												{format(version.creation_date, 'MMM D, YYYY hh:mm', 'en')}
											</span>
										) : null}
										<span
											className={cx(
												'text-base-neutral-600 dark:text-base-neutral-300 text-base-xs text-left',
												isCurrentVersion && 'text-base-neutral-600 dark:text-base-neutral-200',
											)}
										>
											{version.pk}
										</span>
									</div>
								</div>
							</div>
							<SideSheetVersionHistoryMoreMenu
								fileUuid={datasetData?.pk ?? ''}
								folderUuid={datasetData?.folder?.pk ?? ''}
								isDraft={!datasetData?.is_published}
								isRestorable={!isFirstItem}
								versionUuid={version.pk}
							/>
						</GridListItem>
					);
				})}
			</GridList>
		</div>
	);
}

export function SideSheet() {
	const isProductionEnvironment =
		typeof window !== 'undefined' && window.location.href.startsWith('https://datatagger.domain.com');

	const sideSheetMode = useAtomValue(sideSheetModeAtom);

	return (
		<Sidebar className="rounded-tl-2xl print:hidden" closeButton={false} side="right">
			<SidebarHeader
				className={cx(
					'relative rounded-tl-2xl',
					!isProductionEnvironment &&
						'before:bg-base-tangerine-500 before:absolute before:top-0 before:-left-1 before:-z-1 before:size-9',
				)}
				hasBorder
			>
				{sideSheetMode === SideSheetMode.Dataset ? <SideSheetDatasetHeader /> : <SideSheetVersionHistoryHeader />}
			</SidebarHeader>
			<SidebarContent className="p-0">
				{sideSheetMode === SideSheetMode.Dataset ? <SideSheetDatasetContent /> : <SideSheetVersionHistoryContent />}
			</SidebarContent>
		</Sidebar>
	);
}
