import { atom } from 'jotai';

export const enum SideSheetMode {
	Dataset,
	FileVersionHistory,
	MetadataTemplateVersionHistory,
}

export const sideSheetModeAtom = atom<SideSheetMode>(SideSheetMode.Dataset);

export const sideSheetSelectedDatasetAtom = atom<string | null>(null);

export const sideSheetSelectedMetadataTemplateContainerAtom = atom<string | null>(null);
