'use client';

import { useSetAtom } from 'jotai';
import { AlertCircleIcon, CheckIcon, InfoIcon, MinusIcon, RotateCcwIcon } from 'lucide-react';
import { useMediaQuery } from 'usehooks-ts';
import { MetadataAssignModal } from '@/components/Metadata';
import { FileUploadEmpty } from '@/components/icons/FileUploadEmpty';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { GridList, GridListItem } from '@/components/ui/GridList';
import { Modal } from '@/components/ui/Modal';
import { ProgressBar, ProgressBarTrack } from '@/components/ui/ProgressBar';
import { Scrollbars } from '@/components/ui/Scrollbars';
import { useSidebar } from '@/components/ui/Sidebar';
import { globalUploadAssistantOpenAtom } from '@/stores/globalUploadAssistant';
import { sideSheetSelectedDatasetAtom } from '@/stores/sideSheet';
import { useUploadIntent } from '@/uploads/useUploadIntent';

export function GlobalUploadAssistantDraftsTab() {
	const isLarge = useMediaQuery('(min-width: 1024px)', { initializeWithValue: false });
	const { setOpen: setSidebarOpen } = useSidebar();
	const {
		clearFinishedDraftUploads,
		draftUploads,
		retryUpload,
		selectedDraftUploads,
		setAllDraftUploadsSelected,
		setDraftUploadSelection,
	} = useUploadIntent();
	const setIsGlobalUploadAssistantOpen = useSetAtom(globalUploadAssistantOpenAtom);
	const setSideSheetSelectedDataset = useSetAtom(sideSheetSelectedDatasetAtom);
	const selectedDraftUploadKeys = new Set(selectedDraftUploads.map((draft) => draft.uuid));

	return (
		<>
			{draftUploads.length ? (
				<div className="flex h-14 place-content-between place-items-center border-b border-base-neutral-100 bg-base-neutral-60 px-5 py-3 dark:border-base-neutral-700 dark:bg-base-neutral-700/40">
					<div className="flex gap-2">
						<Checkbox
							aria-label="Select all draft files"
							isIndeterminate={Boolean(
								selectedDraftUploads.length && selectedDraftUploads.length !== draftUploads.length,
							)}
							isSelected={Boolean(selectedDraftUploads.length && selectedDraftUploads.length === draftUploads.length)}
							onChange={setAllDraftUploadsSelected}
						/>
						{selectedDraftUploads.length ? (
							<Modal>
								<Button variant="secondary-discreet">Add metadata</Button>
								<MetadataAssignModal
									selected={selectedDraftUploads.map((draft) => draft.datasetUuid!).filter(Boolean)}
								/>
							</Modal>
						) : null}
					</div>
					<Button onPress={clearFinishedDraftUploads} variant="discreet">
						Clear
					</Button>
				</div>
			) : null}

			{draftUploads.length ? (
				<Scrollbars
					className="h-[calc(100vh-10rem)] md:h-[calc(540px-7rem)]"
					defer
					options={{
						overflow: { x: 'hidden' },
						scrollbars: {
							autoHide: 'scroll',
							autoHideDelay: 500,
							autoHideSuspend: true,
							clickScroll: true,
						},
					}}
				>
					<GridList
						aria-label="List of files uploaded to the tool"
						disabledBehavior="selection"
						className="overscroll-auto"
						onSelectionChange={(keys) => {
							if (keys instanceof Set) {
								setDraftUploadSelection(keys);
							}
						}}
						selectedKeys={selectedDraftUploadKeys}
						selectionMode="multiple"
					>
						{draftUploads.map((upload) => (
							<GridListItem
								className="min-h-20 px-4 py-3 first:pt-5"
								id={upload.uuid}
								key={upload.uuid}
								textValue={upload.filename}
							>
								<div className="flex flex-1 gap-2">
									<div className="flex-1">
										<div className="flex max-w-56 flex-col gap-1">
											<span className="truncate text-base-label-sm" title={upload.filename}>
												{upload.filename}
											</span>
											<span
												className="truncate text-base-xs text-base-neutral-600 dark:text-base-neutral-300"
												title={upload.directory ?? '-'}
											>
												{upload.directory ?? '-'}
											</span>
										</div>
										{upload.percentComplete && !upload.finished && !upload.error ? (
											<ProgressBar aria-label="Upload progress" value={upload.percentComplete}>
												<ProgressBarTrack />
											</ProgressBar>
										) : null}
									</div>
									<div className="flex place-items-start gap-5">
										{upload.finished ? (
											<div className="flex h-4.5 w-4.5 place-content-center items-center rounded-full bg-base-green-lime-500">
												<CheckIcon aria-hidden aria-label="Success" size={12} strokeWidth={3} />
											</div>
										) : null}
										{upload.completionSyncError ? (
											<AlertCircleIcon
												aria-label="Upload completed; refresh failed"
												className="text-amber-700 dark:text-amber-400"
												size={18}
												strokeWidth={1.5}
											/>
										) : null}
										{upload.error ? (
											<div className="flex h-4.5 w-4.5 place-content-center items-center rounded-full bg-base-sunset-500">
												<MinusIcon aria-hidden aria-label="Error" size={12} strokeWidth={3} />
											</div>
										) : null}
										{upload.error ? (
											<Button
												aria-label="Retry upload"
												className="rounded-full"
												onPress={async () => {
													await retryUpload(upload.uuid);
												}}
												variant="unset"
											>
												<RotateCcwIcon aria-hidden size={18} strokeWidth={1.5} />
											</Button>
										) : upload.percentComplete ? (
											<>
												{/* {file.finished ? null : file.paused ? (
													<Button
														aria-label="Resume upload"
														className="rounded-full"
														size="icon"
														variant="unset"
														onPress={async () => resumeUpload()}
													>
														<Play aria-hidden size={18} strokeWidth={1.5} />
													</Button>
												) : (
													<Button
														aria-label="Pause upload"
														className="rounded-full"
														size="icon"
														variant="unset"
														onPress={async () => pauseUpload()}
													>
														<Pause aria-hidden size={18} strokeWidth={1.5} />
													</Button>
												)} */}
												{upload.folderUuid && upload.finished && upload.datasetUuid ? (
													<Button
														aria-label="Open sidesheet"
														className="rounded-full"
														onPress={() => {
															setSidebarOpen(true);
															setSideSheetSelectedDataset(upload.datasetUuid!);
															if (!isLarge) {
																setIsGlobalUploadAssistantOpen(false);
															}
														}}
														variant="unset"
													>
														<InfoIcon aria-hidden size={18} strokeWidth={1.5} />
													</Button>
												) : null}
												{upload.folderUuid && upload.datasetUuid ? null : (
													<Button
														aria-label="Open sidesheet"
														className="rounded-full"
														onPress={() => {
															setSidebarOpen(true);
															setSideSheetSelectedDataset(upload.datasetUuid!);
															if (!isLarge) {
																setIsGlobalUploadAssistantOpen(false);
															}
														}}
														variant="unset"
													>
														<InfoIcon aria-hidden size={18} strokeWidth={1.5} />
													</Button>
												)}
											</>
										) : null}
									</div>
								</div>
							</GridListItem>
						))}
					</GridList>
				</Scrollbars>
			) : null}

			{draftUploads.length ? null : (
				<div className="flex grow flex-col place-items-center gap-8 p-4 pt-10 md:h-[50vh]">
					<div className="flex flex-col place-items-center gap-4">
						<FileUploadEmpty aria-hidden />
						New uploads into "My draft files" will appear here.
					</div>
				</div>
			)}
		</>
	);
}
