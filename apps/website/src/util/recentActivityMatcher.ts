import type { RecentActivityActionKind, RecentActivityEvent } from '@/util/recentActivity';

type MatcherInput = {
	readonly currentPathname?: string;
	readonly request: Request;
	readonly responseData: unknown;
};

const PROJECT_ID_FROM_ROUTE_REGEX = /^\/projects\/(?<projectUuid>[^/]+)/;
const PROJECT_ID_FROM_API_REGEX = /^\/api\/v1\/project\/(?<projectUuid>[^/]+)\/$/;
const PROJECT_MEMBERS_API_REGEX = /^\/api\/v1\/project\/(?<projectUuid>[^/]+)\/members\/$/;
const PROJECT_METADATA_POOL_API_REGEX =
	/^\/api\/v1\/project\/(?<projectUuid>[^/]+)\/metadata-template-container-pool\/$/;
const FOLDER_ID_FROM_API_REGEX = /^\/api\/v1\/folder\/(?<folderUuid>[^/]+)\/$/;
const FOLDER_PERMISSIONS_API_REGEX = /^\/api\/v1\/folder\/(?<folderUuid>[^/]+)\/permissions\/$/;
const FOLDER_METADATA_POOL_API_REGEX = /^\/api\/v1\/folder\/(?<folderUuid>[^/]+)\/metadata-template-container-pool\/$/;
const FOLDER_CREATE_API_REGEX = /^\/api\/v1\/folder\/$/;
const FILE_ID_FROM_API_REGEX = /^\/api\/v1\/uploads-dataset\/(?<fileUuid>[^/]+)\/$/;
const FILE_METADATA_CHANGE_API_REGEX = /^\/api\/v1\/uploads-dataset\/(?<fileUuid>[^/]+)\/version\/$/;
const FILE_UPGRADE_METADATA_API_REGEX = /^\/api\/v1\/uploads-dataset\/(?<fileUuid>[^/]+)\/upgrade-metadata\/$/;
const BULK_FILE_ACTION_API_REGEX =
	/^\/api\/v1\/(?<bulkAction>uploads-dataset\/bulk-delete|uploads-dataset\/bulk-publish|metadata\/bulk-add-to-uploads-datasets)\/$/;

type ContextCache = {
	readonly fileToProject: Map<string, string>;
	readonly folderToProject: Map<string, string>;
	readonly projectToName: Map<string, string>;
};

const contextCache: ContextCache = {
	folderToProject: new Map(),
	fileToProject: new Map(),
	projectToName: new Map(),
};

function toPathname(request: Request) {
	return new URL(request.url).pathname;
}

function getCurrentPathname(overridePathname?: string) {
	if (overridePathname) {
		return overridePathname;
	}

	if (typeof window === 'undefined') {
		return '';
	}

	return window.location.pathname;
}

function extractProjectUuidFromRoute(pathname: string) {
	return PROJECT_ID_FROM_ROUTE_REGEX.exec(pathname)?.[1] ?? null;
}

function extractProjectUuidFromRequestPath(pathname: string) {
	return PROJECT_ID_FROM_API_REGEX.exec(pathname)?.[1] ?? PROJECT_MEMBERS_API_REGEX.exec(pathname)?.[1] ?? null;
}

function extractFolderUuidFromRequestPath(pathname: string) {
	return (
		FOLDER_ID_FROM_API_REGEX.exec(pathname)?.[1] ??
		FOLDER_PERMISSIONS_API_REGEX.exec(pathname)?.[1] ??
		FOLDER_METADATA_POOL_API_REGEX.exec(pathname)?.[1] ??
		null
	);
}

function extractFileUuidFromRequestPath(pathname: string) {
	return (
		FILE_ID_FROM_API_REGEX.exec(pathname)?.[1] ??
		FILE_METADATA_CHANGE_API_REGEX.exec(pathname)?.[1] ??
		FILE_UPGRADE_METADATA_API_REGEX.exec(pathname)?.[1] ??
		null
	);
}

function extractProjectContextFromResponseData(responseData: unknown) {
	if (!responseData || typeof responseData !== 'object') {
		return { projectName: null, projectUuid: null };
	}

	const data = responseData as Record<string, unknown>;
	const directProjectUuid = typeof data.pk === 'string' ? data.pk : null;
	const directProjectName = typeof data.name === 'string' ? data.name : null;

	const nestedProject =
		data.project && typeof data.project === 'object' ? (data.project as Record<string, unknown>) : null;
	const nestedProjectUuid = typeof nestedProject?.pk === 'string' ? nestedProject.pk : null;
	const nestedProjectName = typeof nestedProject?.name === 'string' ? nestedProject.name : null;

	const folder = data.folder && typeof data.folder === 'object' ? (data.folder as Record<string, unknown>) : null;
	const folderProject =
		folder?.project && typeof folder.project === 'object' ? (folder.project as Record<string, unknown>) : null;
	const folderProjectUuid = typeof folderProject?.pk === 'string' ? folderProject.pk : null;
	const folderProjectName = typeof folderProject?.name === 'string' ? folderProject.name : null;

	if (nestedProjectUuid || folderProjectUuid) {
		return {
			projectUuid: nestedProjectUuid ?? folderProjectUuid,
			projectName: nestedProjectName ?? folderProjectName,
		};
	}

	if ('folders_count' in data) {
		return {
			projectUuid: directProjectUuid,
			projectName: directProjectName,
		};
	}

	return {
		projectUuid: null,
		projectName: null,
	};
}

