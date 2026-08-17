'use client';

import { format } from '@formkit/tempo';
import {
	keepPreviousData,
	useMutation,
	useQueries,
	useQuery,
	useQueryClient,
	useSuspenseQueries,
	useSuspenseQuery,
} from '@tanstack/react-query';
import {
	AlertCircleIcon,
	AlertTriangleIcon,
	BlocksIcon,
	DatabaseIcon,
	FileDownIcon,
	FileIcon,
	FileInputIcon,
	FileWarningIcon,
	FolderInputIcon,
	Loader2Icon,
	Maximize2Icon,
	PencilIcon,
	TagsIcon,
	TrashIcon,
	Wand2Icon,
	RefreshCcwIcon,
} from 'lucide-react';
import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { parseAsString, useQueryState } from 'nuqs';
import { useEffect, useState, type ReactNode } from 'react';
import { FileTrigger, type ModalOverlayProps } from 'react-aria-components';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { useMediaQuery } from 'usehooks-ts';
import { EditLockDialog } from '@/components/EditLockDialog';
import { ExportJobDialog } from '@/components/ExportJobDialog';
import { LockAlertBanner } from '@/components/LockAlertBanner';
import {
	MetadataBorder,
	MetadataFieldTypeBadge,
	MetadataField,
	MetadataFieldDiffTimelineEntry,
	MetadataValueWithCopyActions,
	getMetadataFieldTypeOrDefault,
} from '@/components/Metadata';
import { MetadataTemplateFieldValueEditor } from '@/components/MetadataValueEditor';
import { UpdateUploadDropZone } from '@/components/UpdateUploadDropZone';
import { UpdateUploadTrigger } from '@/components/UpdateUploadTrigger';
import { FileMissingMetadataIndicator } from '@/components/file-metadata/FileMetadataIndicators';
import { BlocksEditIcon } from '@/components/icons/BlocksEditIcon';
import { Alert } from '@/components/ui/Alert';
import type { ButtonProps } from '@/components/ui/Button';
import { Button } from '@/components/ui/Button';
import {
	ComboBox,
	ComboBoxContent,
	ComboBoxDescription,
	ComboBoxInput,
	ComboBoxItem,
	ComboBoxLabel,
	ComboBoxSection,
} from '@/components/ui/ComboBox';
import { DialogCloseIcon } from '@/components/ui/Dialog';
import { Form, useDialogForm } from '@/components/ui/Form';
import {
	ModalClose,
	ModalFooter,
	ModalHeader,
	ModalBody,
	ModalContent,
	Modal,
	ModalTitle,
} from '@/components/ui/Modal';
import { Separator } from '@/components/ui/Separator';
import { Switch } from '@/components/ui/Switch';
import { Tab, TabList, TabPanel, Tabs } from '@/components/ui/Tabs';
import { Tag, TagGroup } from '@/components/ui/TagGroup';
import { globalToastQueue, ToastType } from '@/components/ui/Toast';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/Tooltip';
import { useEnv } from '@/contexts/EnvContext';
import { useWebSocketMessages } from '@/contexts/WebSocket';
import { useCurrentFolderPermission } from '@/hooks/useCurrentFolderPermission';
import { useCurrentProjectMembership } from '@/hooks/useCurrentProjectMembership';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useExitFilesBulkMode } from '@/hooks/useExitFilesBulkMode';
import { useMetadataTemplateAssignmentMutation } from '@/hooks/useMetadataTemplateAssignmentMutation';
import { cx } from '@/styles/cva';
import { linkStyles } from '@/styles/ui/link';
import { buildImportedMetadataVersionPayload } from '@/util/buildImportedMetadataVersionPayload';
import { $api, openAPIClient } from '@/util/clientFetch';
import { convertDataRateLog } from '@/util/convertDataRate';
import { differenceInDays } from '@/util/differenceInDays';
import { EXPORT_TYPES } from '@/util/exportJobs';
import { DownloadCapability, fetchFileSize, getDownloadCapability } from '@/util/fileDownloadCapability';
import {
	normalizeConflictMetadataFieldConfig,
	toConflictMetadataValueField,
	type UpgradeMetadataPayloadConflict,
} from '@/util/fileMetadataConflictDialog';
import {
	canManageFileMetadataTemplate,
	getVisuallySelectedFileMetadataTemplateContainerPks,
} from '@/util/fileMetadataTemplateAccess';
import { formatErrorMessage } from '@/util/formatErrorMessage';
import { logger, LogCategory } from '@/util/logger';
import { buildMetadataDiffTimeline, scrubMetadataField } from '@/util/metadataDiff';
import { getMetadataChoiceWriteValidationMessage } from '@/util/metadataOptionValidation';
import type { components } from '@/util/openapiSchema';
import { parseMetadataImportPayload } from '@/util/parseMetadataImportPayload';
import { trimMetadataPayload } from '@/util/trimMetadataPayload';

type UpgradeMetadataConflictResolution =
	components['schemas']['UploadsDatasetResolveUpgradeMetadataConflictResolutionRequest'];
type ResolveUpgradeConflictFormInput = {
	readonly base_version_pk: string;
	readonly resolutions: UpgradeMetadataConflictResolution[];
};
type FileMetadataEntry = Parameters<typeof MetadataField>[0]['entry'];

export function FileExpirationBadge(props: { readonly expirationDate: string }) {
	const daysLeft = differenceInDays(props.expirationDate);

	return (
		<Tooltip delay={400}>
			<TooltipTrigger
				className={cx(
					'h-6 w-auto cursor-auto place-self-start rounded-sm px-2 py-1 text-base-sm print:inline-flex',
					daysLeft <= 3
						? 'bg-base-sunset-100 text-base-sunset-800 dark:bg-base-sunset-800 dark:text-base-sunset-100'
						: daysLeft <= 7
							? 'bg-base-tangerine-100 text-base-tangerine-800 dark:bg-base-tangerine-800 dark:text-base-tangerine-100'
							: 'bg-base-neutral-100 dark:bg-base-neutral-700',
				)}
				variant="unset"
			>
				{daysLeft} {daysLeft === 1 ? 'day' : 'days'} left
			</TooltipTrigger>
			<TooltipContent variant="plain">
				{daysLeft === 1 ? 'Auto-deletion will be executed tomorrow' : `${daysLeft} days until auto-deletion`}
			</TooltipContent>
		</Tooltip>
	);
}

export function FileUpgradeMetadataAvailableIcon(
	props: ButtonProps & { readonly tooltipContent?: string | undefined },
) {
	return (
		<Tooltip delay={400}>
			<TooltipTrigger variant="unset" size={props.size} className={props.className}>
				<RefreshCcwIcon aria-hidden size={14} strokeWidth={1.5} />
			</TooltipTrigger>
			<TooltipContent variant="plain">{props.tooltipContent ?? 'Metadata template upgrade available'}</TooltipContent>
		</Tooltip>
	);
}

