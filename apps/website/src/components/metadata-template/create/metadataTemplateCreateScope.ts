import type { QueryClient } from '@tanstack/react-query';
import { $api } from '@/util/clientFetch';

export type MetadataTemplateCreateScope =
	| { readonly kind: 'global' }
	| { readonly kind: 'project'; readonly projectUuid: string }
	| { readonly kind: 'folder'; readonly folderUuid: string; readonly projectUuid: string };

export type ResolvedMetadataTemplateCreateScope = {
	readonly assignedToContentType: 'projects.project' | 'folders.folder' | null | undefined;
	readonly assignedToObjectId: string | null | undefined;
	readonly redirectPath: string;
	invalidateQueries(queryClient: QueryClient): Promise<void>;
};

export function resolveMetadataTemplateCreateScope(
	scope: MetadataTemplateCreateScope,
): ResolvedMetadataTemplateCreateScope {
	if (scope.kind === 'global') {
		return {
			assignedToContentType: null,
			assignedToObjectId: null,
			redirectPath: '/metadata-templates',
			async invalidateQueries(queryClient) {
				await queryClient.invalidateQueries({
					queryKey: $api.queryOptions('get', '/api/v1/metadata-template-container/').queryKey,
				});
			},
		};
	}

	if (scope.kind === 'project') {
		return {
			assignedToContentType: 'projects.project',
			assignedToObjectId: scope.projectUuid,
			redirectPath: `/projects/${scope.projectUuid}/metadata-templates`,
			async invalidateQueries(queryClient) {
				await Promise.all([
					queryClient.invalidateQueries({
						queryKey: $api.queryOptions('get', '/api/v1/project/{id}/', {
							params: { path: { id: scope.projectUuid } },
						}).queryKey,
					}),
					queryClient.invalidateQueries({
						queryKey: $api.queryOptions('get', '/api/v1/metadata-template-container/').queryKey,
					}),
					queryClient.invalidateQueries({
						queryKey: $api.queryOptions('get', '/api/v1/metadata-template-container/', {
							params: { query: { assigned_to_object_id: scope.projectUuid } },
						}).queryKey,
					}),
					queryClient.invalidateQueries({
						queryKey: $api.queryOptions('get', '/api/v1/project/{id}/metadata-template-container/', {
							params: { path: { id: scope.projectUuid } },
						}).queryKey,
					}),
					queryClient.invalidateQueries({
						queryKey: $api.queryOptions('get', '/api/v1/project/{id}/metadata-template-container-pool/', {
							params: { path: { id: scope.projectUuid } },
						}).queryKey,
					}),
				]);
			},
		};
	}

	return {
		assignedToContentType: 'folders.folder',
		assignedToObjectId: scope.folderUuid,
		redirectPath: `/projects/${scope.projectUuid}/folders/${scope.folderUuid}/metadata-templates`,
		async invalidateQueries(queryClient) {
			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: $api.queryOptions('get', '/api/v1/project/{id}/', {
						params: { path: { id: scope.projectUuid } },
					}).queryKey,
				}),
				queryClient.invalidateQueries({
					queryKey: $api.queryOptions('get', '/api/v1/folder/{id}/', {
						params: { path: { id: scope.folderUuid } },
					}).queryKey,
				}),
				queryClient.invalidateQueries({
					queryKey: $api.queryOptions('get', '/api/v1/metadata-template-container/').queryKey,
				}),
				queryClient.invalidateQueries({
					queryKey: $api.queryOptions('get', '/api/v1/metadata-template-container/', {
						params: { query: { assigned_to_object_id: scope.folderUuid } },
					}).queryKey,
				}),
				queryClient.invalidateQueries({
					queryKey: $api.queryOptions('get', '/api/v1/folder/{id}/metadata-template-container/', {
						params: { path: { id: scope.folderUuid } },
					}).queryKey,
				}),
				queryClient.invalidateQueries({
					queryKey: $api.queryOptions('get', '/api/v1/folder/{id}/metadata-template-container-pool/', {
						params: { path: { id: scope.folderUuid } },
					}).queryKey,
				}),
			]);
		},
	};
}