function deriveActionKind(pathname: string, method: string, currentPathname: string): RecentActivityActionKind | null {
	if (method === 'PATCH' && PROJECT_ID_FROM_API_REGEX.test(pathname)) {
		return currentPathname.includes('/metadata-templates')
			? 'project_metadata_template_assignment_changed'
			: 'project_updated';
	}

	if (method === 'PUT' && PROJECT_MEMBERS_API_REGEX.test(pathname)) {
		return 'project_permissions_updated';
	}

	if (method === 'PUT' && PROJECT_METADATA_POOL_API_REGEX.test(pathname)) {
		return 'project_metadata_template_assignment_changed';
	}

	if (method === 'POST' && FOLDER_CREATE_API_REGEX.test(pathname)) {
		return 'folder_created';
	}

	if (method === 'PATCH' && FOLDER_ID_FROM_API_REGEX.test(pathname)) {
		return currentPathname.includes('/metadata-templates')
			? 'folder_metadata_template_assignment_changed'
			: 'folder_updated';
	}

	if (method === 'PUT' && FOLDER_PERMISSIONS_API_REGEX.test(pathname)) {
		return 'folder_permissions_updated';
	}

	if (method === 'PUT' && FOLDER_METADATA_POOL_API_REGEX.test(pathname)) {
		return 'folder_metadata_template_assignment_changed';
	}

	if (method === 'POST' && FILE_METADATA_CHANGE_API_REGEX.test(pathname)) {
		return 'file_metadata_changed';
	}

	if (method === 'POST' && FILE_UPGRADE_METADATA_API_REGEX.test(pathname)) {
		return 'file_metadata_upgraded';
	}

	if (method === 'PATCH' && FILE_ID_FROM_API_REGEX.test(pathname)) {
		return 'files_bulk_action';
	}

	if (method === 'DELETE' && FILE_ID_FROM_API_REGEX.test(pathname)) {
		return 'files_bulk_action';
	}

	if (method === 'POST' && BULK_FILE_ACTION_API_REGEX.test(pathname)) {
		return 'files_bulk_action';
	}

	return null;
}

function updateContextCache(props: {
	readonly fileUuid?: string;
	readonly folderUuid?: string;
	readonly projectName?: string | null;
	readonly projectUuid?: string | null;
}) {
	if (props.projectUuid && props.projectName) {
		contextCache.projectToName.set(props.projectUuid, props.projectName);
	}

	if (props.folderUuid && props.projectUuid) {
		contextCache.folderToProject.set(props.folderUuid, props.projectUuid);
	}

	if (props.fileUuid && props.projectUuid) {
		contextCache.fileToProject.set(props.fileUuid, props.projectUuid);
	}
}

function resolveProjectUuidWithPrecedence(props: {
	readonly fileUuid: string | null;
	readonly folderUuid: string | null;
	readonly requestProjectUuid: string | null;
	readonly responseProjectUuid: string | null;
	readonly routeProjectUuid: string | null;
}) {
	return (
		props.requestProjectUuid ??
		props.routeProjectUuid ??
		props.responseProjectUuid ??
		(props.folderUuid ? contextCache.folderToProject.get(props.folderUuid) : null) ??
		(props.fileUuid ? contextCache.fileToProject.get(props.fileUuid) : null) ??
		null
	);
}

export function shouldInspectRecentMutation(pathname: string, method: string) {
	if (!['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
		return false;
	}

	return Boolean(deriveActionKind(pathname, method, ''));
}

export function classifyRecentMutation(input: MatcherInput): RecentActivityEvent | null {
	const method = input.request.method.toUpperCase();
	const pathname = toPathname(input.request);
	const currentPathname = getCurrentPathname(input.currentPathname);
	const actionKind = deriveActionKind(pathname, method, currentPathname);

	if (!actionKind) {
		return null;
	}

	const requestProjectUuid = extractProjectUuidFromRequestPath(pathname);
	const routeProjectUuid = extractProjectUuidFromRoute(currentPathname);
	const folderUuid = extractFolderUuidFromRequestPath(pathname);
	const fileUuid = extractFileUuidFromRequestPath(pathname);
	const responseProjectContext = extractProjectContextFromResponseData(input.responseData);

	const projectUuid = resolveProjectUuidWithPrecedence({
		requestProjectUuid,
		routeProjectUuid,
		responseProjectUuid: responseProjectContext.projectUuid,
		folderUuid,
		fileUuid,
	});

	if (!projectUuid) {
		return null;
	}

	const projectName = responseProjectContext.projectName ?? contextCache.projectToName.get(projectUuid);

	updateContextCache({
		projectUuid,
		projectName,
		folderUuid: folderUuid ?? undefined,
		fileUuid: fileUuid ?? undefined,
	});

	return {
		entityType: 'project',
		entityUuid: projectUuid,
		projectUuid,
		projectName: projectName ?? undefined,
		lastActionKind: actionKind,
		folderUuid: folderUuid ?? undefined,
		fileUuid: fileUuid ?? undefined,
	};
}
