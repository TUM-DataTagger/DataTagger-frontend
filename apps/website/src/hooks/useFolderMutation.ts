import { useMutation, useQueryClient } from '@tanstack/react-query';
import { globalToastQueue, ToastType } from '@/components/ui/Toast';
import { $api, openAPIClient } from '@/util/clientFetch';
import { formatErrorMessage } from '@/util/formatErrorMessage';
import { logger, LogCategory } from '@/util/logger';
import type { components } from '@/util/openapiSchema';

type FolderUpdatePayload = Partial<components['schemas']['PatchedFolderUpdatePayloadRequest']>;

type UseFolderUpdateMutationOptions = {
	readonly folderUuid: string;
	onSuccess?(): void;
	readonly projectUuid?: string;
	readonly toastMessages?: {
		readonly error?: string;
		readonly success?: string;
	};
};

export function useFolderUpdateMutation(options: UseFolderUpdateMutationOptions) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (payload: FolderUpdatePayload) => {
			const { error, response } = await openAPIClient.PATCH('/api/v1/folder/{id}/', {
				params: { path: { id: options.folderUuid } },
				body: payload,
			});

			if (error) {
				throw new Error(formatErrorMessage(error, response));
			}
		},
		async onSuccess() {
			logger.info(LogCategory.Folder, 'Folder updated', {
				folderUuid: options.folderUuid,
				projectUuid: options.projectUuid,
			});

			const invalidations: Promise<void>[] = [
				queryClient.invalidateQueries({
					queryKey: $api.queryOptions('get', '/api/v1/folder/{id}/', {
						params: { path: { id: options.folderUuid } },
					}).queryKey,
				}),
				queryClient.invalidateQueries({
					queryKey: $api.queryOptions('get', '/api/v1/folder/').queryKey,
				}),
			];

			if (options.projectUuid) {
				invalidations.push(
					queryClient.invalidateQueries({
						queryKey: $api.queryOptions('get', '/api/v1/project/{id}/', {
							params: { path: { id: options.projectUuid } },
						}).queryKey,
					}),
					queryClient.invalidateQueries({
						queryKey: $api.queryOptions('get', '/api/v1/project/{id}/folders/', {
							params: { path: { id: options.projectUuid } },
						}).queryKey,
					}),
				);
			}

			await Promise.all(invalidations);

			if (options.toastMessages?.success) {
				globalToastQueue.add(
					{
						message: options.toastMessages.success,
						type: ToastType.Success,
					},
					{ timeout: 2_500 },
				);
			}

			options.onSuccess?.();
		},
		onError(error) {
			logger.error(LogCategory.Folder, 'Failed to update folder', {
				error: error.message,
				folderUuid: options.folderUuid,
			});

			globalToastQueue.add(
				{
					message: options.toastMessages?.error ?? 'Failed to update folder. Please try again.',
					type: ToastType.Error,
				},
				{ timeout: 5_000 },
			);
		},
	});
}
