import { useMutation, useQueryClient } from '@tanstack/react-query';
import { globalToastQueue, ToastType } from '@/components/ui/Toast';
import { $api, openAPIClient } from '@/util/clientFetch';
import { formatErrorMessage } from '@/util/formatErrorMessage';
import { logger, LogCategory } from '@/util/logger';
import type { components } from '@/util/openapiSchema';

type ProjectUpdatePayload = Partial<components['schemas']['PatchedProjectUpdatePayloadRequest']>;

type UseProjectUpdateMutationOptions = {
	onSuccess?(): void;
	readonly projectUuid: string;
	readonly toastMessages?: {
		readonly error?: string;
		readonly success?: string;
	};
};

export function useProjectUpdateMutation(options: UseProjectUpdateMutationOptions) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (payload: ProjectUpdatePayload) => {
			const { error, response } = await openAPIClient.PATCH('/api/v1/project/{id}/', {
				params: { path: { id: options.projectUuid } },
				body: payload,
			});

			if (error) {
				throw new Error(formatErrorMessage(error, response));
			}
		},
		async onSuccess() {
			logger.info(LogCategory.Project, 'Project updated', {
				projectUuid: options.projectUuid,
			});

			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: $api.queryOptions('get', '/api/v1/project/{id}/', {
						params: { path: { id: options.projectUuid } },
					}).queryKey,
				}),
				queryClient.invalidateQueries({
					queryKey: $api.queryOptions('get', '/api/v1/project/').queryKey,
				}),
			]);

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
			logger.error(LogCategory.Project, 'Failed to update project', {
				error: error.message,
				projectUuid: options.projectUuid,
			});

			globalToastQueue.add(
				{
					message: options.toastMessages?.error ?? 'Failed to update project. Please try again.',
					type: ToastType.Error,
				},
				{ timeout: 5_000 },
			);
		},
	});
}
