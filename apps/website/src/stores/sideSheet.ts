import { atom } from 'jotai';

export const enum SideSheetMode {
	Dataset,
	VersionHistory,
}

export const sideSheetModeAtom = atom<SideSheetMode>(SideSheetMode.Dataset);

export const sideSheetSelectedDatasetAtom = atom<string | null>(null);
