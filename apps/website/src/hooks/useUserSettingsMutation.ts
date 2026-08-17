'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { globalToastQueue, ToastType } from '@/components/ui/Toast';
import { CURRENT_SETTINGS_VERSION } from '@/schemas/UserSettingsSchema';
import type { UserSettings } from '@/schemas/UserSettingsSchema';
import { $api, openAPIClient } from '@/util/clientFetch';
import { formatErrorMessage } from '@/util/formatErrorMessage';
import { logger, LogCategory } from '@/util/logger';
import type { components } from '@/util/openapiSchema';

type UseUserSettingsMutationOptions = {
	onSuccess?(): void;
};

export function useUserSettingsMutation(options?: UseUserSettingsMutationOptions) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (payload: Partial<UserSettings>) => {
			const currentSettings = queryClient.getQueryData<components['schemas']['User']>(
				$api.queryOptions('get', '/api/v1/user/me/').queryKey,
			)?.settings as Record<string, unknown> | undefined;

			const mergedSettings = {
				...currentSettings,
				...payload,
				version: CURRENT_SETTINGS_VERSION,
			};

			const { error, response } = await openAPIClient.PATCH('/api/v1/user/me/', {
				body: { settings: mergedSettings },
			});

			if (error) {
				throw new Error(formatErrorMessage(error, response));
			}
		},
		async onSuccess() {
			logger.info(LogCategory.Settings, 'User settings updated');

			await queryClient.invalidateQueries({
				queryKey: $api.queryOptions('get', '/api/v1/user/me/').queryKey,
			});

			options?.onSuccess?.();
		},
		onError(error) {
			logger.error(LogCategory.Settings, 'Failed to update user settings', {
				error: error.message,
			});

			void queryClient.invalidateQueries({
				queryKey: $api.queryOptions('get', '/api/v1/user/me/').queryKey,
			});

			globalToastQueue.add(
				{
					message: 'Failed to save preferences. Please try again.',
					type: ToastType.Error,
				},
				{ timeout: 5_000 },
			);
		},
	});
}
