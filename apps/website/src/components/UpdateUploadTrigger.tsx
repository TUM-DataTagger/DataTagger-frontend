'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useSetAtom } from 'jotai';
import { parseAsString, useQueryState } from 'nuqs';
import type { PropsWithChildren } from 'react';
import { FileTrigger } from 'react-aria-components';
import { useTus } from 'use-tus';
import { useEnv } from '@/contexts/EnvContext';
import {
	globalUploadAssistantOpenAtom,
	globalUploadAssistantTabAtom,
	uploadsQueueAtom,
} from '@/stores/globalUploadAssistant';
import { $api } from '@/util/clientFetch';

export function UpdateUploadTrigger(
	props: PropsWithChildren<{
		readonly fileUuid: string;
		readonly folderName?: string | undefined;
		readonly folderUuid?: string | undefined;
		readonly projectUuid?: string | undefined;
	}>,
) {
	const env = useEnv();
	const [, setQueryState] = useQueryState('version', parseAsString);
	const setIsGlobalUploadAssistantOpen = useSetAtom(globalUploadAssistantOpenAtom);
	const setGlobalUploadAssistantTab = useSetAtom(globalUploadAssistantTabAtom);
	const setUploadsQueue = useSetAtom(uploadsQueueAtom);
	const { setUpload } = useTus({ autoStart: true, autoAbort: false });
	const queryClient = useQueryClient();

	const onSelect = async (files: FileList | null) => {
		if (!files) {
			return;
		}

		setGlobalUploadAssistantTab(props.folderUuid ? 'folders' : 'drafts');
		setIsGlobalUploadAssistantOpen(true);

		for (const file of files) {
			const uuid = crypto.randomUUID();
			const startTime = performance.now();

			setUpload(file, {
				endpoint: `${env.BASE_API_URL ?? ''}/api/v1/uploads-dataset/${props.fileUuid}/tus/`,
				chunkSize: 50_000_000,
				removeFingerprintOnSuccess: true,
				parallelUploads: 1,
				metadata: {
					filename: file.name,
					filetype: file.type,
				},
				onBeforeRequest: (req) => {
					const xhr = req.getUnderlyingObject();
					xhr.withCredentials = true;
				},
				onUploadUrlAvailable() {
					setUploadsQueue((draft) => {
						draft.push({
							uuid,
							filename: file.name,
							datasetUuid: props.fileUuid,
							folderUuid: props.folderUuid,
							folderName: props.folderName,
							projectUuid: props.projectUuid,
							finished: false,
							percentComplete: 0,
							uploadSpeed: 0,
						});
					});
				},

				onProgress(bytesSent, bytesTotal) {
					const percentComplete = (bytesSent / bytesTotal) * 100;
					const currentTime = performance.now();
					// Convert to seconds
					const elapsedTime = (currentTime - startTime) / 1_000;
					// Calculate upload speed in bytes per second
					const uploadSpeed = bytesSent / elapsedTime;

					setUploadsQueue((draft) => {
						const upload = draft.find((up) => up.uuid === uuid);
						if (upload) {
							upload.percentComplete = percentComplete;
							upload.uploadSpeed = uploadSpeed;
						}
					});
				},
				async onSuccess() {
					setUploadsQueue((draft) => {
						const upload = draft.find((up) => up.uuid === uuid);
						if (upload) {
							upload.finished = true;
							upload.percentComplete = 100;
							upload.uploadSpeed = 0;
						}
					});

					await setQueryState(null);
					await queryClient.invalidateQueries({
						queryKey: $api.queryOptions('get', '/api/v1/uploads-dataset/{id}/', {
							params: { path: { id: props.fileUuid } },
						}).queryKey,
					});

					if (props.folderUuid) {
						await queryClient.invalidateQueries({
							queryKey: $api.queryOptions('get', '/api/v1/uploads-dataset/', {
								params: { query: { folder: props.folderUuid } },
							}).queryKey,
						});
					} else {
						await queryClient.invalidateQueries({
							queryKey: $api.queryOptions('get', '/api/v1/uploads-dataset/').queryKey,
						});
					}
				},
			});
		}
	};

	return <FileTrigger onSelect={onSelect}>{props.children}</FileTrigger>;
}
