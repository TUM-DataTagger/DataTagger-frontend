'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { AlertCircleIcon, BlocksIcon, ChevronRightIcon, FolderIcon, PackageIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Key, ModalOverlayProps } from 'react-aria-components';
import { useMediaQuery } from 'usehooks-ts';
import { EditLockDialog } from '@/components/EditLockDialog';
import { LockAlertBanner } from '@/components/LockAlertBanner';
import { StackedSubtitle } from '@/components/StackedSubtitle';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { GridList, GridListItem } from '@/components/ui/GridList';
import { Link } from '@/components/ui/Link';
import { ModalBody, ModalClose, ModalContent, ModalFooter, ModalHeader, ModalTitle } from '@/components/ui/Modal';
import { Tag, TagGroup } from '@/components/ui/TagGroup';
import { useWebSocketMessages } from '@/contexts/WebSocket';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { cx } from '@/styles/cva';
import { buttonStyles } from '@/styles/ui/button';
import { $api, openAPIClient } from '@/util/clientFetch';
import { formatErrorMessage } from '@/util/formatErrorMessage';
import type { components } from '@/util/openapiSchema';

type MetadataTemplateContainerBadgeBaseProps = {
	readonly className?: string | undefined;
	readonly contentType?: 'folders.folder' | 'projects.project' | 'uploads.uploadsdataset' | null | undefined;
	readonly name?: string | null | undefined;
	readonly projectUuid?: string | undefined;
	readonly uuid?: string | null | undefined;
};

function MetadataTemplateContainerBadgeBase({
	className,
	contentType,
	isLink,
	name,
	projectUuid,
	uuid,
}: MetadataTemplateContainerBadgeBaseProps & { readonly isLink: boolean }) {
	const isMobile = useMediaQuery('(max-width: 600px)', { initializeWithValue: false });

	return (
		<TagGroup aria-label={name ?? 'Global'}>
			<Tag
				className={cx(
					'max-w-[100ch]',
					isMobile && 'max-w-[30ch]',
					isLink ? 'cursor-pointer' : 'select-none',
					className,
				)}
				color={isLink && contentType ? 'lavender' : 'neutral'}
				href={
					isLink && contentType === 'projects.project'
						? `/projects/${projectUuid}`
						: contentType === 'folders.folder'
							? `/projects/${projectUuid}/folders/${uuid}`
							: undefined!
				}
				target={contentType ? '_blank' : '_self'}
				textValue={name ?? 'Global'}
			>
				{contentType === 'projects.project' ? (
					<PackageIcon aria-hidden className="shrink-0" size={18} strokeWidth={1.5} />
				) : contentType === 'folders.folder' ? (
					<FolderIcon aria-hidden className="shrink-0" size={18} strokeWidth={1.5} />
				) : null}
				<span className="truncate" title={name ?? 'Global'}>
					{name ?? 'Global'}
				</span>
			</Tag>
		</TagGroup>
	);
}

export function MetadataTemplateContainerBadge(props: MetadataTemplateContainerBadgeBaseProps) {
	return <MetadataTemplateContainerBadgeBase {...props} isLink={false} />;
}

export function MetadataTemplateContainerBadgeLink(props: MetadataTemplateContainerBadgeBaseProps) {
	return <MetadataTemplateContainerBadgeBase {...props} isLink />;
}

export function MetadataTemplateContainerHeading(props: { readonly metadataTemplateContainerUuid: string }) {
	const { data: metadataTemplateData } = useSuspenseQuery(
		$api.queryOptions('get', '/api/v1/metadata-template-container/{id}/', {
			params: { path: { id: props.metadataTemplateContainerUuid } },
		}),
	);

	return (
		<h1 className="flex place-items-center gap-3 text-base-heading-xs">
			<BlocksIcon aria-hidden className="shrink-0" size={24} strokeWidth={1.5} />
			{metadataTemplateData.name}
		</h1>
	);
}

function getDescriptionLines(container: components['schemas']['MetadataTemplateContainer']): string[] {
	const contentType = container?.assigned_to_content_type;
	const projectName = container?.project?.name;
	const folderName = container?.assigned_to_content_object_name;

	if (contentType === 'projects.project') {
		return projectName ? [`Project: ${projectName}`] : [];
	}

	if (contentType === 'folders.folder') {
		const lines: string[] = [];
		if (projectName) {
			lines.push(`Project: ${projectName}`);
		}
		if (folderName) {
			lines.push(`Folder: ${folderName}`);
		}
		return lines;
	}

	return ['Global'];
}

type MetadataTemplateContainerPoolDialogProps = ModalOverlayProps & {
	readonly folderUuid?: string | undefined;
	readonly projectUuid: string;
};

