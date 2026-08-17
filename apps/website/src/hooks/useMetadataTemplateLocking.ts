'use client';

import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { useRef } from 'react';
import { useWebSocketMessages } from '@/contexts/WebSocket';
import { $api, openAPIClient } from '@/util/clientFetch';
import { logger, LogCategory } from '@/util/logger';

type UseMetadataTemplateLockingOptions = {
	readonly currentUserEmail?: string;
	readonly metadataTemplateContainerUuid: string;
};

type MetadataTemplateLockStatus = {
	/**
	 * Whether the current user can unlock the template
	 */
	readonly canUnlock: boolean;
	/**
	 * Whether the metadata template is currently locked
	 */
	readonly isLocked: boolean;
	/**
	 * Email of the user who locked the template
	 */
	readonly lockedBy: string | null;
};

type MetadataTemplateLockingReturn = {
	/**
	 * Check if the template is locked (refreshes from server)
	 */
	checkLockStatus(): Promise<unknown>;
	/**
	 * Lock the template for editing
	 */
	lock(): Promise<unknown>;
	/**
	 * Current lock status
	 */
	readonly status: MetadataTemplateLockStatus;
	/**
	 * Unlock the template
	 */
	unlock(): Promise<unknown>;
};

/**
 * Hook for managing metadata template container locking state
 *
 * Combines server state with real-time WebSocket updates for lock status.
 *
 * @example
 * ```tsx
 * const { status, lock, unlock, checkLockStatus } = useMetadataTemplateLocking({
 *   metadataTemplateContainerUuid: 'abc-123',
 *   currentUserEmail: user?.email,
 * });
 *
 * if (status.isLocked && !status.canUnlock) {
 *   return <LockedBanner lockedBy={status.lockedBy} />;
 * }
 * ```
 */
export function useMetadataTemplateLocking({
	metadataTemplateContainerUuid,
	currentUserEmail,
}: UseMetadataTemplateLockingOptions): MetadataTemplateLockingReturn {
	const queryClient = useQueryClient();
	const messages = useWebSocketMessages();

	// Use ref to prevent stale closures when uuid changes
	const uuidRef = useRef(metadataTemplateContainerUuid);
	uuidRef.current = metadataTemplateContainerUuid;

	const { data: lockData } = useSuspenseQuery(
		$api.queryOptions('get', '/api/v1/metadata-template-container/{id}/status/', {
			params: { path: { id: metadataTemplateContainerUuid } },
		}),
	);

	// Check for real-time lock status updates via WebSocket
	const lockMessage = messages[metadataTemplateContainerUuid]?.find((message) => message.type === 'lock_status_changed')
		?.data as { status?: boolean; user?: string } | undefined;

	const isLocked = lockMessage?.status === undefined ? Boolean(lockData?.locked) : Boolean(lockMessage.status);
	const lockedBy = lockData?.locked_by?.email ?? lockMessage?.user ?? null;
	const canUnlock = Boolean(currentUserEmail && lockedBy === currentUserEmail);
	const status: MetadataTemplateLockStatus = { isLocked, lockedBy, canUnlock };

	const invalidateStatus = async () => {
		const currentUuid = uuidRef.current;
		await queryClient.invalidateQueries({
			queryKey: $api.queryOptions('get', '/api/v1/metadata-template-container/{id}/status/', {
				params: { path: { id: currentUuid } },
			}).queryKey,
		});
	};

	const checkLockStatus = async () => {
		const currentUuid = uuidRef.current;
		try {
			logger.debug(LogCategory.MetadataTemplateLocking, 'Checking lock status', {
				metadataTemplateContainerUuid: currentUuid,
			});
			const { data } = await openAPIClient.GET('/api/v1/metadata-template-container/{id}/status/', {
				params: { path: { id: currentUuid } },
			});

			await invalidateStatus();
			return data;
		} catch (error) {
			logger.error(LogCategory.MetadataTemplateLocking, 'Failed to check lock status', {
				metadataTemplateContainerUuid: currentUuid,
				error: error instanceof Error ? error.message : 'Unknown',
			});
			throw error;
		}
	};

	const lock = async () => {
		const currentUuid = uuidRef.current;
		try {
			logger.info(LogCategory.MetadataTemplateLocking, 'Locking template', {
				metadataTemplateContainerUuid: currentUuid,
			});
			const { data } = await openAPIClient.POST('/api/v1/metadata-template-container/{id}/lock/', {
				params: { path: { id: currentUuid } },
			});

			await invalidateStatus();
			logger.debug(LogCategory.MetadataTemplateLocking, 'Template locked successfully', {
				metadataTemplateContainerUuid: currentUuid,
			});
			return data;
		} catch (error) {
			logger.error(LogCategory.MetadataTemplateLocking, 'Failed to lock template', {
				metadataTemplateContainerUuid: currentUuid,
				error: error instanceof Error ? error.message : 'Unknown',
			});
			throw error;
		}
	};

	const unlock = async () => {
		const currentUuid = uuidRef.current;
		try {
			logger.info(LogCategory.MetadataTemplateLocking, 'Unlocking template', {
				metadataTemplateContainerUuid: currentUuid,
			});
			const { data } = await openAPIClient.POST('/api/v1/metadata-template-container/{id}/unlock/', {
				params: { path: { id: currentUuid } },
			});

			await invalidateStatus();
			logger.debug(LogCategory.MetadataTemplateLocking, 'Template unlocked successfully', {
				metadataTemplateContainerUuid: currentUuid,
			});
			return data;
		} catch (error) {
			logger.error(LogCategory.MetadataTemplateLocking, 'Failed to unlock template', {
				metadataTemplateContainerUuid: currentUuid,
				error: error instanceof Error ? error.message : 'Unknown',
			});
			throw error;
		}
	};

	return { status, checkLockStatus, lock, unlock };
}
