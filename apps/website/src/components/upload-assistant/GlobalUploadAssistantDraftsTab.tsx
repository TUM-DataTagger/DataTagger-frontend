'use client';

import { useAtomValue, useSetAtom } from 'jotai';
import { CheckIcon, InfoIcon, MinusIcon, RotateCcwIcon } from 'lucide-react';
import { useMediaQuery } from 'usehooks-ts';
import { MetadataAssignModal } from '@/components/Metadata';
import { FileUploadEmpty } from '@/components/icons/FileUploadEmpty';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { GridList, GridListItem } from '@/components/ui/GridList';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Scrollbars } from '@/components/ui/Scrollbars';
import { useSidebar } from '@/components/ui/Sidebar';
import {
	globalUploadAssistantOpenAtom,
	uploadsNoFolderAtom,
	uploadsNoFolderSelectionAtom,
	uploadsQueueAtom,
} from '@/stores/globalUploadAssistant';
import { sideSheetSelectedDatasetAtom } from '@/stores/sideSheet';
import { Modal } from '../ui/Modal';

export function GlobalUploadAssistantDraftsTab() {
	const isLarge = useMediaQuery('(min-width: 1024px)', { initializeWithValue: false });
	const { setOpen: setSidebarOpen } = useSidebar();
	const draftUploadsQueue = useAtomValue(uploadsNoFolderAtom);
	const draftUploadsSelection = useAtomValue(uploadsNoFolderSelectionAtom);
	const setUploadQueue = useSetAtom(uploadsQueueAtom);
	const setIsGlobalUploadAssistantOpen = useSetAtom(globalUploadAssistantOpenAtom);
	const setSideSheetSelectedDataset = useSetAtom(sideSheetSelectedDatasetAtom);

	return (
		<>
			{draftUploadsQueue.length ? (
				<div className="border-base-neutral-100 bg-base-neutral-60 dark:border-base-neutral-700 dark:bg-base-neutral-700/40 flex h-14 place-content-between place-items-center border-b px-5 py-3">
					<div className="flex gap-2">
						<Checkbox
							aria-label="Select all draft files"
							isIndeterminate={Boolean(
								draftUploadsSelection.length && draftUploadsSelection.length !== draftUploadsQueue.length,
							)}
							isSelected={Boolean(
								draftUploadsSelection.length && draftUploadsSelection.length === draftUploadsQueue.length,
							)}
							onChange={(isSelected) => {
								setUploadQueue((drafts) => {
									for (const draft of drafts.filter((draft) => !draft.folderUuid)) {
										draft.selected = isSelected;
									}
								});
							}}
						/>
						{draftUploadsSelection.length ? (
							<Modal>
								<Button variant="secondary-discreet">Add metadata</Button>
								<MetadataAssignModal
									selected={draftUploadsSelection.map((draft) => draft.datasetUuid!).filter(Boolean)}
								/>
							</Modal>
						) : null}
					</div>
					<Button
						onPress={() => {
							setUploadQueue((drafts) => drafts.filter((draft) => !draft.folderUuid && !draft.finished));
						}}
						variant="discreet"
					>
						Clear
					</Button>
				</div>
			) : null}

			{draftUploadsQueue.length ? (
				<Scrollbars
					className="h-[calc(100vh_-_10rem)] md:h-[calc(540px_-_7rem)]"
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
						onSelectionChange={(keys) => {
							if (keys instanceof Set) {
								setUploadQueue((drafts) => {
									for (const draft of drafts.filter((draft) => !draft.folderUuid)) {
										draft.selected = keys.has(draft.uuid);
									}
								});
							}
						}}
						selectedKeys={new Set(draftUploadsSelection.map((draft) => draft.uuid))}
						selectionMode="multiple"
					>
						{draftUploadsQueue.map((upload) => (
							<GridListItem
								className="min-h-20 px-4 py-3 first:pt-5"
								id={upload.uuid}
								key={upload.uuid}
								textValue={upload.filename}
							>
								<div className="flex flex-1 gap-2">
									<div className="flex-1">
										<div className="flex max-w-56 flex-col gap-1">
											<span className="text-base-label-sm truncate">{upload.filename}</span>
											<span className="text-base-xs text-base-neutral-600 dark:text-base-neutral-300 truncate">
												{upload.directory ?? '-'}
											</span>
										</div>
										{upload.percentComplete && !upload.finished && !upload.error ? (
											<ProgressBar aria-label="Upload progress" value={upload.percentComplete} />
										) : null}
									</div>
									<div className="flex place-items-start gap-5">
										{upload.finished ? (
											<div className="bg-base-green-lime-500 flex h-[18px] w-[18px] place-content-center items-center rounded-full">
												<CheckIcon aria-hidden aria-label="Success" size={12} strokeWidth={3} />
											</div>
										) : null}
										{upload.error ? (
											<div className="bg-base-sunset-500 flex h-[18px] w-[18px] place-content-center items-center rounded-full">
												<MinusIcon aria-hidden aria-label="Error" size={12} strokeWidth={3} />
											</div>
										) : null}
										{upload.error ? (
											<Button
												aria-label="Retry upload"
												className="rounded-full"
												variant="unset"
												// onPress={async () => retryUpload()}
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

			{draftUploadsQueue.length ? null : (
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
