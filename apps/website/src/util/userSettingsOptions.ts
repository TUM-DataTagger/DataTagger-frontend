export const DRAFT_SORT_KEYS = [
	'-creation_date',
	'creation_date',
	'display_name',
	'-display_name',
	'expiry_date',
] as const;

export const PROJECT_SORT_KEYS = ['name', '-name', 'creation_date', '-creation_date'] as const;
export const FOLDER_SORT_KEYS = ['name', '-name'] as const;
export const FILE_SORT_KEYS = ['-creation_date', 'creation_date', 'display_name', '-display_name'] as const;

export const VIEW_MODE_KEYS = ['grid', 'table'] as const;
export const VIEW_MODE_OVERRIDE_KEYS = ['default', ...VIEW_MODE_KEYS] as const;

export type DraftSort = (typeof DRAFT_SORT_KEYS)[number];
export type ProjectSort = (typeof PROJECT_SORT_KEYS)[number];
export type FolderSort = (typeof FOLDER_SORT_KEYS)[number];
export type FileSort = (typeof FILE_SORT_KEYS)[number];
export type ViewMode = (typeof VIEW_MODE_KEYS)[number];
export type ViewModeOverride = (typeof VIEW_MODE_OVERRIDE_KEYS)[number];

export const DRAFT_SORT_OPTIONS: Readonly<Record<DraftSort, string>> = {
	'-creation_date': 'Created last',
	creation_date: 'Created first',
	display_name: 'Name A-Z',
	'-display_name': 'Name Z-A',
	expiry_date: 'Closer to auto-delete',
};

export const PROJECT_SORT_OPTIONS: Readonly<Record<ProjectSort, string>> = {
	name: 'Project name A-Z',
	'-name': 'Project name Z-A',
	creation_date: 'Created first',
	'-creation_date': 'Created last',
};

export const FOLDER_SORT_OPTIONS: Readonly<Record<FolderSort, string>> = {
	name: 'Name A-Z',
	'-name': 'Name Z-A',
};

export const FILE_SORT_OPTIONS: Readonly<Record<FileSort, string>> = {
	'-creation_date': 'Created last',
	creation_date: 'Created first',
	display_name: 'Name A-Z',
	'-display_name': 'Name Z-A',
};

export const VIEW_MODE_OPTIONS = [
	{ id: 'grid', label: 'Grid view' },
	{ id: 'table', label: 'Table view' },
] as const;

export const VIEW_MODE_OVERRIDE_OPTIONS = [
	{ id: 'default', label: 'Use general default' },
	...VIEW_MODE_OPTIONS,
] as const;

export function resolveViewMode(defaultViewMode: ViewMode, override: ViewModeOverride): ViewMode {
	return override === 'default' ? defaultViewMode : override;
}