export function FileHeading(props: { readonly fileUuid: string; readonly isDraft?: boolean }) {
	const { data: datasetData } = useSuspenseQuery(
		$api.queryOptions('get', '/api/v1/uploads-dataset/{id}/', {
			params: { path: { id: props.fileUuid } },
		}),
	);

	const { data: datasetUpgradeMetadataStatusData } = useQuery(
		$api.queryOptions(
			'get',
			'/api/v1/uploads-dataset/{id}/upgrade-metadata-status/',
			{
				params: { path: { id: props.fileUuid } },
			},
			{ enabled: !props.isDraft },
		),
	);
	const isMetadataUpgradeError = datasetUpgradeMetadataStatusData?.metadata_upgrade_status === 'ERROR';
	const shouldShowUpgradeIcon = Boolean(
		!props.isDraft && (datasetUpgradeMetadataStatusData?.has_upgradeable_metadata_templates || isMetadataUpgradeError),
	);

	const { data: datasetVersionData } = useQuery(
		$api.queryOptions(
			'get',
			'/api/v1/uploads-version/{id}/',
			{
				params: { path: { id: datasetData.latest_version?.pk ?? '' } },
			},
			{ enabled: Boolean(datasetData.latest_version) },
		),
	);

	return (
		<div className="flex place-items-center gap-3">
			{datasetVersionData?.version_file ? (
				<FileIcon aria-hidden className="shrink-0" size={24} strokeWidth={1.5} />
			) : (
				<FileWarningIcon
					aria-hidden
					className="shrink-0 text-base-tangerine-600 dark:text-base-tangerine-400"
					size={24}
					strokeWidth={1.5}
				/>
			)}
			<h1 className="text-base-heading-xs break-all">{datasetData.display_name ?? 'Empty dataset'}</h1>
			<div className="flex place-items-center gap-2">
				{datasetVersionData?.metadata_is_complete ? null : <FileMissingMetadataIndicator />}
				{shouldShowUpgradeIcon ? (
					<FileUpgradeMetadataAvailableIcon
						size="icon-xs"
						className={
							isMetadataUpgradeError
								? 'bg-base-sunset-100 text-base-sunset-800 dark:bg-base-sunset-800 dark:text-base-sunset-100'
								: 'bg-base-crystal-100 text-base-crystal-800 dark:bg-base-crystal-800 dark:text-base-crystal-100'
						}
						tooltipContent={
							isMetadataUpgradeError
								? 'Metadata template upgrade has conflicts that need resolution'
								: 'Metadata template upgrade available'
						}
					/>
				) : null}
			</div>
		</div>
	);
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
						className="cursor-auto place-self-start text-base-sm text-base-neutral-600 dark:text-base-neutral-300 print:inline-flex"
						variant="unset"
					>
						<Wand2Icon aria-hidden className="shrink-0" size={18} strokeWidth={1.5} />
						{datasetData.created_by.email} - {format(datasetData.creation_date, 'MMM D, YYYY hh:mm', 'en')}
					</TooltipTrigger>
					<TooltipContent variant="plain">Created by / at</TooltipContent>
				</Tooltip>

				<Tooltip delay={400}>
					<TooltipTrigger
						className="cursor-auto place-self-start text-base-sm text-base-neutral-600 dark:text-base-neutral-300 print:inline-flex"
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
						className="cursor-auto place-self-start text-base-sm text-base-neutral-600 dark:text-base-neutral-300 print:inline-flex"
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

export function FileMetadataTemplate(props: {
	readonly fileUuid: string;
	readonly folderUuid?: string | undefined;
	readonly projectUuid?: string | undefined;
}) {
	const [isOpen, setIsOpen] = useState(false);
	const [selectedContainerPk, setSelectedContainerPk] = useState<string | null>(null);
	const folderPermission = useCurrentFolderPermission(props.folderUuid ?? '', {
		enabled: Boolean(props.folderUuid),
	});
	const projectMembership = useCurrentProjectMembership(props.projectUuid ?? '', {
		enabled: Boolean(props.projectUuid),
	});

	const { data: datasetData } = useSuspenseQuery(
		$api.queryOptions('get', '/api/v1/uploads-dataset/{id}/', {
			params: { path: { id: props.fileUuid } },
		}),
	);

	const [projectResult, folderResult] = useSuspenseQueries({
		queries: [
			$api.queryOptions('get', '/api/v1/project/{id}/', {
				params: { path: { id: props.projectUuid ?? '' } },
			}),
			$api.queryOptions('get', '/api/v1/folder/{id}/', {
				params: { path: { id: props.folderUuid ?? '' } },
			}),
		],
	});

	const { data: poolData } = useQuery(
		$api.queryOptions(
			'get',
			'/api/v1/uploads-dataset/{id}/metadata-template-container-pool/',
			{ params: { path: { id: props.fileUuid } } },
			{ enabled: isOpen, placeholderData: keepPreviousData },
		),
	);

	const datasetQueryOptions = $api.queryOptions('get', '/api/v1/uploads-dataset/{id}/', {
		params: { path: { id: props.fileUuid } },
	});

	const { mutate, isPending } = useMetadataTemplateAssignmentMutation({
		path: '/api/v1/uploads-dataset/{id}/',
		params: { id: props.fileUuid },
		invalidateQueryKey: datasetQueryOptions.queryKey,
		toastMessages: {
			assigned: 'Metadata template activated for dataset.',
			unassigned: 'Metadata template deactivated for dataset.',
		},
	});

	const datasetTemplate = datasetData.metadata_template;
	const projectTemplate = projectResult.data?.metadata_template;
	const folderTemplate = folderResult.data?.metadata_template;
	const hasAnyTemplate = Boolean(datasetTemplate ?? projectTemplate ?? folderTemplate);
	const activeContainerPk = datasetTemplate?.metadata_template_container?.pk ?? null;
	const projectActiveContainerPk = projectTemplate?.metadata_template_container?.pk;
	const folderActiveContainerPk = folderTemplate?.metadata_template_container?.pk;
	const disabledContainerKeys = new Set(
		[projectActiveContainerPk, folderActiveContainerPk].filter(Boolean) as string[],
	);
	const visuallySelectedContainerKeys = new Set(
		getVisuallySelectedFileMetadataTemplateContainerPks({
			activeContainerPk,
			inheritedContainerPks: [...disabledContainerKeys],
		}),
	);
	const canManageTemplate = canManageFileMetadataTemplate({
		canEditFolder: folderPermission.canEditFolder,
		isFolderAdmin: folderPermission.isFolderAdmin,
		isProjectAdmin: projectMembership.isProjectAdmin,
	});

	function handleOpenChange(open: boolean) {
		setIsOpen(open);
		if (open) {
			setSelectedContainerPk(activeContainerPk);
		}
	}

	function getContainerDescription(containerPk: string | null): string | null {
		const container = poolData?.find((item) => item.pk === containerPk);
		if (!container) return null;

		if (container.assigned_to_content_type === 'projects.project') {
			return container.project?.name ? `Project: ${container.project.name}` : null;
		}
		if (container.assigned_to_content_type === 'folders.folder') {
			return container.assigned_to_content_object_name ? `Folder: ${container.assigned_to_content_object_name}` : null;
		}
		return 'Global';
	}

	function handleSave() {
		const selectedContainer = poolData?.find((item) => item.pk === selectedContainerPk);
		const templatePk = selectedContainer?.latest_metadata_template?.pk ?? null;
		mutate(templatePk);
		setIsOpen(false);
	}

	function handleRemove() {
		mutate(null);
		setIsOpen(false);
	}

	const hasChanged = selectedContainerPk !== activeContainerPk;

	return (
		<>
			<div className="flex place-content-between place-items-center">
				<span className="text-base-label-lg">Metadata template</span>
				{canManageTemplate ? (
					<Modal isOpen={isOpen} onOpenChange={handleOpenChange}>
						<Button aria-label="Manage metadata template" size="icon-sm" variant="discreet">
							<PencilIcon aria-hidden size={18} strokeWidth={1.5} />
						</Button>
						<ModalContent aria-label="Manage metadata template">
							<ModalHeader className="flex flex-row place-items-center gap-2 text-base-xl">
								<ModalTitle className="text-base-xl">Manage metadata template</ModalTitle>
							</ModalHeader>
							<ModalBody>
								<span>Select a metadata template to apply to this dataset</span>
								<ComboBox
									aria-label="Metadata template"
									disabledKeys={disabledContainerKeys}
									menuTrigger="focus"
									onChange={(key) => setSelectedContainerPk(key as string | null)}
									value={selectedContainerPk}
								>
									<ComboBoxInput placeholder="Select template" />
									<ComboBoxContent>
										<ComboBoxSection title={poolData?.length ? 'Available templates' : 'No templates available'}>
											{poolData?.map((container) => (
												<ComboBoxItem
													forceSelectedIndicator={visuallySelectedContainerKeys.has(container.pk)}
													id={container.pk}
													key={container.pk}
													textValue={container.name}
												>
													<div className="flex place-items-center gap-3">
														<BlocksIcon aria-hidden className="shrink-0" size={18} strokeWidth={1.5} />
														<div className="flex flex-col">
															<ComboBoxLabel>{container.name}</ComboBoxLabel>
															<ComboBoxDescription>
																{getContainerDescription(container.pk) ?? 'Global'}
															</ComboBoxDescription>
														</div>
													</div>
												</ComboBoxItem>
											))}
										</ComboBoxSection>
									</ComboBoxContent>
									<ComboBoxDescription>{getContainerDescription(selectedContainerPk)}</ComboBoxDescription>
								</ComboBox>
							</ModalBody>
							<ModalFooter className="sm:place-content-between">
								<div>
									{activeContainerPk ? (
										<Button isDisabled={isPending} onPress={handleRemove} variant="discreet" isDestructive>
											Remove template
										</Button>
									) : null}
								</div>
								<div className="flex flex-col-reverse place-content-between gap-2 sm:flex-row sm:place-items-center">
									<ModalClose variant="secondary-discreet">Cancel</ModalClose>
									<Button isDisabled={isPending || !hasChanged} onPress={handleSave} variant="filled">
										Save
									</Button>
								</div>
							</ModalFooter>
						</ModalContent>
					</Modal>
				) : null}
			</div>
			{hasAnyTemplate ? (
				<TagGroup aria-label="Active metadata templates">
					{projectTemplate ? (
						<Tag
							color="lavender"
							href={`/metadata-templates/${projectTemplate.metadata_template_container.pk}`}
							target="_blank"
							textValue={projectTemplate.metadata_template_container.name}
						>
							<BlocksIcon aria-hidden className="shrink-0" size={18} strokeWidth={1.5} />
							<span className="truncate" title={projectTemplate.metadata_template_container.name}>
								{projectTemplate.metadata_template_container.name}
							</span>
						</Tag>
					) : null}
					{folderTemplate ? (
						<Tag
							color="lavender"
							href={`/metadata-templates/${folderTemplate.metadata_template_container.pk}`}
							target="_blank"
							textValue={folderTemplate.metadata_template_container.name}
						>
							<BlocksIcon aria-hidden className="shrink-0" size={18} strokeWidth={1.5} />
							<span className="truncate" title={folderTemplate.metadata_template_container.name}>
								{folderTemplate.metadata_template_container.name}
							</span>
						</Tag>
					) : null}
					{datasetTemplate ? (
						<Tag
							color="lavender"
							href={`/metadata-templates/${datasetTemplate.metadata_template_container.pk}`}
							target="_blank"
							textValue={datasetTemplate.metadata_template_container.name}
						>
							<BlocksIcon aria-hidden className="shrink-0" size={18} strokeWidth={1.5} />
							<span className="truncate" title={datasetTemplate.metadata_template_container.name}>
								{datasetTemplate.metadata_template_container.name}
							</span>
						</Tag>
					) : null}
				</TagGroup>
			) : (
				<span className="text-base-sm text-base-neutral-600 dark:text-base-neutral-300">No template assigned</span>
			)}
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
					<TagGroup aria-label="Storage">
						<Tag color="neutral-lighter" textValue={folderData.data.storage?.name ?? 'DSS'}>
							<DatabaseIcon aria-hidden size={18} strokeWidth={1.5} /> {folderData.data.storage?.name ?? 'DSS'}
						</Tag>
					</TagGroup>
				</>
			) : null}
		</div>
	) : null;
}

