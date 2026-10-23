'use client';

import type { PropsWithChildren } from 'react';
import { FileTrigger } from 'react-aria-components';
import type { UploadOrigin } from '@/uploads/types';
import { useUploadIntent } from '@/uploads/useUploadIntent';

export function UploadTrigger(
	props: PropsWithChildren<{
		readonly acceptDirectory?: boolean | undefined;
		readonly folderName?: string | undefined;
		readonly folderUuid?: string | undefined;
		readonly origin?: UploadOrigin | undefined;
		readonly projectUuid?: string | undefined;
		readonly subfolderUuid?: string | null | undefined;
	}>,
) {
	const { startSelectedCreateUploads } = useUploadIntent();

	const onSelect = async (files: FileList | null) => {
		if (!files) {
			return;
		}

		await startSelectedCreateUploads({
			destination: props.folderUuid
				? {
						kind: 'folder',
						folderName: props.folderName,
						folderUuid: props.folderUuid,
						projectUuid: props.projectUuid,
						subfolderUuid: props.subfolderUuid,
					}
				: { kind: 'draft' },
			files,
			origin: props.origin,
		});
	};

	return (
		<FileTrigger acceptDirectory={props.acceptDirectory} allowsMultiple onSelect={onSelect}>
			{props.children}
		</FileTrigger>
	);
}
