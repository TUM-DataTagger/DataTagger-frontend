import { beforeEach, describe, expect, it, vi } from 'vitest';
import type * as RecentActivityMatcherModule from '@/util/recentActivityMatcher';

describe('recentActivityMatcher', () => {
	let mod: typeof RecentActivityMatcherModule;

	beforeEach(async () => {
		vi.resetModules();
		mod = await import('@/util/recentActivityMatcher');
	});

	it('inspects tracked write endpoints and skips non-tracked ones', () => {
		expect(mod.shouldInspectRecentMutation('/api/v1/project/abc-123/', 'PATCH')).toBe(true);
		expect(mod.shouldInspectRecentMutation('/api/v1/project/abc-123/lock/', 'POST')).toBe(false);
	});

	it('prefers project context from request URL over route and response', () => {
		const event = mod.classifyRecentMutation({
			request: new Request('https://fdm.local/api/v1/project/url-project/', { method: 'PATCH' }),
			currentPathname: '/projects/route-project/metadata-templates',
			responseData: {
				pk: 'response-project',
				folders_count: 2,
				name: 'Response project',
			},
		});

		expect(event?.entityType).toBe('project');
		expect(event?.entityUuid).toBe('url-project');
		expect(event?.projectUuid).toBe('url-project');
		expect(event?.lastActionKind).toBe('project_metadata_template_assignment_changed');
	});

	it('uses route project context when request URL has no project id', () => {
		const event = mod.classifyRecentMutation({
			request: new Request('https://fdm.local/api/v1/folder/folder-1/', { method: 'PATCH' }),
			currentPathname: '/projects/route-project/folders/folder-1/metadata-templates',
			responseData: {
				project: {
					pk: 'response-project',
				},
			},
		});

		expect(event?.projectUuid).toBe('route-project');
		expect(event?.lastActionKind).toBe('folder_metadata_template_assignment_changed');
	});

	it('falls back to response project context when route is unavailable', () => {
		const event = mod.classifyRecentMutation({
			request: new Request('https://fdm.local/api/v1/folder/', { method: 'POST' }),
			currentPathname: '/drafts',
			responseData: {
				pk: 'folder-1',
				project: {
					pk: 'response-project',
					name: 'Response project',
				},
			},
		});

		expect(event?.projectUuid).toBe('response-project');
		expect(event?.projectName).toBe('Response project');
		expect(event?.lastActionKind).toBe('folder_created');
	});

	it('uses cache as final fallback when request, route, and response are missing project context', () => {
		mod.classifyRecentMutation({
			request: new Request('https://fdm.local/api/v1/folder/folder-cache/', { method: 'PATCH' }),
			currentPathname: '/projects/route-project/folders/folder-cache/details',
			responseData: {},
		});

		const event = mod.classifyRecentMutation({
			request: new Request('https://fdm.local/api/v1/folder/folder-cache/permissions/', { method: 'PUT' }),
			currentPathname: '/drafts',
			responseData: {},
		});

		expect(event?.projectUuid).toBe('route-project');
		expect(event?.lastActionKind).toBe('folder_permissions_updated');
	});

	it('classifies tracked file mutation endpoints', () => {
		const fileMetadataChanged = mod.classifyRecentMutation({
			request: new Request('https://fdm.local/api/v1/uploads-dataset/file-1/version/', { method: 'POST' }),
			currentPathname: '/projects/project-file/files',
			responseData: {},
		});
		const fileMetadataUpgraded = mod.classifyRecentMutation({
			request: new Request('https://fdm.local/api/v1/uploads-dataset/file-1/upgrade-metadata/', { method: 'POST' }),
			currentPathname: '/projects/project-file/files',
			responseData: {},
		});
		const bulkAction = mod.classifyRecentMutation({
			request: new Request('https://fdm.local/api/v1/uploads-dataset/bulk-delete/', { method: 'POST' }),
			currentPathname: '/projects/project-file/files',
			responseData: {},
		});

		expect(fileMetadataChanged?.lastActionKind).toBe('file_metadata_changed');
		expect(fileMetadataChanged?.fileUuid).toBe('file-1');
		expect(fileMetadataUpgraded?.lastActionKind).toBe('file_metadata_upgraded');
		expect(fileMetadataUpgraded?.fileUuid).toBe('file-1');
		expect(bulkAction?.lastActionKind).toBe('files_bulk_action');
		expect(bulkAction?.projectUuid).toBe('project-file');
	});

	it('returns null when no project context can be resolved', () => {
		const event = mod.classifyRecentMutation({
			request: new Request('https://fdm.local/api/v1/folder/folder-1/permissions/', { method: 'PUT' }),
			currentPathname: '/drafts',
			responseData: {},
		});

		expect(event).toBeNull();
	});

	it('falls back to cached project name when response omits it', () => {
		mod.classifyRecentMutation({
			request: new Request('https://fdm.local/api/v1/folder/folder-1/', { method: 'PATCH' }),
			currentPathname: '/projects/project-1/folders/folder-1',
			responseData: {
				project: {
					pk: 'project-1',
					name: 'Project One',
				},
			},
		});

		const event = mod.classifyRecentMutation({
			request: new Request('https://fdm.local/api/v1/project/project-1/members/', { method: 'PUT' }),
			currentPathname: '/projects/project-1/members',
			responseData: {},
		});

		expect(event?.projectUuid).toBe('project-1');
		expect(event?.projectName).toBe('Project One');
		expect(event?.lastActionKind).toBe('project_permissions_updated');
	});
});