function MetadataTemplateContainerPoolDialog(
	props: MetadataTemplateContainerPoolDialogProps & {
		readonly mode: 'assign' | 'browse';
	},
) {
	const [selectedContainerKeys, setSelectedContainerKeys] = useState<Set<Key | string>>(new Set());
	const [rootError, setRootError] = useState<string | null>(null);
	const queryClient = useQueryClient();

	const { data: metadataTemplatePoolData } = useQuery(
		$api.queryOptions(
			'get',
			props.folderUuid
				? '/api/v1/folder/{id}/metadata-template-container-pool/'
				: '/api/v1/project/{id}/metadata-template-container-pool/',
			{ params: { path: { id: props.folderUuid ?? props.projectUuid } } },
			{ enabled: Boolean(props.isOpen), placeholderData: keepPreviousData },
		),
	);

	const { data: projectData } = useQuery(
		$api.queryOptions(
			'get',
			'/api/v1/project/{id}/',
			{ params: { path: { id: props.projectUuid } } },
			{ enabled: Boolean(props.isOpen && props.projectUuid), placeholderData: keepPreviousData },
		),
	);

	const { data: folderData } = useQuery(
		$api.queryOptions(
			'get',
			'/api/v1/folder/{id}/',
			{ params: { path: { id: props.folderUuid ?? '' } } },
			{ enabled: Boolean(props.isOpen && props.folderUuid), placeholderData: keepPreviousData },
		),
	);

	const { data: projectMetadataTemplateContainers } = useQuery(
		$api.queryOptions(
			'get',
			'/api/v1/project/{id}/metadata-template-container/',
			{ params: { path: { id: props.projectUuid } } },
			{ enabled: Boolean(props.isOpen && props.projectUuid && !props.folderUuid) },
		),
	);

	const { data: folderMetadataTemplateContainers } = useQuery(
		$api.queryOptions(
			'get',
			'/api/v1/folder/{id}/metadata-template-container/',
			{ params: { path: { id: props.folderUuid ?? '' } } },
			{ enabled: Boolean(props.isOpen && props.folderUuid) },
		),
	);

	const metadataTemplateContainers = props.folderUuid
		? (folderMetadataTemplateContainers ?? [])
		: (projectMetadataTemplateContainers ?? []);

	useEffect(() => {
		if (!props.isOpen) {
			return;
		}

		const preselectedKeys = new Set<Key | string>(
			(metadataTemplatePoolData ?? []).map((container: { pk: string }) => container.pk),
		);
		const activeContainerPk = (
			props.folderUuid
				? folderData?.metadata_template?.metadata_template_container?.pk
				: projectData?.metadata_template?.metadata_template_container?.pk
		) as string | undefined;
		if (activeContainerPk) {
			preselectedKeys.add(activeContainerPk);
		}

		setSelectedContainerKeys(preselectedKeys);
	}, [
		props.isOpen,
		metadataTemplatePoolData,
		folderData?.metadata_template?.metadata_template_container?.pk,
		projectData?.metadata_template?.metadata_template_container?.pk,
		props.folderUuid,
	]);

	const { mutate, isPending } = useMutation({
		mutationFn: async () => {
			const selectedIds = Array.from(new Set(selectedContainerKeys)) as string[];

			const { error, response } = await openAPIClient.PUT(
				props.folderUuid
					? '/api/v1/folder/{id}/metadata-template-container-pool/'
					: '/api/v1/project/{id}/metadata-template-container-pool/',
				{
					params: { path: { id: props.folderUuid ?? props.projectUuid } },
					body: { metadata_template_container: selectedIds },
				},
			);

			if (error) {
				throw new Error(formatErrorMessage(error, response));
			}
		},
		async onSuccess() {
			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: $api.queryOptions(
						'get',
						props.folderUuid
							? '/api/v1/folder/{id}/metadata-template-container-pool/'
							: '/api/v1/project/{id}/metadata-template-container-pool/',
						{ params: { path: { id: props.folderUuid ?? props.projectUuid } } },
					).queryKey,
				}),
				queryClient.invalidateQueries({
					queryKey: $api.queryOptions('get', props.folderUuid ? '/api/v1/folder/{id}/' : '/api/v1/project/{id}/', {
						params: { path: { id: props.folderUuid ?? props.projectUuid } },
					}).queryKey,
				}),
			]);

			props.onOpenChange?.(false);
			setSelectedContainerKeys(new Set());
			setRootError(null);
		},
		onError(error) {
			window.scrollTo({ top: 0, behavior: 'instant' });
			setRootError(error.message);
		},
	});

	return (
		<ModalContent
			aria-label={
				props.mode === 'browse'
					? `Available ${props.folderUuid ? 'folder' : 'project'} metadata templates`
					: `Add to ${props.folderUuid ? 'folder' : 'project'} metadata template pool`
			}
		>
			<ModalHeader className="flex flex-row place-items-center gap-2 text-base-xl" hasBorder>
				<ModalTitle className="text-base-xl">
					{props.mode === 'browse'
						? `Available ${props.folderUuid ? 'folder' : 'project'} metadata templates`
						: `Add to ${props.folderUuid ? 'folder' : 'project'} metadata template pool`}
				</ModalTitle>
			</ModalHeader>
			<ModalBody className="p-0">
				{rootError ? (
					<Alert className="mb-6 px-4 pt-4">
						<AlertCircleIcon aria-hidden className="shrink-0" size={24} strokeWidth={1.5} />
						{rootError}
					</Alert>
				) : null}

				<GridList
					aria-label="Available metadata template containers"
					disabledBehavior="selection"
					className="overscroll-auto"
					items={metadataTemplateContainers}
					onSelectionChange={(keys) => {
						if (keys instanceof Set) {
							setSelectedContainerKeys(keys);
						}
					}}
					selectedKeys={selectedContainerKeys}
					selectionMode="multiple"
				>
					{(container) => {
						const descriptionLines = getDescriptionLines(container);

						return (
							<GridListItem
								className="max-h-28 min-h-20 px-4 py-3 first:pt-5"
								id={container.pk}
								isDisabled={props.mode === 'browse'}
								key={container.pk}
								textValue={container.name}
							>
								<div className="flex flex-1 gap-2">
									<div className="flex-1">
										<div className="flex max-w-60 flex-col gap-1 md:max-w-80">
											<span className="truncate text-base-label-md" title={container.name}>
												{container.name}
											</span>
											{descriptionLines.length > 0 ? <StackedSubtitle lines={descriptionLines} /> : null}
										</div>
									</div>
								</div>
								<Link
									aria-label="View metadata template"
									className={buttonStyles({ variant: 'discreet', size: 'icon-sm' })}
									href={`/metadata-templates/${container.pk}`}
									target="_blank"
									variant="unset"
								>
									<ChevronRightIcon aria-hidden size={18} strokeWidth={1.5} />
								</Link>
							</GridListItem>
						);
					}}
				</GridList>
			</ModalBody>
			<ModalFooter className="sm:place-content-between" hasBorder>
				<div>
					<span className="h-4 rounded-2xl bg-base-lavender-200 px-1 py-px text-base-label-xs text-base-neutral-900 tabular-nums dark:bg-base-lavender-700 dark:text-base-neutral-40">
						{selectedContainerKeys.size}
					</span>{' '}
					<span className="text-base-xs text-base-neutral-600 dark:text-base-neutral-300">selected</span>
				</div>
				<div className="flex flex-col-reverse place-content-between gap-2 sm:flex-row sm:place-items-center">
					<ModalClose variant={props.mode === 'browse' ? 'filled' : 'secondary-discreet'}>
						{props.mode === 'browse' ? 'Close' : 'Cancel'}
					</ModalClose>
					{props.mode === 'browse' ? null : (
						<Button isDisabled={isPending} onPress={() => mutate()} type="submit" variant="filled">
							Save
						</Button>
					)}
				</div>
			</ModalFooter>
		</ModalContent>
	);
}

