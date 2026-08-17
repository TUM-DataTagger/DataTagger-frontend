export type MetadataTemplatePoolScope =
	| { readonly kind: 'project'; readonly projectUuid: string }
	| { readonly kind: 'folder'; readonly folderUuid: string; readonly projectUuid: string };
