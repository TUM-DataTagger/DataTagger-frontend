'use client';

import type { DropItem } from '@react-types/shared';
import { useQueryClient } from '@tanstack/react-query';
import { useAtomValue, useSetAtom } from 'jotai';
import { parseAsString, useQueryState } from 'nuqs';
import type { Key } from 'react-aria-components';
import type { Upload } from 'tus-js-client';
import { useTus } from 'use-tus';
import { useEnv } from '@/contexts/EnvContext';
import {
	globalUploadAssistantOpenAtom,
	globalUploadAssistantTabAtom,
	uploadsIntoFolderAtom,
	uploadsNoFolderAtom,
	uploadsNoFolderSelectionAtom,
	uploadsQueueAtom,
	uploadsQueueLengthAtom,
} from '@/stores/globalUploadAssistant';
import { $api, openAPIClient } from '@/util/clientFetch';
import { dashboardSnapshotQueryOptions } from '@/util/dashboardSnapshot';
import { formatErrorMessage } from '@/util/formatErrorMessage';
import { logger, LogCategory } from '@/util/logger';
import { processDropItem, processSelectedFile } from '@/util/processDropItem';
import { recordRecentProjectUploadActivity } from '@/util/recentActivity';
import type { UploadOrigin } from './types';

type DraftUploadDestination = {
	readonly kind: 'draft';
};

type FolderUploadDestination = {
	readonly folderName?: string | undefined;
	readonly folderUuid: string;
	readonly kind: 'folder';
	readonly projectUuid?: string | undefined;
	readonly subfolderUuid?: string | null | undefined;
};

export type UploadDestination = DraftUploadDestination | FolderUploadDestination;

export type UploadUpdateTarget = {
	readonly datasetUuid: string;
	readonly folderName?: string | undefined;
	readonly folderUuid?: string | undefined;
	readonly projectUuid?: string | undefined;
};

export type UploadQueueItem = {
	readonly completionSyncError?: boolean | undefined;
	readonly datasetUuid?: string | undefined;
	readonly directory?: string | undefined;
	readonly error?: boolean | undefined;
	readonly filename: string;
	readonly finished: boolean;
	readonly folderName?: string | undefined;
	readonly folderUuid?: string | undefined;
	readonly paused?: boolean | undefined;
	readonly percentComplete: number;
	readonly projectUuid?: string | undefined;
	readonly selected?: boolean | undefined;
	readonly subfolderUuid?: string | null | undefined;
	readonly uploadSpeed: number;
	readonly uuid: string;
};

type StartSelectedCreateUploadsInput = {
	readonly destination: UploadDestination;
	readonly files: FileList | readonly File[];
	readonly origin?: UploadOrigin | undefined;
};

type StartDroppedCreateUploadsInput = {
	readonly destination: UploadDestination;
	readonly items: readonly DropItem[];
	readonly origin?: UploadOrigin | undefined;
};

type StartDroppedUpdateUploadsInput = {
	readonly items: readonly DropItem[];
	readonly target: UploadUpdateTarget;
};

type StartSelectedUpdateUploadsInput = {
	readonly files: FileList | readonly File[];
	readonly target: UploadUpdateTarget;
};

type UploadRetryKind = 'create' | 'update';

type InternalUploadQueueItem = UploadQueueItem & {
	readonly file?: File | undefined;
	readonly origin?: UploadOrigin | undefined;
	readonly retryKind?: UploadRetryKind | undefined;
	readonly tusUpload?: Upload | undefined;
};

function isFolderDestination(destination: UploadDestination): destination is FolderUploadDestination {
	return destination.kind === 'folder';
}

function destinationFromUpdateTarget(target: UploadUpdateTarget): UploadDestination {
	if (target.folderUuid) {
		return {
			kind: 'folder',
			folderName: target.folderName,
			folderUuid: target.folderUuid,
			projectUuid: target.projectUuid,
		};
	}

	return { kind: 'draft' };
}

function destinationFromQueueItem(upload: InternalUploadQueueItem): UploadDestination {
	if (upload.folderUuid) {
		return {
			kind: 'folder',
			folderName: upload.folderName,
			folderUuid: upload.folderUuid,
			projectUuid: upload.projectUuid,
			subfolderUuid: upload.subfolderUuid,
		};
	}

	return { kind: 'draft' };
}

function updateTargetFromQueueItem(upload: InternalUploadQueueItem): UploadUpdateTarget | null {
	if (!upload.datasetUuid) {
		return null;
	}

	return {
		datasetUuid: upload.datasetUuid,
		folderName: upload.folderName,
		folderUuid: upload.folderUuid,
		projectUuid: upload.projectUuid,
	};
}

