'use client';

import { format } from '@formkit/tempo';
import { valibotResolver } from '@hookform/resolvers/valibot';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAtomValue, useSetAtom } from 'jotai';
import {
	AlertCircleIcon,
	ArrowRightIcon,
	BlocksIcon,
	FileWarningIcon,
	HistoryIcon,
	InfoIcon,
	LocateFixedIcon,
	MoreHorizontalIcon,
	PanelRightCloseIcon,
	PencilLineIcon,
	Undo2Icon,
	Wand2Icon,
	WholeWordIcon,
	XCircleIcon,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { parseAsString, useQueryState } from 'nuqs';
import { useEffect, useState, type ReactNode } from 'react';
import { type ModalOverlayProps } from 'react-aria-components';
import { Controller, useForm } from 'react-hook-form';
import { useMediaQuery } from 'usehooks-ts';
import type { InferInput } from 'valibot';
import { EditLockDialog } from '@/components/EditLockDialog';
import { FileExpirationBadge, FileThumbnail } from '@/components/File';
import { FileVersionHistoryBadge, FileVersionHistoryExitDialog } from '@/components/FileVersionHistory';
import { MetadataValue } from '@/components/Metadata';
import { NotFoundIconNoSSR } from '@/components/icons/NotFoundIcon';
import {
	MetadataTemplateVersionHistoryBadge,
	MetadataTemplateVersionHistoryExitDialog,
} from '@/components/metadata-template/MetadataTemplateVersionHistory';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/Accordion';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Drawer, DrawerBody, DrawerClose, DrawerContent, DrawerTrigger } from '@/components/ui/Drawer';
import { dropdownItemStyles } from '@/components/ui/Dropdown';
import { FieldError, Label } from '@/components/ui/Field';
import { Form, useDialogForm } from '@/components/ui/Form';
import { GridList, GridListItem } from '@/components/ui/GridList';
import { Input, InputGroup } from '@/components/ui/Input';
import { Link } from '@/components/ui/Link';
import { Menu, MenuContent, MenuItem, MenuTrigger } from '@/components/ui/Menu';
import { ModalBody, ModalClose, ModalContent, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import { Sidebar, SidebarCloseIndicator, SidebarContent, SidebarHeader, useSidebar } from '@/components/ui/Sidebar';
import { Tag, TagGroup } from '@/components/ui/TagGroup';
import { TextField } from '@/components/ui/TextField';
import { globalToastQueue, ToastType } from '@/components/ui/Toast';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/Tooltip';
import { useWebSocketMessages } from '@/contexts/WebSocket';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { VersionSchema } from '@/schemas/VersionSchema';
import {
	SideSheetMode,
	sideSheetModeAtom,
	sideSheetSelectedDatasetAtom,
	sideSheetSelectedMetadataTemplateContainerAtom,
} from '@/stores/sideSheet';
import { cx } from '@/styles/cva';
import { buttonStyles } from '@/styles/ui/button';
import { $api, openAPIClient } from '@/util/clientFetch';
import { convertDataRateLog } from '@/util/convertDataRate';
import { differenceInDays } from '@/util/differenceInDays';
import { formatErrorMessage } from '@/util/formatErrorMessage';
import { logger, LogCategory } from '@/util/logger';

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

	const { data: datasetVersionData, error: datasetVersionError } = useQuery(
		$api.queryOptions(
			'get',
			'/api/v1/uploads-version/{id}/',
			{
				params: { path: { id: datasetData?.latest_version?.pk ?? '' } },
			},
			{ enabled: Boolean(datasetData?.latest_version?.pk) },
		),
	);

	const datasetOrVersionNotFound = Boolean(!datasetData || datasetError || datasetVersionError);

	return { datasetData, datasetVersionData, datasetOrVersionNotFound };
}

function useDatasetVersionQuery(props: { readonly enabled: boolean; readonly versionUuid: string | null }) {
	const { data: datasetVersionData, error: datasetVersionError } = useQuery(
		$api.queryOptions(
			'get',
			'/api/v1/uploads-version/{id}/',
			{
				params: { path: { id: props.versionUuid ?? '' } },
			},
			{ enabled: Boolean(props.versionUuid && props.enabled) },
		),
	);

	const datasetVersionNotFound = Boolean(!datasetVersionData || datasetVersionError);

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

function useMetadataTemplateVersionQuery(props: { readonly enabled: boolean; readonly versionUuid: string | null }) {
	const { data: metadataTemplateVersionData, error: metadataTemplateVersionError } = useQuery(
		$api.queryOptions(
			'get',
			'/api/v1/metadata-template/{id}/',
			{
				params: { path: { id: props.versionUuid ?? '' } },
			},
			{ enabled: Boolean(props.versionUuid && props.enabled) },
		),
	);

	const metadataTemplateVersionNotFound = Boolean(!metadataTemplateVersionData || metadataTemplateVersionError);

	return { metadataTemplateVersionData, metadataTemplateVersionNotFound };
}

function useMetadataTemplateVersionsQuery(props: {
	readonly enabled: boolean;
	readonly metadataTemplateContainerUuid: string | null;
}) {
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

	const { data: metadataTemplateVersionsData, error: metadataTemplateVersionsError } = useQuery(
		$api.queryOptions(
			'get',
			'/api/v1/metadata-template-container/{id}/',
			{
				params: { path: { id: props.metadataTemplateContainerUuid ?? '' } },
			},
			{ enabled: Boolean(props.metadataTemplateContainerUuid && props.enabled) },
		),
	);

	const metadataTemplateVersionsNotFound = Boolean(!metadataTemplateVersionsData || metadataTemplateVersionsError);

	return {
		metadataTemplateData: metadataTemplateVersionsData,
		metadataTemplateVersionsData: metadataTemplateVersionsData?.metadata_templates,
		metadataTemplateVersionsNotFound,
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
	const sideSheetMode = useAtomValue(sideSheetModeAtom);
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
			{sideSheetMode === SideSheetMode.FileVersionHistory ? (
				<FileVersionHistoryExitDialog
					isOpen={isVersionHistoryExitDialogOpen}
					onOpenChange={setIsVersionHistoryExitDialogOpen}
				/>
			) : sideSheetMode === SideSheetMode.MetadataTemplateVersionHistory ? (
				<MetadataTemplateVersionHistoryExitDialog
					isOpen={isVersionHistoryExitDialogOpen}
					onOpenChange={setIsVersionHistoryExitDialogOpen}
				/>
			) : null}
		</>
	);
}

function SideSheetDatasetContent() {
	const sideSheetMode = useAtomValue(sideSheetModeAtom);
	const sideSheetSelectedDataset = useAtomValue(sideSheetSelectedDatasetAtom);
	const [fileMetadataExpanded, setFileMetadataExpanded] = useState<string[]>([]);

	const { datasetData, datasetVersionData, datasetOrVersionNotFound } = useDatasetQuery({
		enabled: sideSheetMode === SideSheetMode.Dataset,
		fileUuid: sideSheetSelectedDataset,
	});

	useEffect(() => {
		if (datasetVersionData?.version_file?.metadata?.length) {
			setFileMetadataExpanded((oldState) =>
				oldState.includes('file-metadata') ? oldState : [...oldState, 'file-metadata'],
			);
		} else {
			setFileMetadataExpanded((oldState) =>
				oldState.includes('file-metadata') ? oldState.filter((item) => item !== 'file-metadata') : oldState,
			);
		}
	}, [datasetVersionData?.version_file?.metadata?.length]);

	useEffect(() => {
		if (datasetVersionData?.metadata?.length) {
			setFileMetadataExpanded((oldState) =>
				oldState.includes('additional-metadata') ? oldState : [...oldState, 'additional-metadata'],
			);
		} else {
			setFileMetadataExpanded((oldState) =>
				oldState.includes('additional-metadata') ? oldState.filter((item) => item !== 'additional-metadata') : oldState,
			);
		}
	}, [datasetVersionData?.metadata?.length]);

	return datasetOrVersionNotFound ? (
		<div className="flex flex-1 flex-col place-items-center gap-4 bg-base-neutral-60 p-6 pt-44 dark:bg-base-neutral-700/32">
			<NotFoundIconNoSSR height={68} width={108} />
			<div className="flex flex-col gap-8">
				<div className="flex flex-col gap-2">
					<h1 className="text-center text-base-xl">Error 404: File not found</h1>
					<p className="text-center">This file is not available.</p>
				</div>
			</div>
		</div>
	) : (
		<div className="flex flex-col gap-6 p-6">
			{datasetVersionData?.version_file ? (
				<FileThumbnail fileUuid={datasetData!.pk} />
			) : (
				<div className="flex w-full place-content-center place-items-center gap-2 rounded-lg bg-base-tangerine-100/62 py-10 dark:bg-base-tangerine-800/64">
					<FileWarningIcon
						aria-hidden
						className="shrink-0 text-base-tangerine-800 dark:text-base-tangerine-100"
						size={24}
						strokeWidth={1.5}
					/>
					<span className="text-base-label-md text-base-tangerine-800 dark:text-base-tangerine-100">
						File is missing
					</span>
				</div>
			)}

			{datasetData?.expiry_date && differenceInDays(datasetData.expiry_date) <= 14 ? (
				<FileExpirationBadge expirationDate={datasetData.expiry_date} />
			) : null}

			<div className="flex flex-col gap-4">
				<div className="flex flex-col gap-1">
					<span className="text-base-label-md text-base-neutral-600 dark:text-base-neutral-300">File name</span>
					<span className="break-all">{datasetData?.display_name ?? 'Loading ...'}</span>
				</div>
				{datasetVersionData ? (
					<div className="flex flex-col gap-1">
						<span className="text-base-label-md text-base-neutral-600 dark:text-base-neutral-300">Version</span>
						<span>{datasetVersionData?.pk ?? '-'}</span>
					</div>
				) : null}
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
								className="h-auto min-h-6 cursor-pointer"
								href={`/projects/${datasetData?.folder.project.pk}/folders/${datasetData.folder.pk}`}
								target="_blank"
							>
								{datasetData.folder.name}
							</Tag>
						</TagGroup>
					</div>
				) : null}
			</div>
			<Accordion
				className="flex flex-col gap-8"
				disabled={!datasetVersionData?.metadata?.length && !datasetVersionData?.version_file?.metadata?.length}
				onValueChange={setFileMetadataExpanded}
				type="multiple"
				value={fileMetadataExpanded}
			>
				<AccordionItem value="file-metadata">
					<AccordionTrigger className="text-base-label-md">File metadata</AccordionTrigger>
					<AccordionContent className="flex flex-col gap-2 px-1">
						{datasetVersionData?.version_file?.metadata?.map((metadata: any) => (
							<div className="flex flex-col gap-1" key={metadata.pk}>
								<span className="text-base-label-md break-all text-base-neutral-600 dark:text-base-neutral-300">
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
				<AccordionItem value="additional-metadata">
					<AccordionTrigger className="text-base-label-md">Additional metadata</AccordionTrigger>
					<AccordionContent className="flex flex-col gap-2 px-1">
						{datasetVersionData?.metadata?.map((metadata) => (
							<div className="flex flex-col gap-1" key={metadata.pk}>
								<span className="flex place-items-center gap-2 text-base-label-md break-all text-base-neutral-600 dark:text-base-neutral-300">
									{metadata.custom_key}
									{metadata.metadata_template ? (
										<Tooltip delay={400}>
											<TooltipTrigger variant="tooltip">
												<Link
													href={`/metadata-templates/${metadata.metadata_template.metadata_template_container.pk}?version=${metadata.metadata_template.pk}`}
													target="_blank"
												>
													<BlocksIcon
														aria-hidden
														className="text-base-crystal-500 dark:text-base-crystal-300"
														size={18}
														strokeWidth={1.5}
													/>
												</Link>
											</TooltipTrigger>
											<TooltipContent className="flex place-items-center gap-2" arrow={false} variant="rich">
												<BlocksIcon aria-hidden size={18} strokeWidth={1.5} />
												{metadata.metadata_template.metadata_template_container.name}
											</TooltipContent>
										</Tooltip>
									) : null}
								</span>
								<MetadataValue field={metadata} hasMissingIndicator />
							</div>
						)) ?? null}
					</AccordionContent>
				</AccordionItem>
			</Accordion>
		</div>
	);
}

type VersionNameEditInput = InferInput<typeof VersionSchema>;

export function SideSheetMoreMenuEditVersionNameDialog({
	versionUuid,
	name,
	...props
}: ModalOverlayProps & { readonly name: string; readonly versionUuid: string }) {
	const sideSheetMode = useAtomValue(sideSheetModeAtom);
	const sideSheetSelectedDataset = useAtomValue(sideSheetSelectedDatasetAtom);
	const sideSheetSelectedMetadataTemplateContainer = useAtomValue(sideSheetSelectedMetadataTemplateContainerAtom);
	const queryClient = useQueryClient();

	const { datasetVersionData } = useDatasetVersionQuery({
		enabled: Boolean(props.isOpen) && sideSheetMode === SideSheetMode.FileVersionHistory,
		versionUuid,
	});

	const { metadataTemplateVersionData } = useMetadataTemplateVersionQuery({
		enabled: Boolean(props.isOpen) && sideSheetMode === SideSheetMode.MetadataTemplateVersionHistory,
		versionUuid,
	});

	const versionHistoryData =
		sideSheetMode === SideSheetMode.FileVersionHistory ? datasetVersionData : metadataTemplateVersionData;

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
				sideSheetMode === SideSheetMode.FileVersionHistory
					? '/api/v1/uploads-version/{id}/'
					: '/api/v1/metadata-template/{id}/',
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

			if (sideSheetMode === SideSheetMode.FileVersionHistory) {
				await queryClient.invalidateQueries({
					queryKey: $api.queryOptions('get', '/api/v1/uploads-version/{id}/', {
						params: { path: { id: versionUuid } },
					}).queryKey,
				});
			} else if (sideSheetMode === SideSheetMode.MetadataTemplateVersionHistory) {
				await queryClient.invalidateQueries({
					queryKey: $api.queryOptions('get', '/api/v1/metadata-template/{id}/', {
						params: { path: { id: versionUuid } },
					}).queryKey,
				});
			}

			if (sideSheetSelectedDataset) {
				await queryClient.invalidateQueries({
					queryKey: $api.queryOptions('get', '/api/v1/uploads-dataset/{id}/', {
						params: { path: { id: sideSheetSelectedDataset } },
					}).queryKey,
				});
			} else if (sideSheetSelectedMetadataTemplateContainer) {
				await queryClient.invalidateQueries({
					queryKey: $api.queryOptions('get', '/api/v1/metadata-template-container/{id}/', {
						params: { path: { id: sideSheetSelectedMetadataTemplateContainer! } },
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
		if (sideSheetMode === SideSheetMode.FileVersionHistory) {
			const { data } = await openAPIClient.POST('/api/v1/uploads-dataset/{id}/unlock/', {
				params: { path: { id: sideSheetSelectedDataset! } },
			});

			await queryClient.invalidateQueries({
				queryKey: $api.queryOptions('get', '/api/v1/uploads-dataset/{id}/status/', {
					params: { path: { id: sideSheetSelectedDataset! } },
				}).queryKey,
			});

			return data;
		} else if (sideSheetMode === SideSheetMode.MetadataTemplateVersionHistory) {
			const { data } = await openAPIClient.POST('/api/v1/metadata-template-container/{id}/unlock/', {
				params: { path: { id: sideSheetSelectedMetadataTemplateContainer! } },
			});
			await queryClient.invalidateQueries({
				queryKey: $api.queryOptions('get', '/api/v1/metadata-template-container/{id}/status/', {
					params: { path: { id: sideSheetSelectedMetadataTemplateContainer! } },
				}).queryKey,
			});

			return data;
		}

		return null;
	}

	const { formProps, submitButtonProps } = useDialogForm('side-sheet-version-history-edit-name');

	return (
		<ModalContent {...props} aria-label={`Edit name for "${name}"`} isKeyboardDismissDisabled role="alertdialog">
			<ModalHeader aria-hidden />
			<ModalBody>
				<Form {...formProps} onSubmit={handleSubmit((input) => mutate(input))}>
					{errors.root && (
						<Alert className="mb-6">
							<AlertCircleIcon aria-hidden className="shrink-0" size={24} strokeWidth={1.5} />
							{errors.root?.message}
						</Alert>
					)}

					<div className="flex flex-row flex-wrap place-content-between place-items-center gap-2">
						{sideSheetMode === SideSheetMode.FileVersionHistory ? (
							<FileVersionHistoryBadge
								className="max-w-[60ch]"
								fileUuid={sideSheetSelectedDataset!}
								versionUuid={versionUuid}
							/>
						) : sideSheetMode === SideSheetMode.MetadataTemplateVersionHistory ? (
							<MetadataTemplateVersionHistoryBadge
								className="max-w-[60ch]"
								metadataTemplateContainerUuid={sideSheetSelectedMetadataTemplateContainer!}
								versionUuid={versionUuid}
							/>
						) : null}
						<span className="text-base-xs text-base-neutral-600 dark:text-base-neutral-300">
							{versionHistoryData?.created_by.email} –{' '}
							{format(versionHistoryData?.creation_date ?? new Date(), 'MMM D, YYYY hh:mm', 'en')}
						</span>
					</div>

					<Controller
						control={control}
						name="name"
						render={({ field, fieldState }) => (
							<TextField isDisabled={field.disabled ?? false} isInvalid={fieldState.invalid}>
								<Label htmlFor="version-name">Version name (optional)</Label>
								<InputGroup>
									<Input
										autoComplete="off"
										autoFocus
										id="version-name"
										onBlur={field.onBlur}
										onChange={field.onChange}
										placeholder="Name this version"
										type="text"
										value={field.value ?? ''}
									/>
									{field.value && !field.disabled && (
										<Button
											aria-label="Clear version name"
											onPress={() => field.onChange('')}
											size="icon"
											variant="unset"
										>
											<XCircleIcon aria-hidden className="size-6 shrink-0 stroke-[1.5]" />
										</Button>
									)}
								</InputGroup>
								{fieldState.error?.message && <FieldError>{fieldState.error.message}</FieldError>}
							</TextField>
						)}
					/>
				</Form>
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
				<Button {...submitButtonProps} variant="filled">
					Save changes
				</Button>
			</ModalFooter>
		</ModalContent>
	);
}

export function SideSheetVersionHistoryVersionEditLockDialog({
	fileUuid,
	...props
}: ModalOverlayProps & { readonly fileUuid: string }) {
	const sideSheetMode = useAtomValue(sideSheetModeAtom);

	const { data: lockData } = useQuery(
		$api.queryOptions(
			'get',
			sideSheetMode === SideSheetMode.FileVersionHistory
				? '/api/v1/uploads-dataset/{id}/status/'
				: '/api/v1/metadata-template-container/{id}/status/',
			{
				params: { path: { id: fileUuid } },
			},
			{ enabled: Boolean(props.isOpen) },
		),
	);

	return <EditLockDialog {...props} lockedByEmail={lockData?.locked_by?.email} />;
}

type SideSheetVersionHistoryMoreMenuAction = {
	readonly ariaLabel: string;
	readonly id: 'rename-version' | 'restore';
	readonly icon: ReactNode;
	readonly isDisabled?: boolean;
	readonly label: string;
	onAction(): Promise<void>;
};

function SideSheetVersionHistoryMoreMenu(props: {
	readonly className?: string | undefined;
	readonly fileUuid?: string | undefined;
	readonly folderUuid?: string | undefined;
	readonly isDraft: boolean;
	readonly isRestorable: boolean;
	readonly versionUuid: string;
}) {
	const isMobile = useMediaQuery('(max-width: 600px)', { initializeWithValue: false });
	const [, setQueryState] = useQueryState('version', parseAsString);
	const sideSheetMode = useAtomValue(sideSheetModeAtom);
	const [isOpen, setIsOpen] = useState(false);
	const [isEditNameOpen, setIsEditNameOpen] = useState(false);
	const [isEditLockOpen, setIsEditLockOpen] = useState(false);
	const queryClient = useQueryClient();

	const { currentUserData } = useCurrentUser();

	const messages = useWebSocketMessages();

	const { data: lockData } = useQuery(
		$api.queryOptions(
			'get',
			sideSheetMode === SideSheetMode.FileVersionHistory
				? '/api/v1/uploads-dataset/{id}/status/'
				: '/api/v1/metadata-template-container/{id}/status/',
			{
				params: { path: { id: props.fileUuid ?? '' } },
			},
			{ enabled: Boolean(isOpen && sideSheetMode === SideSheetMode.FileVersionHistory) },
		),
	);

	const lockMessage = messages[props.fileUuid ?? '']?.find((message) => message.type === 'lock_status_changed')?.data;
	const isFileLocked = lockMessage?.status === undefined ? Boolean(lockData?.locked) : Boolean(lockMessage.status);

	const { datasetVersionData } = useDatasetVersionQuery({
		enabled: Boolean(isEditNameOpen && sideSheetMode === SideSheetMode.FileVersionHistory),
		versionUuid: props.versionUuid,
	});

	const { metadataTemplateVersionData } = useMetadataTemplateVersionQuery({
		enabled: Boolean(isEditNameOpen && sideSheetMode === SideSheetMode.MetadataTemplateVersionHistory),
		versionUuid: props.versionUuid,
	});

	const versionHistoryData =
		sideSheetMode === SideSheetMode.FileVersionHistory ? datasetVersionData : metadataTemplateVersionData;

	const { data: folderPermissionData } = useQuery(
		$api.queryOptions(
			'get',
			'/api/v1/folder-permission/',
			{
				params: {
					query: { folder: props.folderUuid ?? '', project_membership__member: currentUserData?.pk ?? -1 },
				},
			},
			{ enabled: Boolean(isOpen && currentUserData?.pk && sideSheetMode === SideSheetMode.FileVersionHistory) },
		),
	);

	const canEdit = props.isDraft || folderPermissionData?.[0]?.is_folder_admin || folderPermissionData?.[0]?.can_edit;

	async function isLocked() {
		if (sideSheetMode === SideSheetMode.FileVersionHistory) {
			const { data } = await openAPIClient.GET('/api/v1/uploads-dataset/{id}/status/', {
				params: { path: { id: props.fileUuid ?? '' } },
			});

			await queryClient.invalidateQueries({
				queryKey: $api.queryOptions('get', '/api/v1/uploads-dataset/{id}/status/', {
					params: { path: { id: props.fileUuid ?? '' } },
				}).queryKey,
			});

			return data;
		} else if (sideSheetMode === SideSheetMode.MetadataTemplateVersionHistory) {
			const { data } = await openAPIClient.GET('/api/v1/metadata-template-container/{id}/status/', {
				params: { path: { id: metadataTemplateVersionData?.metadata_template_container?.pk ?? '' } },
			});

			await queryClient.invalidateQueries({
				queryKey: $api.queryOptions('get', '/api/v1/metadata-template-container/{id}/status/', {
					params: { path: { id: metadataTemplateVersionData?.metadata_template_container?.pk ?? '' } },
				}).queryKey,
			});

			return data;
		}

		return null;
	}

	async function setLocked() {
		if (sideSheetMode === SideSheetMode.FileVersionHistory) {
			const { data } = await openAPIClient.POST('/api/v1/uploads-dataset/{id}/lock/', {
				params: { path: { id: props.fileUuid ?? '' } },
			});

			return data;
		} else if (sideSheetMode === SideSheetMode.MetadataTemplateVersionHistory) {
			const { data } = await openAPIClient.POST('/api/v1/metadata-template-container/{id}/lock/', {
				params: { path: { id: metadataTemplateVersionData?.metadata_template_container?.pk ?? '' } },
			});

			return data;
		}

		return null;
	}

	async function restoreVersion() {
		if (sideSheetMode === SideSheetMode.FileVersionHistory) {
			logger.debug(LogCategory.Cache, 'Restoring file version - invalidating caches', {
				type: 'file',
				fileUuid: props.fileUuid,
				versionUuid: props.versionUuid,
			});
			const { data } = await openAPIClient.POST('/api/v1/uploads-dataset/{id}/restore/', {
				params: { path: { id: props.fileUuid ?? '' } },
				body: {
					uploads_version: props.versionUuid,
				},
			});

			await queryClient.invalidateQueries({
				queryKey: $api.queryOptions('get', '/api/v1/uploads-dataset/{id}/', {
					params: { path: { id: props.fileUuid ?? '' } },
				}).queryKey,
			});

			await setQueryState(data?.pk ?? null);
		} else if (sideSheetMode === SideSheetMode.MetadataTemplateVersionHistory) {
			logger.debug(LogCategory.Cache, 'Restoring template version - invalidating caches', {
				type: 'metadataTemplate',
				containerId: metadataTemplateVersionData?.metadata_template_container?.pk,
				versionUuid: props.versionUuid,
			});
			const { data } = await openAPIClient.POST('/api/v1/metadata-template-container/{id}/restore/', {
				params: { path: { id: metadataTemplateVersionData?.metadata_template_container?.pk ?? '' } },
				body: {
					metadata_template: props.versionUuid,
				},
			});

			await queryClient.invalidateQueries({
				queryKey: $api.queryOptions('get', '/api/v1/metadata-template/{id}/', {
					params: { path: { id: metadataTemplateVersionData?.metadata_template_container?.pk ?? '' } },
				}).queryKey,
			});
			await queryClient.invalidateQueries({
				queryKey: $api.queryOptions('get', '/api/v1/metadata-template-container/{id}/', {
					params: { path: { id: metadataTemplateVersionData?.metadata_template_container?.pk ?? '' } },
				}).queryKey,
			});

			await setQueryState(data?.pk ?? null);
		}

		globalToastQueue.add({ message: 'Version successfully restored.', type: ToastType.Success }, { timeout: 5_000 });
	}

	const handleRenameVersion = async () => {
		if (sideSheetMode === SideSheetMode.FileVersionHistory) {
			const status = await isLocked();
			if (status?.locked) {
				setIsEditLockOpen(true);
			} else {
				await setLocked();
				setIsEditNameOpen(true);
			}
			return;
		}

		if (sideSheetMode === SideSheetMode.MetadataTemplateVersionHistory) {
			setIsEditNameOpen(true);
		}
	};

	const renameActionLabel = versionHistoryData?.name ? 'Rename version' : 'Name version';
	const renameActionIcon = versionHistoryData?.name ? (
		<PencilLineIcon aria-hidden size={18} strokeWidth={1.5} />
	) : (
		<WholeWordIcon aria-hidden size={18} strokeWidth={1.5} />
	);
	const menuActions: SideSheetVersionHistoryMoreMenuAction[] = [
		{
			ariaLabel: 'Rename version',
			icon: renameActionIcon,
			id: 'rename-version',
			label: renameActionLabel,
			onAction: handleRenameVersion,
		},
		...(props.isRestorable
			? [
					{
						ariaLabel: 'Restore',
						icon: <Undo2Icon aria-hidden size={18} strokeWidth={1.5} />,
						id: 'restore' as const,
						isDisabled: isFileLocked,
						label: 'Restore',
						onAction: restoreVersion,
					},
				]
			: []),
	];

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
								{menuActions.map((action) => (
									<DrawerClose
										aria-label={action.ariaLabel}
										className={dropdownItemStyles({ className: 'text-base-sm flex place-content-start gap-2' })}
										id={action.id}
										isDisabled={action.isDisabled}
										key={action.id}
										onPress={action.onAction}
										variant="unset"
									>
										{action.icon}
										{action.label}
									</DrawerClose>
								))}
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
					<MenuContent popover={{ arrow: false }}>
						{menuActions.map((action) => (
							<MenuItem
								aria-label={action.ariaLabel}
								id={action.id}
								isDisabled={action.isDisabled}
								key={action.id}
								onAction={action.onAction}
							>
								{action.icon}
								{action.label}
							</MenuItem>
						))}
					</MenuContent>
				</Menu>
			)}
			<SideSheetMoreMenuEditVersionNameDialog
				isOpen={isEditNameOpen}
				name={versionHistoryData?.name ?? ''}
				onOpenChange={setIsEditNameOpen}
				versionUuid={props.versionUuid}
			/>
			<SideSheetVersionHistoryVersionEditLockDialog
				fileUuid={props.fileUuid ?? ''}
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
	const sideSheetSelectedMetadataTemplateContainer = useAtomValue(sideSheetSelectedMetadataTemplateContainerAtom);

	const { datasetData, datasetVersionsData } = useDatasetVersionsQuery({
		enabled: sideSheetMode === SideSheetMode.FileVersionHistory,
		fileUuid: sideSheetSelectedDataset,
	});

	const { metadataTemplateData, metadataTemplateVersionsData } = useMetadataTemplateVersionsQuery({
		enabled: sideSheetMode === SideSheetMode.MetadataTemplateVersionHistory,
		metadataTemplateContainerUuid: sideSheetSelectedMetadataTemplateContainer,
	});

	const versionHistoryData =
		sideSheetMode === SideSheetMode.FileVersionHistory ? datasetVersionsData : metadataTemplateVersionsData;

	return (
		<div className="flex flex-col p-5">
			<GridList
				aria-label="Version history"
				className="overscroll-auto"
				defaultSelectedKeys={[
					queryState ?? datasetData?.latest_version?.pk ?? metadataTemplateData?.latest_metadata_template?.pk ?? '',
				]}
			>
				{versionHistoryData?.map((version, index, array) => {
					const isFirstItem = index === 0;
					const isLastItem = index === array.length - 1;
					const isCurrentVersion =
						version.pk ===
						(queryState ?? datasetData?.latest_version?.pk ?? metadataTemplateData?.latest_metadata_template?.pk);

					return (
						<GridListItem
							className="not-last:pb-4 focus-visible:outline-0"
							id={version.pk}
							key={version.pk}
							onAction={async () => setQueryState(version.pk)}
							textValue={`${isFirstItem ? 'Current: ' : isLastItem ? 'Created: ' : ''}${format(version.creation_date, 'MMM D, YYYY hh:mm', 'en')} ${version.pk}`}
						>
							<div className="relative ml-9 flex flex-1">
								<div className="absolute top-6 -left-[24.5px] h-[calc(100%-8px)] w-px bg-base-neutral-100 group-last:hidden dark:bg-base-neutral-700" />
								{isFirstItem ? (
									<div
										aria-hidden
										className={buttonStyles({
											size: 'icon-xs',
											variant: 'unset',
											className: cx(
												'absolute top-0 -left-9 text-base-neutral-600 dark:text-base-neutral-300',
												isCurrentVersion &&
													'bg-base-crystal-500 text-base-neutral-900 dark:bg-base-crystal-300 dark:text-base-neutral-900',
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
												'absolute top-0 -left-9 text-base-neutral-600 dark:text-base-neutral-300',
												isCurrentVersion &&
													'bg-base-crystal-500 text-base-neutral-900 dark:bg-base-crystal-300 dark:text-base-neutral-900',
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
												'absolute top-0 -left-9 text-base-neutral-600 dark:text-base-neutral-300',
												isCurrentVersion &&
													'bg-base-crystal-500 text-base-neutral-900 dark:bg-base-crystal-300 dark:text-base-neutral-900',
											),
										})}
									>
										<ArrowRightIcon aria-hidden size={18} strokeWidth={1.5} />
									</div>
								) : (
									<>
										<div
											aria-hidden
											className="absolute -top-1 -left-[24.5px] h-10 w-px bg-base-neutral-100 group-last:hidden dark:bg-base-neutral-700"
										/>
										<div
											aria-hidden
											className={buttonStyles({
												size: 'icon-xs',
												variant: 'unset',
												className: 'absolute top-0 -left-9',
											})}
										>
											<div aria-hidden className="size-1 rounded-full bg-base-neutral-500 dark:text-base-neutral-300" />
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
										<span
											className="line-clamp-3 text-base-label-md"
											title={`${isFirstItem ? 'Current: ' : isLastItem ? 'Created: ' : ''}${version.name}`}
										>
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
											<span className="text-left text-base-xs">
												{format(version.creation_date, 'MMM D, YYYY hh:mm', 'en')}
											</span>
										) : null}
										<span
											className={cx(
												'text-left text-base-xs text-base-neutral-600 dark:text-base-neutral-300',
												isCurrentVersion && 'text-base-neutral-600 dark:text-base-neutral-200',
											)}
										>
											{version.pk}
										</span>
									</div>
								</div>
							</div>
							<SideSheetVersionHistoryMoreMenu
								fileUuid={datasetData?.pk ?? metadataTemplateData?.pk ?? ''}
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

function DatasetSideSheetPane(props: { readonly isProductionEnvironment: boolean }) {
	return (
		<>
			<SidebarHeader
				className={cx(
					'relative rounded-tl-2xl',
					!props.isProductionEnvironment &&
						'before:absolute before:top-0 before:-left-1 before:-z-1 before:size-9 before:bg-base-tangerine-500',
				)}
				hasBorder
			>
				<SideSheetDatasetHeader />
			</SidebarHeader>
			<SidebarContent className="p-0">
				<SideSheetDatasetContent />
			</SidebarContent>
		</>
	);
}

function VersionHistorySideSheetPane(props: { readonly isProductionEnvironment: boolean }) {
	return (
		<>
			<SidebarHeader
				className={cx(
					'relative rounded-tl-2xl',
					!props.isProductionEnvironment &&
						'before:absolute before:top-0 before:-left-1 before:-z-1 before:size-9 before:bg-base-tangerine-500',
				)}
				hasBorder
			>
				<SideSheetVersionHistoryHeader />
			</SidebarHeader>
			<SidebarContent className="p-0">
				<SideSheetVersionHistoryContent />
			</SidebarContent>
		</>
	);
}

export function SideSheet() {
	const isProductionEnvironment =
		typeof window !== 'undefined' && window.location.href.startsWith('https://app.example.com');

	const sideSheetMode = useAtomValue(sideSheetModeAtom);

	return (
		<Sidebar className="rounded-tl-2xl print:hidden" closeButton={false} side="right">
			{sideSheetMode === SideSheetMode.Dataset ? (
				<DatasetSideSheetPane isProductionEnvironment={isProductionEnvironment} />
			) : (
				<VersionHistorySideSheetPane isProductionEnvironment={isProductionEnvironment} />
			)}
		</Sidebar>
	);
}

export const SideSheetNoSSR = dynamic(async () => SideSheet, { ssr: false });