function FileMetadataUpgradeConflictPane(props: {
	readonly className?: string | undefined;
	readonly children?: ReactNode;
}) {
	return <div className={cx('flex flex-col gap-1', props.className)}>{props.children}</div>;
}

function FileMetadataUpgradeConflictHeader(props: {
	// oxlint-disable-next-line typescript/no-duplicate-type-constituents
	readonly metadata: UpgradeMetadataPayloadConflict['old'] | null | undefined;
	readonly className?: string | undefined;
}) {
	return (
		<span className="flex w-full place-content-between place-items-center gap-3">
			{props.metadata?.custom_key ?? 'Unknown field'}
			<MetadataFieldTypeBadge
				className={props.className}
				fieldType={getMetadataFieldTypeOrDefault(props.metadata?.field_type)}
			/>
		</span>
	);
}

export function FileResolveMetadataUpgradeConflictDialog(
	props: ModalOverlayProps & {
		readonly fileUuid: string;
		readonly latestVersionPk: string | null;
	},
) {
	const router = useRouter();
	const queryClient = useQueryClient();
	const { formProps, submitButtonProps } = useDialogForm('file-resolve-metadata-upgrade-conflict');

	const upgradeStatusQueryKey = $api.queryOptions('get', '/api/v1/uploads-dataset/{id}/upgrade-metadata-status/', {
		params: { path: { id: props.fileUuid } },
	}).queryKey;

	const {
		control,
		handleSubmit,
		reset,
		setError,
		clearErrors,
		formState: { errors },
	} = useForm<ResolveUpgradeConflictFormInput>({
		defaultValues: { base_version_pk: '', resolutions: [] },
	});

	const { fields } = useFieldArray({
		control,
		name: 'resolutions',
	});

	const upgradeMetadataPayloadQuery = useQuery(
		$api.queryOptions(
			'get',
			'/api/v1/uploads-dataset/{id}/upgrade-metadata-payload/',
			{
				params: { path: { id: props.fileUuid } },
			},
			{ enabled: Boolean(props.isOpen) },
		),
	);

	const { mutateAsync: resolveUpgradeMetadataConflict, isPending: isResolvingUpgradeMetadataConflict } = useMutation({
		mutationFn: async (input: ResolveUpgradeConflictFormInput) => {
			if (!input.base_version_pk) {
				throw new Error('Unable to resolve conflicts because base version is missing.');
			}

			const { data, error, response } = await openAPIClient.POST(
				'/api/v1/uploads-dataset/{id}/resolve-upgrade-metadata-conflict/',
				{
					params: { path: { id: props.fileUuid } },
					body: {
						base_version_pk: input.base_version_pk,
						resolutions: input.resolutions.map((resolution) => ({
							conflict_id: resolution.conflict_id,
							value: trimMetadataPayload(resolution.value ?? null),
						})),
					},
				},
			);

			if (error) {
				throw new Error(formatErrorMessage(error, response));
			}

			return data;
		},
	});

	useEffect(() => {
		if (!props.isOpen || !upgradeMetadataPayloadQuery.data) {
			return;
		}

		reset({
			base_version_pk: upgradeMetadataPayloadQuery.data.base_version_pk ?? '',
			resolutions: upgradeMetadataPayloadQuery.data.conflicts.map((conflict) => ({
				conflict_id: conflict.conflict_id,
				value: conflict.new?.value ?? null,
			})),
		});
		clearErrors();
	}, [clearErrors, props.isOpen, reset, upgradeMetadataPayloadQuery.data]);

	const onSubmit = handleSubmit(async (input) => {
		let hasValidationError = false;
		for (const [index, resolution] of input.resolutions.entries()) {
			const conflict = upgradeMetadataPayloadQuery.data?.conflicts.find(
				(entry) => entry.conflict_id === resolution.conflict_id,
			);
			const message = getMetadataChoiceWriteValidationMessage({
				config: conflict?.new?.config,
				fieldType: conflict?.new?.field_type,
				value: resolution.value,
			});
			if (message) {
				hasValidationError = true;
				setError(`resolutions.${index}.value`, { message, type: 'validate' });
			}
		}
		if (hasValidationError) {
			return;
		}
		try {
			await resolveUpgradeMetadataConflict(input);
			props.onOpenChange?.(false);
			clearErrors();
			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: $api.queryOptions('get', '/api/v1/uploads-dataset/{id}/', {
						params: { path: { id: props.fileUuid } },
					}).queryKey,
				}),
				queryClient.invalidateQueries({ queryKey: upgradeStatusQueryKey }),
				queryClient.invalidateQueries({
					queryKey: $api.queryOptions('get', '/api/v1/uploads-dataset/').queryKey,
				}),
				props.latestVersionPk
					? queryClient.invalidateQueries({
							queryKey: $api.queryOptions('get', '/api/v1/uploads-version/{id}/', {
								params: { path: { id: props.latestVersionPk } },
							}).queryKey,
						})
					: Promise.resolve(),
			]);
			router.refresh();
		} catch (error) {
			setError('root', {
				type: 'custom',
				message: error instanceof Error ? error.message : String(error),
			});
		}
	});

	return (
		<ModalContent
			aria-label="Resolve metadata upgrade conflicts"
			className="max-sm:flex max-sm:grow max-sm:rounded-none max-sm:[--visual-viewport-vertical-padding:0px]"
			overlay={{ className: 'max-sm:p-0 max-sm:flex max-sm:flex-col' }}
			isOpen={props.isOpen}
			closeButton={false}
			onOpenChange={(isOpen) => {
				props.onOpenChange?.(isOpen);
				if (!isOpen) {
					clearErrors();
				}
			}}
		>
			<ModalHeader className="flex flex-row place-items-center gap-2 text-base-xl" hasBorder>
				<DialogCloseIcon className="max-sm:relative max-sm:inset-0" isDismissable />
				<BlocksEditIcon aria-hidden className="max-sm:hidden" height={24} width={24} strokeWidth={1.5} />
				<ModalTitle className="text-base-xl">Resolve metadata template conflicts</ModalTitle>
			</ModalHeader>
			<ModalBody>
				<Form {...formProps} onSubmit={onSubmit} className="flex flex-col gap-4">
					{errors.root?.message ? (
						<Alert>
							<AlertCircleIcon aria-hidden className="shrink-0" size={20} strokeWidth={1.5} />
							{errors.root.message}
						</Alert>
					) : null}
					{upgradeMetadataPayloadQuery.isLoading ? (
						<span className="text-base-neutral-600 dark:text-base-neutral-300">Loading conflicts…</span>
					) : null}
					{upgradeMetadataPayloadQuery.error ? (
						<Alert>
							<AlertCircleIcon aria-hidden className="shrink-0" size={20} strokeWidth={1.5} />
							Unable to load metadata conflicts. Please try again.
						</Alert>
					) : null}
					{upgradeMetadataPayloadQuery.data && !upgradeMetadataPayloadQuery.data.base_version_pk ? (
						<Alert>
							<AlertCircleIcon aria-hidden className="shrink-0" size={20} strokeWidth={1.5} />
							Unable to resolve conflicts because base version is missing.
						</Alert>
					) : null}
					{!upgradeMetadataPayloadQuery.isLoading && !upgradeMetadataPayloadQuery.error && fields.length === 0 ? (
						<span className="text-base-neutral-600 dark:text-base-neutral-300">No conflicts were returned.</span>
					) : null}
					{fields.map((resolutionField, index) => {
						const conflict = upgradeMetadataPayloadQuery.data?.conflicts[index] as
							| UpgradeMetadataPayloadConflict
							| undefined;
						const oldMetadata = conflict?.old;
						const newMetadata = conflict?.new;

						if (!conflict) {
							return null;
						}

						return (
							<div className="relative flex" key={resolutionField.id}>
								<div className="w-full">
									<div className="flex flex-col">
										<div className="pt-4 pb-2 pl-4">
											<TagGroup aria-label="Conflict resolution status" color="info">
												<Tag>RESOLVE TO</Tag>
											</TagGroup>
										</div>
										<FileMetadataUpgradeConflictPane className="bg-base-neutral-0 px-4 pt-1 pb-4 dark:bg-base-neutral-800">
											<Controller
												control={control}
												name={`resolutions.${index}.value`}
												render={({ field, fieldState }) => (
													<MetadataTemplateFieldValueEditor
														configStrategy="preserve"
														className="**:data-[slot=label]:mb-1 **:data-[slot=label]:w-full"
														errorMessage={fieldState.error?.message ? { message: fieldState.error.message } : undefined}
														fieldConfig={normalizeConflictMetadataFieldConfig(newMetadata?.config)}
														fieldType={getMetadataFieldTypeOrDefault(newMetadata?.field_type)}
														isDisabled={field.disabled ?? false}
														label={<FileMetadataUpgradeConflictHeader metadata={newMetadata} />}
														onBlur={field.onBlur}
														onChange={(next) => {
															clearErrors(`resolutions.${index}.value`);
															field.onChange(next.value ?? null);
														}}
														value={field.value}
													/>
												)}
											/>
										</FileMetadataUpgradeConflictPane>
										<Separator className="m-0" />
										<div className="bg-base-neutral-80 px-4 py-2 text-base-sm text-base-neutral-600 dark:text-base-neutral-300">
											Existing Metadata
										</div>
										<FileMetadataUpgradeConflictPane className="bg-base-neutral-40 p-4 dark:bg-base-neutral-700/40">
											<FileMetadataUpgradeConflictHeader
												className="rounded-sm bg-base-neutral-100 text-base-neutral-900 dark:bg-base-neutral-700 dark:text-base-neutral-40"
												metadata={oldMetadata}
											/>
											<MetadataValueWithCopyActions field={toConflictMetadataValueField(oldMetadata)} />
										</FileMetadataUpgradeConflictPane>
									</div>
								</div>

								<MetadataBorder isRemoveDisabled aria-label="Delete metadata entry" />
							</div>
						);
					})}
				</Form>
			</ModalBody>
			<ModalFooter hasBorder>
				<ModalClose variant="secondary-discreet">Cancel</ModalClose>
				<Button
					{...submitButtonProps}
					isDisabled={
						isResolvingUpgradeMetadataConflict ||
						upgradeMetadataPayloadQuery.isLoading ||
						Boolean(upgradeMetadataPayloadQuery.error) ||
						!upgradeMetadataPayloadQuery.data?.base_version_pk ||
						fields.length === 0
					}
					variant="filled"
				>
					{isResolvingUpgradeMetadataConflict ? (
						<>
							<Loader2Icon aria-hidden className="animate-spin" data-slot="icon" size={18} strokeWidth={1.5} />
							Resolving...
						</>
					) : (
						<>
							<BlocksEditIcon aria-hidden className="max-sm:hidden" height={18} width={18} strokeWidth={1.5} />
							Resolve
						</>
					)}
				</Button>
			</ModalFooter>
		</ModalContent>
	);
}

