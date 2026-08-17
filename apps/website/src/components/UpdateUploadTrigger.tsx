'use client';

import type { PropsWithChildren } from 'react';
import { FileTrigger } from 'react-aria-components';
import { useUploadIntent } from '@/uploads/useUploadIntent';

export function UpdateUploadTrigger(
	props: PropsWithChildren<{
		readonly fileUuid: string;
		readonly folderName?: string | undefined;
		readonly folderUuid?: string | undefined;
		readonly projectUuid?: string | undefined;
	}>,
) {
	const { startSelectedUpdateUploads } = useUploadIntent();

	const onSelect = async (files: FileList | null) => {
		if (!files) {
			return;
		}

		await startSelectedUpdateUploads({
			files,
			target: {
				datasetUuid: props.fileUuid,
				folderName: props.folderName,
				folderUuid: props.folderUuid,
				projectUuid: props.projectUuid,
			},
		});
	};

	return <FileTrigger onSelect={onSelect}>{props.children}</FileTrigger>;
}
