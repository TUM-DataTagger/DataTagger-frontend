import { atom } from 'jotai';
import { atomWithImmer } from 'jotai-immer';
import type { Key } from 'react-aria-components';

export const globalUploadAssistantOpenAtom = atom(false);

export const globalUploadAssistantTabAtom = atom<Key>('drafts');

export const uploadsQueueAtom = atomWithImmer<
	{
		readonly datasetUuid?: string | undefined;
		readonly directory?: string | undefined;
		readonly error?: boolean;
		readonly filename: string;
		readonly finished: boolean;
		readonly folderName?: string | undefined;
		readonly folderUuid?: string | undefined;
		readonly paused?: boolean;
		readonly percentComplete: number;
		readonly projectUuid?: string | undefined;
		readonly selected?: boolean;
		readonly uploadSpeed: number;
		readonly uuid: string;
	}[]
>([]);

export const uploadsQueueLengthAtom = atom((get) => get(uploadsQueueAtom).filter((upload) => !upload.finished).length);

export const uploadsNoFolderAtom = atom((get) => get(uploadsQueueAtom).filter((upload) => !upload.folderUuid));

export const finishedUploadsNoFolderAtom = atom((get) =>
	get(uploadsQueueAtom).filter((upload) => upload.finished && !upload.folderUuid),
);

export const unfinishedUploadsNoFolderAtom = atom((get) =>
	get(uploadsQueueAtom).filter((upload) => !upload.finished && !upload.folderUuid),
);

export const uploadsNoFolderSelectionAtom = atom((get) =>
	get(uploadsQueueAtom).filter((upload) => !upload.folderUuid && upload.selected),
);

export const uploadsIntoFolderAtom = atom((get) => get(uploadsQueueAtom).filter((upload) => upload.folderUuid));

export const finishedUploadsIntoFolderAtom = atom((get) =>
	get(uploadsQueueAtom).filter((upload) => upload.finished && upload.folderUuid),
);

export const unfinishedUploadsIntoFolderAtom = atom((get) =>
	get(uploadsQueueAtom).filter((upload) => !upload.finished && upload.folderUuid),
);

export const uploadsIntoFolderSelectionAtom = atom((get) =>
	get(uploadsQueueAtom).filter((upload) => upload.folderUuid && upload.selected),
);