export function MetadataTemplateContainerAssignToPoolDialog(props: MetadataTemplateContainerPoolDialogProps) {
	return <MetadataTemplateContainerPoolDialog {...props} mode="assign" />;
}

export function MetadataTemplateContainerBrowsePoolDialog(props: MetadataTemplateContainerPoolDialogProps) {
	return <MetadataTemplateContainerPoolDialog {...props} mode="browse" />;
}

export function MetadataTemplateContainerEditLockDialog({
	metadataTemplateContainerUuid,
	...props
}: ModalOverlayProps & { readonly metadataTemplateContainerUuid: string }) {
	const { data: lockData } = useQuery(
		$api.queryOptions(
			'get',
			'/api/v1/metadata-template-container/{id}/status/',
			{
				params: { path: { id: metadataTemplateContainerUuid } },
			},
			{ enabled: Boolean(props.isOpen) },
		),
	);

	return <EditLockDialog {...props} lockedByEmail={lockData?.locked_by?.email} />;
}

export function MetadataTemplateContainerLockAlert({
	metadataTemplateContainerUuid,
	...props
}: {
	readonly className?: string;
	readonly metadataTemplateContainerUuid: string;
}) {
	const queryClient = useQueryClient();

	const { currentUserData } = useCurrentUser();

	const messages = useWebSocketMessages();

	const { data: lockData } = useSuspenseQuery(
		$api.queryOptions('get', '/api/v1/metadata-template-container/{id}/status/', {
			params: { path: { id: metadataTemplateContainerUuid } },
		}),
	);

	const lockMessage = messages[metadataTemplateContainerUuid]?.find(
		(message) => message.type === 'lock_status_changed',
	)?.data;
	const isLocked = lockMessage?.status === undefined ? Boolean(lockData.locked) : Boolean(lockMessage.status);
	const canUnlock = (lockData.locked_by?.email ?? lockMessage?.user) === currentUserData?.email;

	async function setUnlocked() {
		const { data } = await openAPIClient.POST('/api/v1/metadata-template-container/{id}/unlock/', {
			params: { path: { id: metadataTemplateContainerUuid } },
		});
		await queryClient.invalidateQueries({
			queryKey: $api.queryOptions('get', '/api/v1/metadata-template-container/{id}/status/', {
				params: { path: { id: metadataTemplateContainerUuid } },
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