function useFileLockAndEditAccessState(props: {
	readonly fileUuid: string;
	readonly folderUuid?: string;
	readonly isDraft?: boolean;
}) {
	const { currentUserData } = useCurrentUser();
	const messages = useWebSocketMessages();

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

	return {
		canEdit,
		currentUserData,
		folderPermissionData,
		isFileLocked,
		lockData,
		lockMessage,
	};
}

function useFileMetadataViewModel(props: { readonly fileUuid: string; readonly isDraft?: boolean }) {
	const [queryState] = useQueryState('version', parseAsString);
	const isMobile = useMediaQuery('(max-width: 600px)', { initializeWithValue: false });

	const { data: datasetData } = useSuspenseQuery(
		$api.queryOptions('get', '/api/v1/uploads-dataset/{id}/', {
			params: { path: { id: props.fileUuid } },
		}),
	);
	const { data: datasetUpgradeMetadataStatusData } = useQuery(
		$api.queryOptions(
			'get',
			'/api/v1/uploads-dataset/{id}/upgrade-metadata-status/',
			{
				params: { path: { id: props.fileUuid } },
			},
			{ enabled: !props.isDraft },
		),
	);

	const latestId = datasetData.latest_version?.pk ?? null;
	const selectedId = queryState ?? latestId;
	const hasDiff = Boolean(queryState && latestId && selectedId !== latestId);

	const { data: datasetVersionData } = useQuery(
		$api.queryOptions(
			'get',
			'/api/v1/uploads-version/{id}/',
			{
				params: { path: { id: selectedId ?? '' } },
			},
			{ enabled: Boolean(selectedId) },
		),
	);

	const compareVersionId = hasDiff ? latestId : null;

	const compareMetadata = useQuery(
		$api.queryOptions(
			'get',
			'/api/v1/uploads-version/{id}/',
			{
				params: { path: { id: compareVersionId ?? '' } },
			},
			{ enabled: Boolean(compareVersionId) },
		),
	);

	const diffQuery = useQuery(
		$api.queryOptions(
			'get',
			'/api/v1/uploads-version/{id}/diff/',
			{
				params: {
					path: { id: selectedId ?? '' },
					query: { compare: latestId ?? '' },
				},
			},
			{ enabled: hasDiff },
		),
	);

	return {
		compareMetadata,
		datasetData,
		datasetUpgradeMetadataStatusData,
		datasetVersionData,
		diffQuery,
		fileMetadataFields: datasetVersionData?.version_file?.metadata ?? [],
		hasDiff,
		isMobile,
		latestId,
		metadataFields: datasetVersionData?.metadata ?? [],
		queryState,
		rawCompareMetadataFields: compareMetadata.data?.metadata,
		rawMetadataFields: datasetVersionData?.metadata,
		selectedId,
	};
}

