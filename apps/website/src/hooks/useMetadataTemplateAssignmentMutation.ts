import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { QueryKey } from '@tanstack/react-query';
import { globalToastQueue, ToastType } from '@/components/ui/Toast';
import { openAPIClient } from '@/util/clientFetch';
import { formatErrorMessage } from '@/util/formatErrorMessage';
import { invalidateUpgradeMetadataStatusQueries } from '@/util/invalidateUpgradeMetadataStatusQueries';
import { logger, LogCategory } from '@/util/logger';

type MetadataTemplateAssignmentMutationOptions = {
	readonly invalidateQueryKey: QueryKey;
	readonly params: { readonly id: string };
	readonly path: '/api/v1/folder/{id}/' | '/api/v1/project/{id}/' | '/api/v1/uploads-dataset/{id}/';
	readonly toastMessages: {
		readonly assigned: string;
		readonly error?: string;
		readonly unassigned: string;
	};
};

export function useMetadataTemplateAssignmentMutation(options: MetadataTemplateAssignmentMutationOptions) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (containerPk: string | null) => {
			const { error, response } = await openAPIClient.PATCH(options.path, {
				params: { path: options.params },
				body: { metadata_template: containerPk },
			});

			if (error) {
				throw new Error(formatErrorMessage(error, response));
			}
		},
		async onSuccess(_data, variables) {
			logger.info(LogCategory.MetadataTemplate, 'Assignment updated', {
				path: options.path,
				assigned: Boolean(variables),
			});
			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: options.invalidateQueryKey,
				}),
				invalidateUpgradeMetadataStatusQueries(queryClient),
			]);

			globalToastQueue.add(
				{
					message: variables ? options.toastMessages.assigned : options.toastMessages.unassigned,
					type: ToastType.Success,
				},
				{ timeout: 2_500 },
			);
		},
		onError(error) {
			logger.error(LogCategory.MetadataTemplate, 'Failed to update metadata template assignment', {
				error: error.message,
				path: options.path,
				params: options.params,
			});

			globalToastQueue.add(
				{
					message: options.toastMessages.error ?? 'Failed to update metadata template assignment. Please try again.',
					type: ToastType.Error,
				},
				{ timeout: 5_000 },
			);
		},
	});
}
