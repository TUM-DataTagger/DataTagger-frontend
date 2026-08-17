type FileMetadataTemplateAccessArgs = {
	readonly canEditFolder: boolean;
	readonly isFolderAdmin: boolean;
	readonly isProjectAdmin: boolean;
};

type FileMetadataTemplateVisualSelectionArgs = {
	readonly activeContainerPk: string | null;
	readonly inheritedContainerPks: readonly string[];
};

export function canManageFileMetadataTemplate(args: FileMetadataTemplateAccessArgs) {
	return args.isProjectAdmin || args.isFolderAdmin || args.canEditFolder;
}

export function getVisuallySelectedFileMetadataTemplateContainerPks(args: FileMetadataTemplateVisualSelectionArgs) {
	return [...new Set([args.activeContainerPk, ...args.inheritedContainerPks].filter(Boolean))] as string[];
}