function useFileMetadataLockUpgradeActions(props: { readonly fileUuid: string }) {
	const queryClient = useQueryClient();
	const upgradeStatusQueryKey = $api.queryOptions('get', '/api/v1/uploads-dataset/{id}/upgrade-metadata-status/', {
		params: { path: { id: props.fileUuid } },
	}).queryKey;

	const markUpgradeStatusAsError = () => {
		queryClient.setQueryData(
			upgradeStatusQueryKey,
			(
				currentStatus: components['schemas']['UploadsDatasetMetadataUpgradeStatus'] | undefined,
			): components['schemas']['UploadsDatasetMetadataUpgradeStatus'] => ({
				has_upgradeable_metadata_templates: currentStatus?.has_upgradeable_metadata_templates ?? true,
				metadata_upgrade_status: 'ERROR',
			}),
		);
	};

	async function isLocked() {
		logger.debug(LogCategory.Cache, 'Refreshing file lock status', { fileUuid: props.fileUuid });
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

	async function setUnlocked() {
		const { data } = await openAPIClient.POST('/api/v1/uploads-dataset/{id}/unlock/', {
			params: { path: { id: props.fileUuid } },
		});

		return data;
	}

	async function upgradeMetadata() {
		const { data, error, response } = await openAPIClient.POST('/api/v1/uploads-dataset/{id}/upgrade-metadata/', {
			params: { path: { id: props.fileUuid } },
		});

		await queryClient.invalidateQueries({ queryKey: upgradeStatusQueryKey });

		if (error) {
			throw new Error(formatErrorMessage(error, response));
		}

		return data;
	}

	return {
		isLocked,
		markUpgradeStatusAsError,
		setLocked,
		setUnlocked,
		upgradeMetadata,
		upgradeStatusQueryKey,
	};
}

function FileMetadataAdditionalMetadataPanelContent(props: {
	readonly hasDiff: boolean;
	readonly hasMetadataDiffEntries: boolean;
	readonly isDiffLoading: boolean;
	readonly diffError: unknown;
	readonly metadataDiffTimeline: ReturnType<typeof buildMetadataDiffTimeline>;
	readonly metadataFields: readonly FileMetadataEntry[];
	readonly showDiff: boolean;
}) {
	if (props.showDiff && props.hasDiff) {
		return (
			<div className="flex flex-col gap-3">
				{props.isDiffLoading ? (
					<span className="text-base-neutral-600 dark:text-base-neutral-300">Loading changes…</span>
				) : null}
				{props.diffError ? <span className="text-base-red-500">Unable to load diff</span> : null}
				{!props.isDiffLoading && !props.diffError && !props.hasMetadataDiffEntries ? (
					<span className="flex place-content-between place-items-center gap-2 px-4 text-base-neutral-600 dark:text-base-neutral-300">
						No differences
					</span>
				) : null}
				{!props.isDiffLoading && !props.diffError && props.hasMetadataDiffEntries ? (
					<>
						{props.metadataDiffTimeline.map((entry) => (
							<MetadataFieldDiffTimelineEntry
								entry={entry}
								key={entry.type === 'added' ? entry.next.pk : entry.current.pk}
							/>
						))}
					</>
				) : null}
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-3">
			{props.metadataFields.map((metadata) => (
				<div
					className="flex flex-col gap-1 rounded-sm border border-base-neutral-100 p-4 dark:border-base-neutral-700"
					key={metadata.pk}
				>
					<MetadataField entry={metadata} hasMissingIndicator />
				</div>
			)) ?? null}
		</div>
	);
}

export function FileMetadata(props: {
	readonly fileUuid: string;
	readonly folderUuid?: string;
	readonly isDraft?: boolean;
	readonly projectUuid?: string;
}) {
	const router = useRouter();
	const queryClient = useQueryClient();
	const [isEditLockOpen, setIsEditLockOpen] = useState(false);
	const [isUpgradeConflictPromptOpen, setIsUpgradeConflictPromptOpen] = useState(false);
	const [isResolveUpgradeConflictOpen, setIsResolveUpgradeConflictOpen] = useState(false);
	const {
		compareMetadata,
		datasetUpgradeMetadataStatusData,
		datasetVersionData,
		diffQuery,
		fileMetadataFields,
		hasDiff,
		isMobile,
		latestId,
		metadataFields,
		rawCompareMetadataFields,
		rawMetadataFields,
	} = useFileMetadataViewModel({
		fileUuid: props.fileUuid,
		isDraft: props.isDraft,
	});
	const [showDiff, setShowDiff] = useState(false);

	let metadataDiffTimeline: ReturnType<typeof buildMetadataDiffTimeline> = [];
	let hasMetadataDiffEntries = false;

	if (showDiff && hasDiff) {
		metadataDiffTimeline = buildMetadataDiffTimeline({
			currentFields: (rawMetadataFields ?? []).map((field) => scrubMetadataField(field)),
			compareFields: (rawCompareMetadataFields ?? []).map((field) => scrubMetadataField(field)),
			diffValues: diffQuery.data?.metadata,
		});
		hasMetadataDiffEntries = metadataDiffTimeline.some((entry) => entry.type !== 'unchanged');
	}

	const { canEdit, isFileLocked } = useFileLockAndEditAccessState({
		fileUuid: props.fileUuid,
		folderUuid: props.folderUuid,
		isDraft: props.isDraft,
	});

	const isMetadataUpgradeError = datasetUpgradeMetadataStatusData?.metadata_upgrade_status === 'ERROR';
	const hasUpgradeableMetadata = Boolean(datasetUpgradeMetadataStatusData?.has_upgradeable_metadata_templates);
	const canShowUpgradeAction =
		!props.isDraft && canEdit && !isFileLocked && !isMobile && (hasUpgradeableMetadata || isMetadataUpgradeError);

	const isDiffLoading = hasDiff && (diffQuery.isLoading || compareMetadata.isLoading);
	const diffError = diffQuery.error ?? compareMetadata.error;
	const { isLocked, markUpgradeStatusAsError, setLocked, setUnlocked, upgradeMetadata, upgradeStatusQueryKey } =
		useFileMetadataLockUpgradeActions({ fileUuid: props.fileUuid });

	return (
		<>
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
			<Tabs className="gap-6" defaultSelectedKey="additional-metadata">
				<TabList>
					<Tab id="file-metadata">
						File metadata
						<span className="flex h-4 min-w-3.5 place-content-center place-items-center rounded-2xl bg-base-neutral-700 px-1 text-base-label-xs text-base-neutral-40 tabular-nums dark:bg-base-neutral-200 dark:text-base-neutral-900">
							{datasetVersionData?.version_file?.metadata?.length}
						</span>
					</Tab>
					<Tab id="additional-metadata">
						Additional metadata
						<span className="flex h-4 min-w-3.5 place-content-center place-items-center rounded-2xl bg-base-neutral-700 px-1 text-base-label-xs text-base-neutral-40 tabular-nums dark:bg-base-neutral-200 dark:text-base-neutral-900">
							{datasetVersionData?.metadata?.length}
						</span>
					</Tab>
				</TabList>
				<TabPanel id="file-metadata">
					<div className="flex flex-col gap-6">
						<div className="flex flex-col gap-3">
							{fileMetadataFields.map((metadata) => (
								<div
									className="flex flex-col gap-1 rounded-sm border border-base-neutral-100 p-4 dark:border-base-neutral-700"
									key={metadata.pk}
								>
									<MetadataField entry={metadata} />
								</div>
							)) ?? null}
						</div>
					</div>
				</TabPanel>
				<TabPanel id="additional-metadata">
					<div className="flex flex-col gap-6">
						<div className="flex place-content-between place-items-center gap-2 px-4">
							<span className="text-base-neutral-600 dark:text-base-neutral-300">
								User-defined collection of additional metadata.
							</span>
							<div className="flex place-items-center gap-2">
								{canShowUpgradeAction ? (
									<Tooltip delay={400}>
										<TooltipTrigger
											isDisabled={isFileLocked}
											onPress={async () => {
												if (isMetadataUpgradeError) {
													setIsResolveUpgradeConflictOpen(true);
													return;
												}

												if (!props.folderUuid || !props.projectUuid) {
													return;
												}

												const status = await isLocked();
												if (status?.locked) {
													setIsEditLockOpen(true);
													return;
												}

												await setLocked();
												try {
													await upgradeMetadata();
													router.refresh();
												} catch (error) {
													logger.warn(LogCategory.Metadata, 'Metadata upgrade requires conflict resolution', {
														fileUuid: props.fileUuid,
														error: error instanceof Error ? error.message : String(error),
													});
													markUpgradeStatusAsError();
													await queryClient.invalidateQueries({ queryKey: upgradeStatusQueryKey });
													setIsUpgradeConflictPromptOpen(true);
												} finally {
													await setUnlocked();
												}
											}}
											className={
												isMetadataUpgradeError
													? 'bg-base-sunset-300 text-base-neutral-900 hover:bg-base-sunset-500 focus-visible:bg-base-sunset-500 dark:bg-base-sunset-700 dark:text-base-neutral-40 dark:hover:bg-base-sunset-500 dark:focus-visible:bg-base-sunset-500 pressed:bg-base-sunset-600 pressed:text-base-neutral-40 dark:pressed:bg-base-sunset-400 dark:pressed:text-base-neutral-900'
													: undefined
											}
											size="icon-sm"
											variant="crystal-tonal"
										>
											<RefreshCcwIcon aria-hidden size={18} strokeWidth={1.5} />
										</TooltipTrigger>
										<TooltipContent variant="plain">
											{isMetadataUpgradeError ? 'Resolve metadata template conflicts' : 'Upgrade metadata template'}
										</TooltipContent>
									</Tooltip>
								) : null}

								{hasDiff || !canEdit || isMobile || isFileLocked ? null : (
									<Button
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
										size="icon-sm"
										variant="tonal"
									>
										<PencilIcon aria-hidden size={18} strokeWidth={1.5} />
									</Button>
								)}
							</div>
						</div>
						<FileMetadataAdditionalMetadataPanelContent
							diffError={diffError}
							hasDiff={hasDiff}
							hasMetadataDiffEntries={hasMetadataDiffEntries}
							isDiffLoading={isDiffLoading}
							metadataDiffTimeline={metadataDiffTimeline}
							metadataFields={metadataFields}
							showDiff={showDiff}
						/>
					</div>
				</TabPanel>
			</Tabs>
			{props.isDraft ? null : (
				<FileEditLockDialog fileUuid={props.fileUuid} isOpen={isEditLockOpen} onOpenChange={setIsEditLockOpen} />
			)}
			{!props.isDraft && (
				<>
					<ModalContent
						aria-label="Automatic metadata upgrade failed due to conflicts."
						isOpen={isUpgradeConflictPromptOpen}
						onOpenChange={setIsUpgradeConflictPromptOpen}
					>
						<ModalHeader className="flex flex-row place-items-center gap-2 text-base-xl" hasBorder>
							<ModalTitle className="text-base-xl">Automatic upgrade unsuccessful</ModalTitle>
						</ModalHeader>
						<ModalBody>
							Automatic metadata upgrade was unsuccessful because of conflicts.
							<br />
							<br />
							Do you want to resolve the conflicts now?
						</ModalBody>
						<ModalFooter>
							<Button
								onPress={async () => {
									setIsUpgradeConflictPromptOpen(false);
									markUpgradeStatusAsError();
									await queryClient.invalidateQueries({ queryKey: upgradeStatusQueryKey });
								}}
								variant="secondary-discreet"
							>
								Later
							</Button>
							<Button
								onPress={() => {
									setIsUpgradeConflictPromptOpen(false);
									setIsResolveUpgradeConflictOpen(true);
								}}
								variant="filled"
							>
								Resolve now
							</Button>
						</ModalFooter>
					</ModalContent>
					<FileResolveMetadataUpgradeConflictDialog
						fileUuid={props.fileUuid}
						isOpen={isResolveUpgradeConflictOpen}
						latestVersionPk={latestId}
						onOpenChange={setIsResolveUpgradeConflictOpen}
					/>
				</>
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

	if (!datasetVersionData?.version_file) {
		return null;
	}

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
								className="max-h-[calc(100dvh-200px)]"
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
		<div className="flex h-[104px] w-[104px] shrink-0 place-content-center place-items-center rounded-lg bg-base-neutral-100 dark:bg-base-neutral-700">
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
				params: { path: { id: datasetData.latest_version?.pk ?? '' } },
			},
			{ enabled: Boolean(datasetData.latest_version) },
		),
	);

	const { canEdit: canUploadFiles, isFileLocked } = useFileLockAndEditAccessState({
		fileUuid: props.fileUuid,
		folderUuid: props.folderUuid,
		isDraft: props.isDraft,
	});

	const { data: folderData } = useQuery(
		$api.queryOptions(
			'get',
			'/api/v1/folder/{id}/',
			{ params: { path: { id: props.folderUuid ?? '' } } },
			{ enabled: Boolean(props.folderUuid) },
		),
	);

	const isLatestVersionSelected = Boolean(!queryState || queryState === datasetData.latest_version?.pk);

	return canUploadFiles ? (
		<>
			<UpdateUploadDropZone
				className="hidden w-full 2xl:block print:hidden"
				fileName={datasetData.display_name}
				fileUuid={props.fileUuid}
				folderName={folderData?.name}
				folderUuid={props.folderUuid}
				isDisabled={isFileLocked || !isLatestVersionSelected}
				projectUuid={props.projectUuid}
			>
				<div
					className={cx(
						'global-dropzone-border flex h-full w-full flex-col place-content-center place-items-center gap-2 rounded-xl bg-base-lavender-100/64 p-px px-6 group-disabled:bg-transparent dark:bg-base-lavender-800/64',
						isFileLocked || !isLatestVersionSelected ? 'global-dropzone-border-disabled' : '',
						// eslint-disable-next-line no-negated-condition
						!datasetVersionData?.version_file
							? 'global-dropzone-border-file-missing bg-base-tangerine-100/64 py-6 dark:bg-base-tangerine-800/64'
							: '',
					)}
				>
					{/* eslint-disable-next-line no-negated-condition */}
					{!datasetVersionData?.version_file ? (
						<div className="flex place-items-center gap-2">
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
					) : null}
					<div
						className={cx(
							'flex place-items-center gap-2',
							// eslint-disable-next-line no-negated-condition
							!datasetVersionData?.version_file ? 'flex-row' : 'flex-col',
						)}
					>
						<span
							className={cx(
								'text-base-lavender-600 group-disabled:text-base-neutral-900/38 dark:text-base-lavender-200 dark:group-disabled:text-base-neutral-40/38',
								// eslint-disable-next-line no-negated-condition
								!datasetVersionData?.version_file ? 'text-base-tangerine-800 dark:text-base-tangerine-100' : '',
							)}
						>
							{datasetVersionData?.version_file
								? 'Drag and drop to update this file or'
								: 'Drag and drop a file here or'}
						</span>
						<UpdateUploadTrigger
							fileUuid={props.fileUuid}
							folderName={folderData?.name}
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
				</div>
			</UpdateUploadDropZone>
			<UpdateUploadTrigger
				fileUuid={props.fileUuid}
				folderName={folderData?.name}
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
	) : // eslint-disable-next-line no-negated-condition
	!datasetVersionData?.version_file ? (
		<div className="flex w-full place-content-center place-items-center gap-2 rounded-lg bg-base-tangerine-100/62 py-10 dark:bg-base-tangerine-800/64">
			<FileWarningIcon
				aria-hidden
				className="shrink-0 text-base-tangerine-800 dark:text-base-tangerine-100"
				size={24}
				strokeWidth={1.5}
			/>
			<span className="text-base-label-md text-base-tangerine-800 dark:text-base-tangerine-100">File is missing</span>
		</div>
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

	return <EditLockDialog {...props} lockedByEmail={lockData?.locked_by?.email} />;
}

export function FileLockAlert({ fileUuid, ...props }: { readonly className?: string; readonly fileUuid: string }) {
	const queryClient = useQueryClient();

	const { currentUserData } = useCurrentUser();

	const messages = useWebSocketMessages();

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
		<LockAlertBanner
			canUnlock={canUnlock}
			className={props.className}
			lockedBy={lockData.locked_by?.email ?? lockMessage?.user}
			onUnlock={setUnlocked}
		/>
	) : null;
}

export function FileImportDialog({ fileUuid, ...props }: ModalOverlayProps & { readonly fileUuid: string }) {
	const queryClient = useQueryClient();
	const [selectedFileNames, setSelectedFileNames] = useState<string[]>([]);
	const [showAllFiles, setShowAllFiles] = useState(false);

	const {
		register,
		handleSubmit,
		setValue,
		setError,
		clearErrors,
		reset,
		watch,
		formState: { errors },
	} = useForm<{ rawJson: string }>({
		defaultValues: { rawJson: '' },
	});

	const rawJson = watch('rawJson') ?? '';
	const rootErrorMessage = errors.root?.message?.toString();
	const rawJsonField = register('rawJson');

	useEffect(() => {
		if (!props.isOpen) {
			reset({ rawJson: '' });
			setSelectedFileNames([]);
			setShowAllFiles(false);
			clearErrors();
		}
	}, [props.isOpen, reset, clearErrors]);

	const { mutate, isPending } = useMutation({
		mutationFn: async (input: { rawJson: string }) => {
			const importedMetadata = parseMetadataImportPayload(input.rawJson);

			const {
				data: datasetData,
				error: datasetError,
				response: datasetResponse,
			} = await openAPIClient.GET('/api/v1/uploads-dataset/{id}/', {
				params: { path: { id: fileUuid } },
			});
			if (datasetError) {
				throw new Error(formatErrorMessage(datasetError, datasetResponse));
			}

			const latestVersionUuid = datasetData?.latest_version?.pk;
			let existingMetadata: components['schemas']['UploadsVersion']['metadata'] = undefined;
			if (latestVersionUuid) {
				const {
					data: versionData,
					error: versionError,
					response: versionResponse,
				} = await openAPIClient.GET('/api/v1/uploads-version/{id}/', {
					params: { path: { id: latestVersionUuid } },
				});
				if (versionError) {
					throw new Error(formatErrorMessage(versionError, versionResponse));
				}

				existingMetadata = versionData?.metadata;
			}

			const metadataWithOrder = buildImportedMetadataVersionPayload({
				existingMetadata,
				importedMetadata,
			});

			const { error: metadataError, response: metadataResponse } = await openAPIClient.POST(
				'/api/v1/uploads-dataset/{id}/version/',
				{
					params: { path: { id: fileUuid } },
					body: { metadata: trimMetadataPayload(metadataWithOrder) },
				},
			);

			if (metadataError) {
				throw new Error(formatErrorMessage(metadataError, metadataResponse));
			}
		},
		async onSuccess() {
			logger.info(LogCategory.File, 'Metadata imported', {
				fileUuid,
				source: selectedFileNames.length ? 'file' : 'paste',
			});

			await queryClient.invalidateQueries({
				queryKey: $api.queryOptions('get', '/api/v1/uploads-dataset/{id}/', {
					params: { path: { id: fileUuid } },
				}).queryKey,
			});
			props.onOpenChange?.(false);
		},
		onError(error) {
			setError('root', {
				type: 'custom',
				message: error.message,
			});
		},
	});

	const onSubmit = handleSubmit(({ rawJson }) => {
		const trimmedJson = rawJson.trim();

		if (!trimmedJson) {
			setError('root', {
				type: 'custom',
				message: 'Provide metadata JSON by selecting a file or pasting the content below.',
			});
			return;
		}

		clearErrors('root');
		mutate({ rawJson: trimmedJson });
	});

	const handleFileSelect = async (files: FileList | null) => {
		if (!files?.length) {
			return;
		}

		try {
			const filesArray = Array.from(files);

			const parsedPayloads = await Promise.all(
				filesArray.map(async (file) => {
					const fileContents = await file.text();

					try {
						return {
							name: file.name,
							metadata: parseMetadataImportPayload(fileContents),
						};
					} catch (error) {
						throw new Error(
							`${file.name}: ${error instanceof Error ? error.message : 'Unable to parse file contents.'}`,
						);
					}
				}),
			);

			const mergedMetadata = parsedPayloads.flatMap((payload) => payload.metadata);

			setValue('rawJson', JSON.stringify(mergedMetadata, null, 2), { shouldDirty: true });
			setSelectedFileNames(parsedPayloads.map((payload) => payload.name));
			setShowAllFiles(false);
			clearErrors('root');
		} catch (error) {
			setError('root', {
				type: 'custom',
				message: error instanceof Error ? error.message : 'Unable to read the selected files. Please try again.',
			});
			setSelectedFileNames([]);
			setShowAllFiles(false);
		}
	};

	const maxVisibleFiles = 12;
	const hasSelectedFiles = selectedFileNames.length > 0;
	const hasMoreFiles = selectedFileNames.length > maxVisibleFiles;
	const visibleFileNames = showAllFiles ? selectedFileNames : selectedFileNames.slice(0, maxVisibleFiles);
	const { formProps, submitButtonProps } = useDialogForm('file-import-metadata');

	const canSubmit = Boolean(rawJson.trim()) && !isPending;

	return (
		<ModalContent
			{...props}
			aria-label="Import file metadata"
			className="max-sm:flex max-sm:grow max-sm:rounded-none max-sm:[--visual-viewport-vertical-padding:0px]"
			closeButton={false}
			overlay={{ className: 'max-sm:p-0 max-sm:flex max-sm:flex-col' }}
		>
			<ModalHeader className="flex flex-row place-items-center gap-2 text-base-xl" hasBorder>
				<DialogCloseIcon className="max-sm:relative max-sm:inset-0" isDismissable />
				<FolderInputIcon aria-hidden className="max-sm:hidden" size={24} strokeWidth={1.5} />
				<ModalTitle className="text-base-xl">Import file metadata</ModalTitle>
			</ModalHeader>
			<ModalBody>
				<Form {...formProps} onSubmit={onSubmit} className="flex flex-col gap-6">
					{rootErrorMessage ? (
						<Alert>
							<AlertCircleIcon aria-hidden className="shrink-0" size={20} strokeWidth={1.5} />
							{rootErrorMessage}
						</Alert>
					) : null}

					<div className="flex flex-col gap-4">
						<div className="flex gap-4">
							<p className="text-base-label-md">
								Upload a .json file <span className="text-base-md">to replace current additional metadata</span>
							</p>
							<Separator className="mx-0 grow" />
						</div>
						<p className="text-base-sm">
							Selecting a file populates the text area so you can{' '}
							<span className="text-base-label-sm">review before importing</span>.
						</p>
					</div>

					<div className="flex flex-col gap-4">
						<div className="flex flex-wrap place-items-center gap-y-2">
							<FileTrigger acceptedFileTypes={['application/json', '.json']} allowsMultiple onSelect={handleFileSelect}>
								<Button
									isDisabled={isPending}
									type="button"
									variant={hasSelectedFiles ? 'outline' : 'secondary-filled'}
								>
									<FileInputIcon aria-hidden data-slot="icon" size={18} strokeWidth={1.5} />
									{hasSelectedFiles ? 'Update files' : 'Select files'}
								</Button>
							</FileTrigger>
							<ul className="list-disc pl-6 text-base-sm text-base-neutral-600 dark:text-base-neutral-300">
								<li>Only .json files are supported</li>
								<li>Selecting multiple files merges their metadata</li>
							</ul>
						</div>
						{hasSelectedFiles ? (
							<div className="flex flex-col gap-1 rounded-lg border border-base-neutral-100 bg-base-neutral-60 p-4 dark:border-base-neutral-700 dark:bg-base-neutral-700/40">
								<span className="text-base-label-sm text-base-neutral-600 dark:text-base-neutral-300">
									Loaded files
								</span>
								<ul className="list-disc pl-5 text-base-sm text-base-neutral-600 dark:text-base-neutral-300">
									{visibleFileNames.map((name) => (
										<li className="break-all" key={name}>
											{name}
										</li>
									))}
								</ul>
								{hasMoreFiles ? (
									<Button
										className={linkStyles({ className: 'mt-1 place-self-start' })}
										onPress={() => setShowAllFiles((prev) => !prev)}
										type="button"
										variant="unset"
									>
										{showAllFiles ? 'Show less' : 'Show more'}
									</Button>
								) : null}
							</div>
						) : null}
					</div>

					<div className="flex flex-col gap-6">
						<div className="flex gap-4">
							<label className="" htmlFor="metadata-import-textarea">
								or <span className="text-base-label-md">paste JSON</span> to replace current metadata
							</label>
							<Separator className="mx-0 grow" />
						</div>
						<div>
							<textarea
								{...rawJsonField}
								className="min-h-32 w-full rounded-sm border border-base-neutral-300 bg-base-neutral-0 px-3 py-2 text-base-sm text-base-neutral-900 shadow-inner outline-hidden focus:border-base-neutral-500 focus:ring-0 focus:outline-hidden dark:border-base-neutral-500 dark:bg-base-neutral-800 dark:text-base-neutral-40"
								id="metadata-import-textarea"
								onChange={(event) => {
									void rawJsonField.onChange(event);
									setSelectedFileNames([]);
									setShowAllFiles(false);
									clearErrors('root');
								}}
								placeholder='[{ "custom_key": "Location", "value": "Seattle", "field_type": "TEXT" }]'
							/>
							<p className="text-base-sm text-pretty text-base-neutral-600 dark:text-base-neutral-300">
								Accepts either a JSON array of metadata entries or an object with a top-level "metadata" array.
							</p>
						</div>
					</div>
				</Form>
			</ModalBody>
			<ModalFooter hasBorder>
				<ModalClose isDisabled={isPending} variant="secondary-discreet">
					Cancel
				</ModalClose>
				<Button {...submitButtonProps} isDisabled={!canSubmit} variant="filled">
					<FolderInputIcon aria-hidden data-slot="icon" size={18} strokeWidth={1.5} />
					Import
				</Button>
			</ModalFooter>
		</ModalContent>
	);
}

export function FileExportDialog({
	versionUuid,
	filename,
	...props
}: ModalOverlayProps & {
	readonly filename: string;
	readonly versionUuid: string;
}) {
	return (
		<ExportJobDialog
			{...props}
			description={
				<>
					Export available data from the <span className="text-base-label-md">current version</span> of "{filename}" to
					a zip file (e.g. file, file metadata, additional metadata).
				</>
			}
			exportType={EXPORT_TYPES.UploadsVersion}
			title="Export data from current version"
			uuids={[versionUuid]}
		/>
	);
}

export function FileDownloadDialog({
	versionUuid,
	filename,
	...props
}: ModalOverlayProps & {
	readonly filename: string;
	readonly versionUuid: string;
}) {
	const env = useEnv();

	const downloadUrl = `${env.BASE_API_URL}/api/v1/uploads-version/${versionUuid}/download/?as_attachment=true`;

	// Fetch file size via HEAD request
	const { data: fileSize } = useQuery({
		queryKey: ['file-size', versionUuid],
		queryFn: async () => fetchFileSize(downloadUrl),
		enabled: Boolean(versionUuid),
	});

	const downloadCapability = getDownloadCapability(fileSize);
	const isBlocked = downloadCapability.capability === DownloadCapability.Blocked;
	const showWarning = downloadCapability.capability === DownloadCapability.WarningRecommended;

	const handleDownload = () => {
		const link = document.createElement('a');
		link.href = downloadUrl;
		link.rel = 'noreferrer noopener external';
		link.target = '_blank';
		link.click();
		link.remove();
		props.onOpenChange?.(false);
	};

	return (
		<ModalContent {...props} aria-label={`Download "${filename}"`}>
			<ModalHeader className="flex flex-row place-items-center gap-3 text-base-xl">
				<FileDownIcon aria-hidden size={24} strokeWidth={1.5} />
				<ModalTitle className="text-base-xl">Download current version</ModalTitle>
			</ModalHeader>
			<ModalBody className="gap-4 py-0">
				<p className="text-pretty break-all">
					Download the <span className="text-base-label-md">current version</span> of "{filename}".
				</p>
				{fileSize ? (
					<p className="text-base-sm text-base-neutral-600 dark:text-base-neutral-300">
						File size: {convertDataRateLog(fileSize)}
					</p>
				) : null}
				{showWarning ? (
					<Alert variant="warning">
						<AlertTriangleIcon aria-hidden className="shrink-0" size={24} strokeWidth={1.5} />
						This is a large file. Download may be slow and use significant memory. For better performance, use Chrome or
						Edge.
					</Alert>
				) : null}
				{isBlocked ? (
					<Alert>
						<AlertCircleIcon aria-hidden className="shrink-0" size={24} strokeWidth={1.5} />
						This file is too large to download in your browser. Please use Chrome or Edge for files over 2 GB.
					</Alert>
				) : null}
			</ModalBody>
			<ModalFooter>
				<ModalClose variant="secondary-discreet">Cancel</ModalClose>
				<Button isDisabled={isBlocked} onPress={handleDownload} type="submit" variant="filled">
					<FileDownIcon aria-hidden data-slot="icon" size={18} strokeWidth={1.5} />
					Download
				</Button>
			</ModalFooter>
		</ModalContent>
	);
}

export function FileDeleteDialog({
	fileUuid,
	filename,
	redirectUrl,
	...props
}: ModalOverlayProps & { readonly fileUuid: string; readonly filename: string; readonly redirectUrl?: Route }) {
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
			logger.info(LogCategory.File, 'File deleted', {
				fileUuid,
				filename,
			});

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
			logger.error(LogCategory.File, 'Delete failed', {
				fileUuid,
				error: error instanceof Error ? error.message : String(error),
			});
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

export function BulkFileUpgradeDialog({
	selected,
	folderUuid,
	...props
}: ModalOverlayProps & { readonly folderUuid?: string; readonly selected: string[] }) {
	const exitBulkMode = useExitFilesBulkMode();
	const queryClient = useQueryClient();

	const { mutate, error, isPending } = useMutation({
		mutationFn: async () => {
			const { error } = await openAPIClient.POST('/api/v1/uploads-dataset/bulk-upgrade-metadata/', {
				body: {
					uploads_datasets: selected,
				},
			});

			if (error) {
				throw new Error(formatErrorMessage(error));
			}
		},
		async onSuccess() {
			logger.info(LogCategory.File, 'Bulk metadata upgrade triggered', {
				count: selected.length,
			});

			props.onOpenChange?.(false);

			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: $api.queryOptions('get', '/api/v1/uploads-dataset/').queryKey,
				}),
				folderUuid
					? queryClient.invalidateQueries({
							queryKey: $api.queryOptions('get', '/api/v1/folder/{id}/', {
								params: { path: { id: folderUuid } },
							}).queryKey,
						})
					: Promise.resolve(),
			]);

			await exitBulkMode();

			globalToastQueue.add(
				{
					type: ToastType.Success,
					message: `Metadata upgrade triggered for ${selected.length} file${selected.length === 1 ? '' : 's'}.`,
				},
				{ timeout: 5_000 },
			);
		},
		onError(error) {
			window.scrollTo({ top: 0, behavior: 'instant' });
			logger.error(LogCategory.File, 'Bulk metadata upgrade failed', {
				count: selected.length,
				error: error instanceof Error ? error.message : String(error),
			});
		},
	});

	return (
		<ModalContent {...props} role="alertdialog">
			<ModalHeader>Upgrade metadata for selected files?</ModalHeader>
			<ModalBody>
				{error && (
					<Alert className="mb-6">
						<AlertCircleIcon aria-hidden className="shrink-0" size={24} strokeWidth={1.5} />
						{error?.message}
					</Alert>
				)}
				This will trigger a metadata template upgrade for the {selected.length} selected file
				{selected.length === 1 ? '' : 's'}. Files without available upgrades will be skipped.
			</ModalBody>
			<ModalFooter>
				<ModalClose variant="secondary-discreet">Cancel</ModalClose>
				<Button isDisabled={isPending} onPress={() => mutate()} type="submit" variant="filled">
					<RefreshCcwIcon aria-hidden size={18} strokeWidth={1.5} /> Upgrade
				</Button>
			</ModalFooter>
		</ModalContent>
	);
}

