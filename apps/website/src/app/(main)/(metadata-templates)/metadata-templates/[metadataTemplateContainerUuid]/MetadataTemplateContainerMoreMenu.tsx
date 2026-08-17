'use client';

import { useQueryClient, useSuspenseQueries } from '@tanstack/react-query';
import { useAtom } from 'jotai';
import { FolderArchiveIcon, HistoryIcon, MoreVerticalIcon, PanelRightOpenIcon, PencilIcon, XIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { parseAsString, useQueryState } from 'nuqs';
import { useState } from 'react';
import { useMediaQuery } from 'usehooks-ts';
import { MetadataTemplateContainerEditLockDialog } from '@/components/metadata-template/MetadataTemplateContainer';
import { MetadataTemplateExportDialog } from '@/components/metadata-template/MetadataTemplateExportDialog';
import {
	MetadataTemplateVersionHistoryCloseIndicator,
	MetadataTemplateVersionHistoryExitDialog,
} from '@/components/metadata-template/MetadataTemplateVersionHistory';
import { Button } from '@/components/ui/Button';
import { Drawer, DrawerBody, DrawerClose, DrawerContent, DrawerTrigger } from '@/components/ui/Drawer';
import { dropdownItemStyles } from '@/components/ui/Dropdown';
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from '@/components/ui/Menu';
import { Separator } from '@/components/ui/Separator';
import { useSidebar } from '@/components/ui/Sidebar';
import { useMetadataTemplatePermissions } from '@/hooks/useMetadataTemplatePermissions';
import { SideSheetMode, sideSheetModeAtom, sideSheetSelectedMetadataTemplateContainerAtom } from '@/stores/sideSheet';
import { cx } from '@/styles/cva';
import { $api, openAPIClient } from '@/util/clientFetch';
import { MetadataTemplateContainerMoreMenuEditNameDialog } from './MetadataTemplateContainerMoreMenuEditNameDialog';

export function MetadataTemplateContainerMoreMenu(props: {
	readonly className?: string;
	readonly metadataTemplateContainerUuid: string;
}) {
	const [queryState] = useQueryState('version', parseAsString);
	const router = useRouter();
	const isMobile = useMediaQuery('(max-width: 600px)', { initializeWithValue: false });
	const queryClient = useQueryClient();
	const [sideSheetMode, setSideSheetMode] = useAtom(sideSheetModeAtom);
	const [sideSheetSelectedMetadataTemplateContainer, setSideSheetSelectedMetadataTemplateContainer] = useAtom(
		sideSheetSelectedMetadataTemplateContainerAtom,
	);
	const { setOpen } = useSidebar();
	const [isEditNameOpen, setIsEditNameOpen] = useState(false);
	const [isEditLockOpen, setIsEditLockOpen] = useState(false);
	const [isExportOpen, setIsExportOpen] = useState(false);
	const [isVersionHistoryExitDialogOpen, setIsVersionHistoryExitDialogOpen] = useState(false);

	const [, metadataTemplateContainerData] = useSuspenseQueries({
		queries: [
			$api.queryOptions('get', '/api/v1/metadata-template-container/{id}/status/', {
				params: { path: { id: props.metadataTemplateContainerUuid } },
			}),
			$api.queryOptions('get', '/api/v1/metadata-template-container/{id}/', {
				params: { path: { id: props.metadataTemplateContainerUuid } },
			}),
		],
	});

	const isVersionHistoryModeActive = Boolean(
		sideSheetMode === SideSheetMode.MetadataTemplateVersionHistory && sideSheetSelectedMetadataTemplateContainer,
	);

	const { isProjectMetadataTemplateAdmin, isFolderAdmin, isGlobalMetadataTemplateAdmin } =
		useMetadataTemplatePermissions({
			metadataTemplateContainerUuid: props.metadataTemplateContainerUuid,
		});

	const canEdit = isProjectMetadataTemplateAdmin || isFolderAdmin || isGlobalMetadataTemplateAdmin;

	const isLatestVersionSelected = Boolean(
		!queryState || queryState === metadataTemplateContainerData.data.latest_metadata_template?.pk,
	);

	async function isLocked() {
		const { data } = await openAPIClient.GET('/api/v1/metadata-template-container/{id}/status/', {
			params: { path: { id: props.metadataTemplateContainerUuid } },
		});
		await queryClient.invalidateQueries({
			queryKey: $api.queryOptions('get', '/api/v1/metadata-template-container/{id}/status/', {
				params: { path: { id: props.metadataTemplateContainerUuid } },
			}).queryKey,
		});

		return data;
	}

	async function setLocked() {
		const { data } = await openAPIClient.POST('/api/v1/metadata-template-container/{id}/lock/', {
			params: { path: { id: props.metadataTemplateContainerUuid } },
		});

		return data;
	}

	return (
		<>
			{isLatestVersionSelected && isMobile ? (
				<div className="flex place-items-center gap-4">
					{isVersionHistoryModeActive ? (
						<Button onPress={() => setOpen((open) => !open)} size="icon" variant="filled">
							<PanelRightOpenIcon aria-hidden data-slot="icon" size={18} strokeWidth={1.5} />
						</Button>
					) : null}
					<div>
						<Drawer withNotch={false}>
							<DrawerTrigger aria-label="More menu" size="icon" variant="filled">
								<MoreVerticalIcon aria-hidden size={24} strokeWidth={1.5} />
							</DrawerTrigger>
							<DrawerContent aria-label="More menu">
								<DrawerBody>
									{isVersionHistoryModeActive ? (
										<DrawerClose
											aria-label="Exit version history"
											className={dropdownItemStyles({ className: 'text-base-sm flex place-content-start gap-2' })}
											onPress={() => setIsVersionHistoryExitDialogOpen(true)}
											variant="unset"
										>
											<XIcon aria-hidden data-slot="icon" size={18} strokeWidth={1.5} /> Exit version history
										</DrawerClose>
									) : (
										<DrawerClose
											aria-label="Show version history"
											className={dropdownItemStyles({ className: 'text-base-sm flex place-content-start gap-2' })}
											id="show-version-history"
											onPress={() => {
												setSideSheetMode(SideSheetMode.MetadataTemplateVersionHistory);
												setSideSheetSelectedMetadataTemplateContainer(props.metadataTemplateContainerUuid);
												setOpen(true);
											}}
											variant="unset"
										>
											<HistoryIcon aria-hidden data-slot="icon" size={18} strokeWidth={1.5} /> Show version history
										</DrawerClose>
									)}
									<Separator />
									<DrawerClose
										aria-label="Export metadata template"
										className={dropdownItemStyles({
											className: 'text-base-sm flex place-content-start gap-2',
										})}
										onPress={() => setIsExportOpen(true)}
										variant="unset"
									>
										<FolderArchiveIcon aria-hidden data-slot="icon" size={18} strokeWidth={1.5} /> Export
									</DrawerClose>
									{!isLatestVersionSelected || !canEdit ? null : (
										<>
											<Separator />
											<DrawerClose
												aria-label="Edit name"
												className={dropdownItemStyles({ className: 'text-base-sm flex place-content-start gap-2' })}
												id="edit"
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
												<PencilIcon aria-hidden size={18} strokeWidth={1.5} /> Edit name
											</DrawerClose>
											<DrawerClose
												aria-label="Edit metadata"
												className={dropdownItemStyles({ className: 'text-base-sm flex place-content-start gap-2' })}
												id="edit-metadata-fields"
												onPress={async () => {
													const status = await isLocked();
													if (status?.locked) {
														setIsEditLockOpen(true);
													} else {
														await setLocked();
														router.push(
															`/metadata-templates/${props.metadataTemplateContainerUuid}/edit-metadata-fields`,
														);
													}
												}}
												variant="unset"
											>
												<PencilIcon aria-hidden size={18} strokeWidth={1.5} /> Edit metadata fields
											</DrawerClose>
										</>
									)}
								</DrawerBody>
							</DrawerContent>
						</Drawer>
					</div>
				</div>
			) : isLatestVersionSelected ? (
				<Menu>
					<MenuTrigger
						aria-label="More menu"
						className={cx(
							'hidden md:flex pressed:outline-2 pressed:outline-offset-2 pressed:outline-base-lavender-400 dark:pressed:outline-base-lavender-600',
							props.className,
						)}
						size="icon"
						variant="outline"
					>
						<MoreVerticalIcon aria-hidden size={18} strokeWidth={1.5} />
					</MenuTrigger>
					<MenuContent placement="bottom" popover={{ arrow: false }}>
						{isVersionHistoryModeActive ? (
							<MenuItem
								aria-label="Exit version history"
								id="exit-version-history"
								key="exit-version-history"
								onAction={() => {
									setIsVersionHistoryExitDialogOpen(true);
								}}
							>
								<XIcon aria-hidden size={18} strokeWidth={1.5} /> Exit version history
							</MenuItem>
						) : (
							<MenuItem
								aria-label="Show version history"
								id="show-version-history"
								key="show-version-history"
								onAction={() => {
									setSideSheetMode(SideSheetMode.MetadataTemplateVersionHistory);
									setSideSheetSelectedMetadataTemplateContainer(props.metadataTemplateContainerUuid);
									setOpen(true);
								}}
							>
								<HistoryIcon aria-hidden size={18} strokeWidth={1.5} /> Show version history
							</MenuItem>
						)}
						<MenuSeparator />
						<MenuItem aria-label="Export metadata template" id="export" onAction={() => setIsExportOpen(true)}>
							<FolderArchiveIcon aria-hidden size={18} strokeWidth={1.5} /> Export
						</MenuItem>
						{!isLatestVersionSelected || !canEdit ? null : (
							<>
								<MenuSeparator />
								<MenuItem
									aria-label="Edit name"
									id="edit"
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
									<PencilIcon aria-hidden size={18} strokeWidth={1.5} /> Edit name
								</MenuItem>
								<MenuItem
									aria-label="Edit metadata"
									id="edit-metadata-fields"
									onAction={async () => {
										const status = await isLocked();
										if (status?.locked) {
											setIsEditLockOpen(true);
										} else {
											await setLocked();
											router.push(`/metadata-templates/${props.metadataTemplateContainerUuid}/edit-metadata-fields`);
										}
									}}
								>
									<PencilIcon aria-hidden size={18} strokeWidth={1.5} /> Edit metadata fields
								</MenuItem>
							</>
						)}
					</MenuContent>
				</Menu>
			) : (
				<div className="flex place-items-center gap-4">
					{isMobile ? (
						<Button onPress={() => setOpen((open) => !open)} size="icon" variant="filled">
							<PanelRightOpenIcon aria-hidden data-slot="icon" size={18} strokeWidth={1.5} />
						</Button>
					) : null}
					<MetadataTemplateVersionHistoryCloseIndicator />
				</div>
			)}
			<MetadataTemplateContainerMoreMenuEditNameDialog
				isOpen={isEditNameOpen}
				metadataTemplateContainerUuid={props.metadataTemplateContainerUuid}
				name={metadataTemplateContainerData.data.name}
				onOpenChange={setIsEditNameOpen}
			/>
			<MetadataTemplateExportDialog
				containerName={metadataTemplateContainerData.data.name}
				containerUuids={[props.metadataTemplateContainerUuid]}
				isOpen={isExportOpen}
				onOpenChange={setIsExportOpen}
				title="Export metadata template"
			/>
			<MetadataTemplateContainerEditLockDialog
				isOpen={isEditLockOpen}
				metadataTemplateContainerUuid={props.metadataTemplateContainerUuid}
				onOpenChange={setIsEditLockOpen}
			/>
			<MetadataTemplateVersionHistoryExitDialog
				isOpen={isVersionHistoryExitDialogOpen}
				onOpenChange={setIsVersionHistoryExitDialogOpen}
			/>
		</>
	);
}