function projectUploadQueueItem(upload: InternalUploadQueueItem): UploadQueueItem {
	return {
		completionSyncError: upload.completionSyncError,
		datasetUuid: upload.datasetUuid,
		directory: upload.directory,
		error: upload.error,
		filename: upload.filename,
		finished: upload.finished,
		folderName: upload.folderName,
		folderUuid: upload.folderUuid,
		paused: upload.paused,
		percentComplete: upload.percentComplete,
		projectUuid: upload.projectUuid,
		selected: upload.selected,
		uploadSpeed: upload.uploadSpeed,
		uuid: upload.uuid,
	};
}

export function useUploadIntent() {
	const env = useEnv();
	const [, setVersionQueryState] = useQueryState('version', parseAsString);
	const queryClient = useQueryClient();
	const setIsGlobalUploadAssistantOpen = useSetAtom(globalUploadAssistantOpenAtom);
	const setGlobalUploadAssistantTab = useSetAtom(globalUploadAssistantTabAtom);
	const setUploadsQueue = useSetAtom(uploadsQueueAtom);
	const uploadsQueue = useAtomValue(uploadsQueueAtom);
	const activeUploadCount = useAtomValue(uploadsQueueLengthAtom);
	const draftUploads = useAtomValue(uploadsNoFolderAtom).map(projectUploadQueueItem);
	const selectedDraftUploads = useAtomValue(uploadsNoFolderSelectionAtom).map(projectUploadQueueItem);
	const folderUploads = useAtomValue(uploadsIntoFolderAtom).map(projectUploadQueueItem);
	const { setUpload } = useTus({ autoStart: true, autoAbort: false });

	const invalidateCreateUploadDestination = async (destination: UploadDestination) => {
		if (isFolderDestination(destination)) {
			const invalidations: Promise<unknown>[] = [
				queryClient.invalidateQueries({
					queryKey: $api.queryOptions('get', '/api/v1/folder/{id}/', {
						params: { path: { id: destination.folderUuid } },
					}).queryKey,
				}),
				queryClient.invalidateQueries({
					queryKey: $api.queryOptions('get', '/api/v1/uploads-dataset/', {
						params: { query: { folder: destination.folderUuid } },
					}).queryKey,
				}),
				queryClient.invalidateQueries({
					queryKey: $api.queryOptions('get', '/api/v1/subfolder/', {
						params: { query: { folder: destination.folderUuid } },
					}).queryKey,
				}),
			];

			if (destination.projectUuid) {
				invalidations.push(
					queryClient.invalidateQueries({
						queryKey: $api.queryOptions('get', '/api/v1/project/{id}/', {
							params: { path: { id: destination.projectUuid } },
						}).queryKey,
					}),
				);
			}

			await Promise.all(invalidations);
			return;
		}

		await queryClient.invalidateQueries({
			queryKey: $api.queryOptions('get', '/api/v1/uploads-dataset/').queryKey,
		});
	};

	const invalidateUpdateUploadTarget = async (target: UploadUpdateTarget) => {
		const invalidations: Promise<unknown>[] = [
			queryClient.invalidateQueries({
				queryKey: $api.queryOptions('get', '/api/v1/uploads-dataset/{id}/', {
					params: { path: { id: target.datasetUuid } },
				}).queryKey,
			}),
		];

		if (target.folderUuid) {
			invalidations.push(
				queryClient.invalidateQueries({
					queryKey: $api.queryOptions('get', '/api/v1/uploads-dataset/', {
						params: { query: { folder: target.folderUuid } },
					}).queryKey,
				}),
			);
		} else {
			invalidations.push(
				queryClient.invalidateQueries({
					queryKey: $api.queryOptions('get', '/api/v1/uploads-dataset/').queryKey,
				}),
			);
		}

		await Promise.all(invalidations);
	};

	const startTusUpload = (
		file: File,
		input: {
			afterSuccess(): Promise<void>;
			readonly datasetUuid: string;
			readonly destination: UploadDestination;
			readonly directory?: string | undefined;
			readonly origin: UploadOrigin;
			readonly queueUuid?: string | undefined;
			readonly retryKind: UploadRetryKind;
		},
	) => {
		const queueUuid = input.queueUuid ?? crypto.randomUUID();
		const startTime = performance.now();
		let lastLoggedMilestone = 0;
		const destinationLabel = isFolderDestination(input.destination) ? input.destination.folderUuid : 'drafts';

		setUpload(file, {
			endpoint: `${env.BASE_API_URL ?? ''}/api/v1/uploads-dataset/${input.datasetUuid}/tus/`,
			chunkSize: 50_000_000,
			removeFingerprintOnSuccess: true,
			parallelUploads: 1,
			metadata: {
				filename: file.name,
				filetype: file.type,
				...(input.directory === undefined ? {} : { filepath: input.directory }),
			},
			onBeforeRequest: (req) => {
				const xhr = req.getUnderlyingObject();
				xhr.withCredentials = true;
			},
			onUploadUrlAvailable(upload: Upload) {
				logger.debug(LogCategory.Upload, 'Upload registered', {
					filename: file.name,
					fileSize: file.size,
					uuid: queueUuid,
					folderUuid: destinationLabel,
				});
				setUploadsQueue((draft) => {
					const previousUpload = draft.find((up) => up.uuid === queueUuid);

					if (previousUpload) {
						previousUpload.tusUpload = upload;
						previousUpload.file = file;
						previousUpload.retryKind = input.retryKind;
						previousUpload.datasetUuid = input.datasetUuid;
						previousUpload.folderUuid = isFolderDestination(input.destination)
							? input.destination.folderUuid
							: undefined;
						previousUpload.folderName = isFolderDestination(input.destination)
							? input.destination.folderName
							: undefined;
						previousUpload.projectUuid = isFolderDestination(input.destination)
							? input.destination.projectUuid
							: undefined;
						previousUpload.subfolderUuid = isFolderDestination(input.destination)
							? input.destination.subfolderUuid
							: undefined;
						previousUpload.directory = input.directory;
						previousUpload.origin = input.origin;
						previousUpload.finished = false;
						previousUpload.percentComplete = 0;
						previousUpload.uploadSpeed = 0;
						previousUpload.error = false;
						previousUpload.completionSyncError = false;
						return;
					}

					draft.push({
						tusUpload: upload,
						uuid: queueUuid,
						completionSyncError: false,
						filename: file.name,
						file,
						retryKind: input.retryKind,
						datasetUuid: input.datasetUuid,
						folderUuid: isFolderDestination(input.destination) ? input.destination.folderUuid : undefined,
						folderName: isFolderDestination(input.destination) ? input.destination.folderName : undefined,
						projectUuid: isFolderDestination(input.destination) ? input.destination.projectUuid : undefined,
						subfolderUuid: isFolderDestination(input.destination) ? input.destination.subfolderUuid : undefined,
						directory: input.directory,
						origin: input.origin,
						finished: false,
						percentComplete: 0,
						uploadSpeed: 0,
						error: false,
					});
				});
			},
			onProgress(bytesSent, bytesTotal) {
				const percentComplete = (bytesSent / bytesTotal) * 100;
				const elapsedTime = (performance.now() - startTime) / 1_000;
				const uploadSpeed = bytesSent / elapsedTime;
				const milestone = Math.floor(percentComplete / 25) * 25;

				if (milestone > lastLoggedMilestone && milestone < 100) {
					logger.debug(LogCategory.Upload, `Upload ${milestone}% complete`, {
						filename: file.name,
						bytesSent,
						bytesTotal,
						uploadSpeed: `${(uploadSpeed / 1_024 / 1_024).toFixed(2)} MB/s`,
					});
					lastLoggedMilestone = milestone;
				}

				setUploadsQueue((draft) => {
					const upload = draft.find((up) => up.uuid === queueUuid);
					if (upload) {
						upload.percentComplete = percentComplete;
						upload.uploadSpeed = uploadSpeed;
					}
				});
			},
			async onSuccess() {
				const duration = ((performance.now() - startTime) / 1_000).toFixed(1);
				logger.info(LogCategory.Upload, 'Upload completed', {
					filename: file.name,
					uuid: queueUuid,
					folderUuid: destinationLabel,
					duration: `${duration}s`,
				});

				let completionSyncError = false;

				try {
					const successSideEffects: Promise<unknown>[] = [input.afterSuccess()];
					if (input.origin === 'dashboard') {
						successSideEffects.push(
							queryClient.invalidateQueries({ queryKey: dashboardSnapshotQueryOptions($api).queryKey }),
						);
					}
					await Promise.all(successSideEffects);
				} catch (successSideEffectError) {
					logger.warn(LogCategory.Upload, 'Failed to run upload success side effects', {
						filename: file.name,
						error:
							successSideEffectError instanceof Error ? successSideEffectError.message : String(successSideEffectError),
					});
					completionSyncError = true;
				}

				setUploadsQueue((draft) => {
					const upload = draft.find((up) => up.uuid === queueUuid);
					if (upload) {
						upload.finished = true;
						upload.percentComplete = 100;
						upload.uploadSpeed = 0;
						upload.error = false;
						upload.completionSyncError = completionSyncError;
					}
				});

				recordRecentProjectUploadActivity({
					projectUuid: isFolderDestination(input.destination) ? input.destination.projectUuid : undefined,
					source: 'upload-intent',
				});
			},
			async onError(error: unknown, upload: Upload) {
				logger.error(LogCategory.Upload, 'Upload failed', {
					filename: file.name,
					error: error instanceof Error ? error.message : String(error),
				});
				await upload.abort();

				setUploadsQueue((draft) => {
					const uploadEntry = draft.find((up) => up.uuid === queueUuid);
					if (uploadEntry && !uploadEntry.finished) {
						uploadEntry.percentComplete = 0;
						uploadEntry.uploadSpeed = 0;
						uploadEntry.error = true;
					}
				});
			},
		});
	};

	const markUploadInitializationFailed = (input: {
		readonly datasetUuid?: string | undefined;
		readonly destination: UploadDestination;
		readonly directory?: string | undefined;
		readonly file: File;
		readonly origin: UploadOrigin;
		readonly queueUuid: string;
		readonly retryKind: UploadRetryKind;
	}) => {
		setUploadsQueue((draft) => {
			const previousUpload = draft.find((upload) => upload.uuid === input.queueUuid);

			if (previousUpload) {
				previousUpload.datasetUuid = input.datasetUuid;
				previousUpload.file = input.file;
				previousUpload.origin = input.origin;
				previousUpload.retryKind = input.retryKind;
				previousUpload.tusUpload = undefined;
				previousUpload.finished = false;
				previousUpload.percentComplete = 0;
				previousUpload.uploadSpeed = 0;
				previousUpload.error = true;
				previousUpload.completionSyncError = false;
				return;
			}

			draft.push({
				uuid: input.queueUuid,
				completionSyncError: false,
				filename: input.file.name,
				file: input.file,
				origin: input.origin,
				retryKind: input.retryKind,
				datasetUuid: input.datasetUuid,
				folderUuid: isFolderDestination(input.destination) ? input.destination.folderUuid : undefined,
				folderName: isFolderDestination(input.destination) ? input.destination.folderName : undefined,
				projectUuid: isFolderDestination(input.destination) ? input.destination.projectUuid : undefined,
				subfolderUuid: isFolderDestination(input.destination) ? input.destination.subfolderUuid : undefined,
				directory: input.directory,
				finished: false,
				percentComplete: 0,
				uploadSpeed: 0,
				error: true,
			});
		});
	};

	const startCreateUpload = async (
		file: File,
		destination: UploadDestination,
		options: {
			readonly directory?: string | undefined;
			readonly origin?: UploadOrigin | undefined;
			readonly queueUuid?: string | undefined;
		} = {},
	) => {
		const origin = options.origin ?? 'standard';
		const queueUuid = options.queueUuid ?? crypto.randomUUID();
		const { data, error, response } = await openAPIClient.POST('/api/v1/uploads-dataset/', {
			body: {
				name: file.name,
				...(isFolderDestination(destination)
					? {
							folder: destination.folderUuid,
							// Recreate the structure of uploaded folders as subfolders below the current subfolder
							subfolder: destination.subfolderUuid ?? null,
							subfolder_path: options.directory ?? null,
						}
					: { folder: null }),
			},
		});

		if (error) {
			markUploadInitializationFailed({
				destination,
				directory: options.directory,
				file,
				origin,
				queueUuid,
				retryKind: 'create',
			});
			throw new Error(formatErrorMessage(error, response));
		}

		if (!data?.pk) {
			markUploadInitializationFailed({
				destination,
				directory: options.directory,
				file,
				origin,
				queueUuid,
				retryKind: 'create',
			});
			throw new Error('No dataset ID returned');
		}

		startTusUpload(file, {
			afterSuccess: async () => invalidateCreateUploadDestination(destination),
			datasetUuid: data.pk,
			destination,
			directory: options.directory,
			origin,
			queueUuid,
			retryKind: 'create',
		});
	};

	const startUpdateUpload = async (
		file: File,
		target: UploadUpdateTarget,
		directory?: string,
		queueUuid = crypto.randomUUID(),
	) => {
		const destination = destinationFromUpdateTarget(target);

		try {
			startTusUpload(file, {
				afterSuccess: async () => {
					await setVersionQueryState(null);
					await invalidateUpdateUploadTarget(target);
				},
				datasetUuid: target.datasetUuid,
				destination,
				directory,
				origin: 'standard',
				queueUuid,
				retryKind: 'update',
			});
		} catch (error) {
			markUploadInitializationFailed({
				datasetUuid: target.datasetUuid,
				destination,
				directory,
				file,
				origin: 'standard',
				queueUuid,
				retryKind: 'update',
			});
			throw error;
		}
	};

	const retryInitializationFailedUpload = async (upload: InternalUploadQueueItem | undefined) => {
		if (!upload?.file || !upload.retryKind) {
			logger.error(LogCategory.Upload, 'Cannot retry - Upload initialization context missing', {
				uuid: upload?.uuid,
			});
			return;
		}

		try {
			if (upload.retryKind === 'create') {
				await startCreateUpload(upload.file, destinationFromQueueItem(upload), {
					directory: upload.directory,
					origin: upload.origin,
					queueUuid: upload.uuid,
				});
				return;
			}

			const target = updateTargetFromQueueItem(upload);
			if (!target) {
				logger.error(LogCategory.Upload, 'Cannot retry - Upload update target missing', {
					uuid: upload.uuid,
				});
				return;
			}

			await startUpdateUpload(upload.file, target, upload.directory, upload.uuid);
		} catch (error) {
			logger.error(LogCategory.Upload, 'Retry failed', {
				filename: upload.filename,
				uuid: upload.uuid,
				error: error instanceof Error ? error.message : String(error),
			});
		}
	};

	const openUploadAssistant = (destination: UploadDestination) => {
		setGlobalUploadAssistantTab(isFolderDestination(destination) ? 'folders' : 'drafts');
		setIsGlobalUploadAssistantOpen(true);
	};

	const startSelectedCreateUploads = async ({ destination, files, origin }: StartSelectedCreateUploadsInput) => {
		const selectedFiles = Array.from(files).flatMap(processSelectedFile);
		if (selectedFiles.length === 0) {
			return;
		}

		openUploadAssistant(destination);

		const failedFiles: string[] = [];
		for (const { file, directory } of selectedFiles) {
			try {
				await startCreateUpload(file, destination, { directory, origin });
			} catch (error) {
				logger.error(LogCategory.Upload, 'Failed to initialize selected upload', {
					filename: file.name,
					error: error instanceof Error ? error.message : String(error),
				});
				failedFiles.push(file.name);
			}
		}

		if (failedFiles.length > 0) {
			logger.warn(LogCategory.Upload, 'Some selected files failed to start uploading', {
				failedCount: failedFiles.length,
				totalCount: selectedFiles.length,
				failedFiles,
			});
		}
	};

	const startDroppedCreateUploads = async ({ destination, items, origin }: StartDroppedCreateUploadsInput) => {
		if (items.length === 0) {
			return;
		}

		const processedFiles = (await Promise.all(items.map(async (item) => processDropItem(item)))).flat();
		if (processedFiles.length === 0) {
			return;
		}

		openUploadAssistant(destination);

		const failedFiles: string[] = [];
		for (const processedFile of processedFiles) {
			try {
				await startCreateUpload(await processedFile.item.getFile(), destination, {
					directory: processedFile.directory,
					origin,
				});
			} catch (error) {
				logger.error(LogCategory.Upload, 'Failed to initialize dropped upload', {
					filename: processedFile.item.name,
					error: error instanceof Error ? error.message : String(error),
				});
				failedFiles.push(processedFile.item.name);
			}
		}

		if (failedFiles.length > 0) {
			logger.warn(LogCategory.Upload, 'Some dropped files failed to start uploading', {
				failedCount: failedFiles.length,
				totalCount: processedFiles.length,
				failedFiles,
			});
		}
	};

	const startDroppedUpdateUploads = async ({ items, target }: StartDroppedUpdateUploadsInput) => {
		if (items.length === 0) {
			return;
		}

		const processedFiles = (await Promise.all(items.map(async (item) => processDropItem(item)))).flat();
		if (processedFiles.length === 0) {
			return;
		}

		openUploadAssistant(destinationFromUpdateTarget(target));

		const failedFiles: string[] = [];
		for (const processedFile of processedFiles) {
			try {
				await startUpdateUpload(await processedFile.item.getFile(), target, processedFile.directory);
			} catch (error) {
				logger.error(LogCategory.Upload, 'Failed to initialize dropped update upload', {
					filename: processedFile.item.name,
					error: error instanceof Error ? error.message : String(error),
				});
				failedFiles.push(processedFile.item.name);
			}
		}

		if (failedFiles.length > 0) {
			logger.warn(LogCategory.Upload, 'Some dropped update files failed to start uploading', {
				failedCount: failedFiles.length,
				totalCount: processedFiles.length,
				failedFiles,
			});
		}
	};

	const startSelectedUpdateUploads = async ({ files, target }: StartSelectedUpdateUploadsInput) => {
		const selectedFiles = Array.from(files);
		if (selectedFiles.length === 0) {
			return;
		}

		openUploadAssistant(destinationFromUpdateTarget(target));

		const failedFiles: string[] = [];
		for (const file of selectedFiles) {
			try {
				await startUpdateUpload(file, target);
			} catch (error) {
				logger.error(LogCategory.Upload, 'Failed to initialize selected update upload', {
					filename: file.name,
					error: error instanceof Error ? error.message : String(error),
				});
				failedFiles.push(file.name);
			}
		}

		if (failedFiles.length > 0) {
			logger.warn(LogCategory.Upload, 'Some selected update files failed to start uploading', {
				failedCount: failedFiles.length,
				totalCount: selectedFiles.length,
				failedFiles,
			});
		}
	};

	const setAllDraftUploadsSelected = (isSelected: boolean) => {
		setUploadsQueue((draft) => {
			for (const upload of draft.filter((entry) => !entry.folderUuid)) {
				upload.selected = isSelected;
			}
		});
	};

	const setDraftUploadSelection = (keys: ReadonlySet<Key>) => {
		setUploadsQueue((draft) => {
			for (const upload of draft.filter((entry) => !entry.folderUuid)) {
				upload.selected = keys.has(upload.uuid);
			}
		});
	};

	const clearFinishedDraftUploads = () => {
		setUploadsQueue((draft) => {
			const clearedCount = draft.filter((upload) => !upload.folderUuid && upload.finished).length;
			logger.debug(LogCategory.DraftFiles, 'Draft upload queue cleared', { clearedCount });

			return draft.filter((upload) => upload.folderUuid !== undefined || !upload.finished);
		});
	};

	const clearFinishedFolderUploads = () => {
		setUploadsQueue((draft) => draft.filter((upload) => upload.folderUuid === undefined || !upload.finished));
	};

	const retryUpload = async (uploadUuid: string) => {
		const upload = uploadsQueue.find((entry) => entry.uuid === uploadUuid);
		if (!upload?.error || upload.finished) {
			return;
		}

		if (!upload?.tusUpload) {
			await retryInitializationFailedUpload(upload);
			return;
		}

		try {
			const previousUploads = await upload.tusUpload.findPreviousUploads();
			logger.info(LogCategory.Upload, 'Retrying upload', {
				filename: upload.filename,
				uuid: upload.uuid,
				previousUploadsFound: previousUploads.length,
			});

			if (previousUploads.length) {
				upload.tusUpload.resumeFromPreviousUpload(previousUploads[0]!);
			}

			setUploadsQueue((draft) => {
				const uploadEntry = draft.find((entry) => entry.uuid === uploadUuid);
				if (uploadEntry?.error && !uploadEntry.finished) {
					uploadEntry.error = false;
				}
			});

			upload.tusUpload.start();
		} catch (error) {
			logger.error(LogCategory.Upload, 'Retry failed', {
				filename: upload.filename,
				uuid: upload.uuid,
				error: error instanceof Error ? error.message : String(error),
			});

			setUploadsQueue((draft) => {
				const uploadEntry = draft.find((entry) => entry.uuid === uploadUuid);
				if (uploadEntry && !uploadEntry.finished) {
					uploadEntry.percentComplete = 0;
					uploadEntry.uploadSpeed = 0;
					uploadEntry.error = true;
				}
			});
		}
	};

	return {
		activeUploadCount,
		clearFinishedDraftUploads,
		clearFinishedFolderUploads,
		draftUploads,
		folderUploads,
		retryUpload,
		selectedDraftUploads,
		setAllDraftUploadsSelected,
		setDraftUploadSelection,
		startDroppedCreateUploads,
		startDroppedUpdateUploads,
		startSelectedCreateUploads,
		startSelectedUpdateUploads,
	};
}