export function BulkFileDeleteDialog({
	selected,
	redirectUrl,
	folderUuid,
	...props
}: ModalOverlayProps & { readonly folderUuid?: string; readonly redirectUrl?: Route; readonly selected: string[] }) {
	const exitBulkMode = useExitFilesBulkMode();
	const router = useRouter();
	const queryClient = useQueryClient();

	const { mutate, error } = useMutation({
		mutationFn: async () => {
			const { data: datasetData, error } = await openAPIClient.POST('/api/v1/uploads-dataset/bulk-delete/', {
				body: {
					uploads_datasets: selected,
				},
			});

			if (error) {
				throw new Error(formatErrorMessage(error));
			}

			const successCount = datasetData?.success.length ?? 0;
			const errorCount = datasetData?.error.length ?? 0;

			// API returns 200 with { success: [], error: [...] } when every selected file
			// was rejected (e.g. deletion period elapsed). Surface that as a mutation error
			// so the existing inline <Alert /> renders and the modal stays open.
			if (successCount === 0 && errorCount > 0) {
				throw new Error(
					`${errorCount} file${errorCount === 1 ? '' : 's'} could not be deleted. The deletion period may have elapsed.`,
				);
			}

			return { successCount, errorCount };
		},
		async onSuccess({ successCount, errorCount }) {
			logger.info(LogCategory.File, 'Bulk files deleted', {
				count: successCount,
				failedCount: errorCount,
			});

			props.onOpenChange?.(false);

			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: $api.queryOptions('get', '/api/v1/uploads-dataset/').queryKey,
				}),
				folderUuid
					? queryClient.invalidateQueries({
							queryKey: $api.queryOptions('get', '/api/v1/folder/{id}/', {
								params: { path: { id: folderUuid } },
							}).queryKey,
						})
					: Promise.resolve(),
			]);

			await exitBulkMode();

			if (errorCount > 0) {
				globalToastQueue.add(
					{
						message: `${successCount} file${successCount === 1 ? '' : 's'} deleted. ${errorCount} could not be deleted (deletion period may have elapsed).`,
						type: ToastType.Error,
					},
					{ timeout: 5_000 },
				);
			} else {
				globalToastQueue.add(
					{
						message: `${successCount} file${successCount === 1 ? '' : 's'} deleted.`,
						type: ToastType.Success,
					},
					{ timeout: 2_500 },
				);
			}

			if (redirectUrl && errorCount === 0) {
				router.push(redirectUrl);
			}
		},
		onError(error) {
			window.scrollTo({ top: 0, behavior: 'instant' });
			logger.error(LogCategory.File, 'Bulk delete failed', {
				count: selected.length,
				error: error instanceof Error ? error.message : String(error),
			});
		},
	});

	return (
		<ModalContent {...props} role="alertdialog">
			<ModalHeader>Do you really want to bulk delete the selected items?</ModalHeader>
			<ModalBody>
				{error && (
					<Alert className="mb-6">
						<AlertCircleIcon aria-hidden className="shrink-0" size={24} strokeWidth={1.5} />
						{error?.message}
					</Alert>
				)}
				Upon confirmation, the items will be permanently deleted.
			</ModalBody>
			<ModalFooter>
				<ModalClose variant="secondary-discreet">Cancel</ModalClose>
				<Button onPress={() => mutate()} type="submit" variant="filled">
					<TrashIcon aria-hidden size={18} strokeWidth={1.5} /> Delete
				</Button>
			</ModalFooter>
		</ModalContent>
	);
}
